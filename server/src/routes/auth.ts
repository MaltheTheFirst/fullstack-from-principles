import type { FastifyInstance } from 'fastify'
import { randomBytes, createHash } from 'node:crypto'
import { DatabaseError } from 'pg'
import { pool } from '../db.js'
import { resolveSession } from '../auth/session.js'
import argon2 from 'argon2'

type RegisterBody = {
    username: string
    password: string
}

type LoginBody = {
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

const loginSchema = {
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
                minLength: 1,
            }
        }
    }
}

const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=65536,p=4,t=3$UlzP2HOhb+P7X5hkqqa8SQ$z5dj17xdS/PlRPIMCAOCBCsHEwU6xzqCNc1Yr+BVCfI'

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

    app.post<{ Body: LoginBody }>('/auth/login', {schema: loginSchema}, async (request, reply) => {
        const { username, password } = request.body

        const result = await pool.query(`
            SELECT id, password_hash
            FROM users
            WHERE username = $1;
        `, [username])

        const user = result.rows[0]

        const hash = user?.password_hash ?? DUMMY_PASSWORD_HASH

        const isPasswordValid = await argon2.verify(hash, password)

        if (user === undefined || !isPasswordValid) {
            return reply.code(401).send({ error: 'Invalid username or password'})
        }

        const sessionToken = randomBytes(32).toString('hex')
        const tokenHash = createHash('sha256').update(sessionToken).digest('hex')
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

        await pool.query(`
            INSERT INTO sessions (user_id, token_hash, expires_at)
            VALUES ($1, $2, $3)
        `, [user.id, tokenHash, expiresAt])

        reply.setCookie('session', sessionToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
        })

        return reply.code(200).send({ message: 'Login successful'})
    })

    app.get('/auth/me', async (request, reply) => {
        const sessionToken = request.cookies.session

        if (!sessionToken) {
            return reply.code(401).send({ error: 'Unauthorized' })
        }

        const validatedSession = await resolveSession(sessionToken)

        if (validatedSession === null) {
            return reply.code(401).send({ error: 'Unauthorized' })
        }

        return reply.code(200).send(validatedSession)
    })
}