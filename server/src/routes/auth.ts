import type { FastifyInstance } from 'fastify'
import argon2 from 'argon2'
import { pool } from '../db.js'
import { DatabaseError } from 'pg'

type RegisterBody = {
    username: string
    password: string
}

const registerSchema = {
    body: {
        type: 'object',
        required: ['username', 'password'],
        additionalProperties: false,
        properties: {
            username: {
                type: 'string',
                minLength: 3,
                maxLength: 30,
                pattern: '\\S'
            },
            password: {
                type: 'string',
                minLength: 12,
                pattern: '\\S'
            }
        }
    }
}

export async function authRoutes(app: FastifyInstance) {
    app.post<{ Body: RegisterBody }>('/auth/register', {schema: registerSchema}, async (request, reply) => {
        const { username, password } = request.body

        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id
        })

        try {
            const result = await pool.query(`
                INSERT INTO users (username, password_hash)
                VALUES ($1, $2)
                RETURNING id, username;
            `, [username, hashedPassword])

            return reply.code(201).send(result.rows[0])
        } catch (error) {
            if (error instanceof DatabaseError && error.code === '23505') {
                return reply.code(409).send({ error: 'Username already exists'})
            }
            throw error
        }
    })
}