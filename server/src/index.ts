import Fastify from 'fastify'
import cors from '@fastify/cors'

type Catch = {
    id: number,
    fish: string,
    length: number
}

type CatchParams = {
    id: string
}

type CreateCatchBody = {
    fish: string,
    length: number
}

type UpdateCatchBody= {
    fish?: string,
    length?: number
}

const app = Fastify({ logger: true })

await app.register(cors, {
    origin: 'http://localhost:5173',
    methods: [ 'GET', 'POST', 'PATCH', 'DELETE' ]
})

const catches: Catch[] = [
    { id: 1, fish: 'Horse Mackerel', length: 16 },
    { id: 2, fish: 'Sea Bass', length: 42 }
]

const handleHealth = () => {
    return { status: 'ok' }
}

const handleCatches = () => {
    return catches
}

app.get('/health', handleHealth)
app.get('/catches', handleCatches)
app.post<{ Body: CreateCatchBody }>('/catches', (request, reply) => {
    if (!request.body) {
        return reply.code(400).send({
            error: 'Request body is required'
        })
    }

    const { fish, length } = request.body

    if (
        typeof fish !== "string" || 
        fish.trim() === "" || 
        !Number.isFinite(length) || 
        length <= 0
    ) {
        return reply.code(400).send({
            error: 'Invalid catch data'
        })
    }

    const id = Date.now()

    const newCatch: Catch = {
        id,
        fish,
        length
    }

    catches.push(newCatch)
    return reply.code(201).send(newCatch)
})
app.delete<{ Params: CatchParams }>('/catches/:id', (request, reply) => {
    const catchId = Number(request.params.id)

    if (!Number.isSafeInteger(catchId) || catchId <= 0) {
        return reply.code(400).send({
            error: 'ID must be a positive integer'
        })
    }

    const index = catches.findIndex(catchItem => catchItem.id === catchId)

    if (index === -1) {
        return reply.code(404).send({
            error: 'Catch not found'
        })
    }

    catches.splice(index, 1)
    return reply.code(204).send()
})
app.patch<{ Body: UpdateCatchBody, Params: CatchParams }>('/catches/:id', (request, reply) => {
    if (!request.body) {
        return reply.code(400).send({
            error: 'Request body is required'
        })
    }

    const { fish, length } = request.body
    const id = Number(request.params.id)

    if (fish === undefined && length === undefined) {
        return reply.code(400).send({
            error: 'At least one field must be provided'
        })
    }

    if (fish !== undefined) {
        if (typeof fish !== 'string' || fish.trim() === '') {
            return reply.code(400).send({
                error: 'Invalid fish name'
            })
        }
    }

    if (length !== undefined) {
        if (!Number.isFinite(length) || length <= 0) {
            return reply.code(400).send({
                error: 'Invalid catch length'
            })
        }
    }

    if (!Number.isSafeInteger(id) || id <= 0) {
        return reply.code(400).send({
            error: 'ID must be a positive integer'
        })
    }

    const existingCatch = catches.find(catchItem => catchItem.id === id)

    if (existingCatch === undefined) {
        return reply.code(404).send({
            error: 'Catch not found'
        })
    }

    if (fish !== undefined) {
        existingCatch.fish = fish
    }

    if (length !== undefined) {
        existingCatch.length = length
    }

    return reply.code(200).send(existingCatch)
})

try {
    const address = await app.listen({
        port: 3001,
        host: '127.0.0.1'
    })

    app.log.info(`Server listening at ${address}`)
} catch (error) {
    app.log.error(error)
    process.exit(1)
}