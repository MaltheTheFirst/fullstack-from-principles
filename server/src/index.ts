import { pool } from './db.js'
import Fastify from 'fastify'
import cors from '@fastify/cors'

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

const handleHealth = () => {
    return { status: 'ok' }
}

const handleCatches = async () => {
    const result = await pool.query(`
        SELECT id, fish, length
        FROM catches;
    `)

    return result.rows
}

app.get('/health', handleHealth)
app.get('/catches', handleCatches)
app.post<{ Body: CreateCatchBody }>('/catches', async (request, reply) => {
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

    const result = await pool.query(`
        INSERT INTO catches (fish, length)
        VALUES ($1, $2)
        RETURNING id, fish, length;
    `, [fish, length])

    return reply.code(201).send(result.rows[0])
})
app.delete<{ Params: CatchParams }>('/catches/:id', async (request, reply) => {
    const catchId = Number(request.params.id)

    if (!Number.isSafeInteger(catchId) || catchId <= 0) {
        return reply.code(400).send({
            error: 'ID must be a positive integer'
        })
    }

    const result = await pool.query(`
        DELETE FROM catches
        WHERE id = $1
        RETURNING id;   
    `, [catchId])

    if (result.rows.length === 0) {
        return reply.code(404).send('Catch not found')
    }

    return reply.code(204).send()
})
app.patch<{ Body: UpdateCatchBody, Params: CatchParams }>('/catches/:id', async (request, reply) => {
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

    const result = await pool.query(`
        UPDATE catches
        SET
            fish = COALESCE($1, fish),
            length = COALESCE($2, length)
        WHERE id = $3
        RETURNING id, fish, length;
    `, [fish, length, id])

    if (result.rows.length === 0) {
        return reply.code(404).send({
            error: 'Catch not found'
        })
    }

    return reply.code(200).send(result.rows[0])
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