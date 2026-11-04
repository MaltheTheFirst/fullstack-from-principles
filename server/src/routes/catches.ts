import type { FastifyInstance, FastifyRequest } from 'fastify'
import { requireAuth } from '../auth/requireAuth.js'
import { pool } from '../db.js'

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

const handleCatches = async (request: FastifyRequest) => {
    const user = request.authenticatedUser

    if (!user) {
        throw new Error('AuthenticatedUser missing after requireAuth')
    }

    const userId = user.id

    const result = await pool.query(`
        SELECT id, fish, length
        FROM catches
        WHERE user_id = $1;
    `, [userId])

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

export async function catchRoutes(app: FastifyInstance) {
    app.get('/catches', {
        preHandler: requireAuth
    }, handleCatches)
    app.post<{ Body: CreateCatchBody }>('/catches', {
        schema: createCatchSchema,
        preHandler: requireAuth
    }, async (request, reply) => {
        const user = request.authenticatedUser

        if (!user) {
            throw new Error('AuthenticatedUser is missing after requireAuth')
        }

        const userId = user.id

        const { fish, length } = request.body

        const result = await pool.query(`
            INSERT INTO catches (fish, length, user_id)
            VALUES ($1, $2, $3)
            RETURNING id, fish, length;
        `, [fish, length, userId])

        return reply.code(201).send(result.rows[0])
    })
    app.delete<{ Params: CatchParams }>('/catches/:id', {
        schema: catchParamsSchema,
        preHandler: requireAuth
    }, async (request, reply) => {
        const user = request.authenticatedUser

        if (!user) {
            throw new Error('AuthenticatedUser is missing after requireAuth')
        }

        const userId = user.id

        const catchId = Number(request.params.id)

        if (!Number.isSafeInteger(catchId) || catchId <= 0) {
            return reply.code(400).send({
                error: 'ID must be a positive integer'
            })
        }

        const result = await pool.query(`
            DELETE FROM catches
            WHERE id = $1
                AND user_id = $2
            RETURNING id;
        `, [catchId, userId])

        if (result.rows.length === 0) {
            return reply.code(404).send('Catch not found')
        }

        return reply.code(204).send()
    })
    app.patch<{ Body: UpdateCatchBody, Params: CatchParams }>('/catches/:id', {
        schema: {
            body: updateCatchSchema.body,
            params: catchParamsSchema.params
        },
        preHandler: requireAuth
    }, async (request, reply) => {
        const user = request.authenticatedUser

        if (!user) {
            throw new Error('AuthenticatedUser missing after requireAuth')
        }

        const userId = user.id

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
                AND user_id = $4
            RETURNING id, fish, length;
        `, [fish, length, id, userId])

        if (result.rows.length === 0) {
            return reply.code(404).send({
                error: 'Catch not found'
            })
        }

        return reply.code(200).send(result.rows[0])
    })
}