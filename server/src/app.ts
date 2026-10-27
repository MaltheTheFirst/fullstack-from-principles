import cors from '@fastify/cors'
import Fastify from 'fastify'
import { pool } from './db.js'

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

const handleHealth = () => {
    return { status: 'ok' }
}

export const app = Fastify({ 
    logger: true,
    ajv: {
        customOptions: {
            removeAdditional: false,
            coerceTypes: false
        }
    }
})

await app.register(cors, {
    origin: 'http://localhost:5173',
    methods: [ 'GET', 'POST', 'PATCH', 'DELETE' ]
})

const handleCatches = async () => {
    const result = await pool.query(`
        SELECT id, fish, length
        FROM catches;
    `)

    return result.rows
}

const createCatchSchema = {
    body: {
        type: 'object',
        required: ['fish', 'length'],
        additionalProperties: false,
        properties: {
            fish: {
                type: 'string',
                minLength: 1,
                pattern: '\\S'
            },
            length: {
                type: 'number',
                exclusiveMinimum: 0
            }
        }
    }
}

const updateCatchSchema = {
    body: {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        properties: {
            fish: {
                type: 'string',
                minLength: 1,
                pattern: '\\S'
            },
            length: {
                type: 'number',
                exclusiveMinimum: 0
            }
        }
    }
}

const catchParamsSchema = {
    params: {
        type: 'object',
        required: ['id'],
        additionalProperties: false,
        properties: {
            id: {
                type: 'string',
                minLength: 1,
                pattern: '^[1-9][0-9]*$'
            }
        }
    }
}

app.get('/health', handleHealth)
app.get('/catches', handleCatches)
app.post<{ Body: CreateCatchBody }>('/catches', {schema: createCatchSchema}, async (request, reply) => {
    const { fish, length } = request.body
    
    const result = await pool.query(`
        INSERT INTO catches (fish, length)
        VALUES ($1, $2)
        RETURNING id, fish, length;
    `, [fish, length])

    return reply.code(201).send(result.rows[0])
})
app.delete<{ Params: CatchParams }>('/catches/:id', {schema: catchParamsSchema}, async (request, reply) => {
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
app.patch<{ Body: UpdateCatchBody, Params: CatchParams }>('/catches/:id', {
    schema: {
        body: updateCatchSchema.body, 
        params: catchParamsSchema.params
    }
}, async (request, reply) => {
    const { fish, length } = request.body
    const id = Number(request.params.id)

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