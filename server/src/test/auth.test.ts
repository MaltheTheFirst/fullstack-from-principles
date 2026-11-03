import { describe, it, expect, afterAll } from 'vitest'
import { app } from '../app.js'
import { pool } from '../db.js'
import { createHash } from 'node:crypto'
import { requireAuth } from '../auth/requireAuth.js'
import argon2 from 'argon2'

app.get('/test/protected', {
    preHandler: requireAuth
}, async (request) => {
    return { user: request.authenticatedUser }
})

describe('POST /auth/register', () => {
    it('creates a user and returns their public information', async () => {
        let createdUserId: number | null = null

        try {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            expect(response.statusCode).toBe(201)

            const authData = response.json()

            expect(authData.username).toEqual('testuser')
            expect(authData).not.toHaveProperty('password')
            expect(authData).not.toHaveProperty('password_hash')
            expect(Number.isSafeInteger(authData.id) && authData.id > 0).toBe(true)

            createdUserId = authData.id

            const persistence = await pool.query(`
                SELECT id, username
                FROM users
                WHERE id = $1;
            `, [createdUserId])

            expect(persistence.rows.length).toBe(1)
            expect(persistence.rows[0].username).toEqual('testuser')
            expect(persistence.rows[0].id).toEqual(createdUserId)
        } finally {
            if(createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })

    it('returns 409 when the username already exists', async () => {
        let createdUserId: number | null = null

        try {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'duplicate_testuser',
                    password: 'testpassword123'
                }
            })

            expect(response.statusCode).toBe(201)

            const authData = response.json()

            expect(authData.username).toEqual('duplicate_testuser')
            expect(authData).not.toHaveProperty('password')
            expect(authData).not.toHaveProperty('password_hash')
            expect(Number.isSafeInteger(authData.id) && authData.id > 0).toBe(true)

            createdUserId = authData.id

            const duplicateResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'duplicate_testuser',
                    password: 'testpassword123'
                }
            })

            expect(duplicateResponse.statusCode).toBe(409)
            expect(duplicateResponse.json().error).toBe('Username already exists')

            const persistence = await pool.query(`
                SELECT id, username
                FROM users
                WHERE username = $1;
            `, [authData.username])

            expect(persistence.rows.length).toBe(1)
            expect(persistence.rows[0].username).toEqual('duplicate_testuser')
            expect(persistence.rows[0].id).toBe(createdUserId)
        } finally {
            if(createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })

    it('returns 400 for invalid registration data', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/auth/register',
            payload: {
                username: 'ab',
                password: 'abc'
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })

        const query = await pool.query(`
            SELECT id, username
            FROM users
            WHERE username = $1;
        `, ['ab'])

        expect(query.rows.length).toBe(0)
    })

    it('stores a verifiable Argon2id password hash', async () => {
        let createdUserId: number | null = null

        try {
            const plaintextPassword = 'testpassword123'

            const response = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: plaintextPassword
                }
            })

            expect(response.statusCode).toBe(201)

            const authData = response.json()

            expect(authData.username).toEqual('testuser')
            expect(authData).not.toHaveProperty('password')
            expect(authData).not.toHaveProperty('password_hash')
            expect(Number.isSafeInteger(authData.id) && authData.id > 0).toBe(true)

            createdUserId = authData.id

            const query = await pool.query(`
                SELECT password_hash
                FROM users
                WHERE id = $1;
            `, [createdUserId])

            expect(query.rows[0].password_hash).not.toBe(plaintextPassword)

            expect(query.rows[0].password_hash).toMatch(/^\$argon2id\$/)

            const isPasswordValid = await argon2.verify(query.rows[0].password_hash, plaintextPassword)
            expect(isPasswordValid).toBe(true)

            const invalidPassword = await argon2.verify(query.rows[0].password_hash, 'wrongpassword')
            expect(invalidPassword).toBe(false)
        } finally {
            if(createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })
})

describe('POST /auth/login', () => {
    it('creates a session and return a HttpOnly cookie for valid credentials', async () => {
        let createdUserId: number | null = null

        try {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            expect(registerResponse.statusCode).toBe(201)
            createdUserId = registerResponse.json().id

            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            const loginData = loginResponse.json()
            const cookieHeader = loginResponse.headers['set-cookie']

            expect(cookieHeader).toContain('HttpOnly')
            expect(loginResponse.statusCode).toBe(200)
            expect(loginData).toEqual({ message: 'Login successful'})

            const sessionResult = await pool.query(`
                SELECT id, token_hash, expires_at
                FROM sessions
                WHERE user_id = $1;
            `, [createdUserId])

            expect(sessionResult.rows.length).toBe(1)

            if (typeof cookieHeader !== 'string') {
                throw new Error('Expected a string Set-Cookie header')
            }

            const session = cookieHeader.split(';')
            const sessionValue = session[0].split('=')[1]

            const hashedSessionValue = createHash('sha256').update(sessionValue).digest('hex')

            expect(sessionResult.rows[0].token_hash).toEqual(hashedSessionValue)
        } finally {
            if (createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })

    it('rejects an incorrect password without creating a session', async () => {
        let createdUserId: number | null = null

        try {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            expect(registerResponse.statusCode).toBe(201)
            createdUserId = registerResponse.json().id

            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    username: 'testuser',
                    password: 'wrongpassword'
                }
            })

            expect(loginResponse.statusCode).toBe(401)
            expect(loginResponse.json()).toEqual({ error: 'Invalid username or password'})

            const sessionResult = await pool.query(`
                SELECT id, token_hash, expires_at
                FROM sessions
                WHERE user_id = $1;
            `, [createdUserId])

            expect(sessionResult.rows.length).toBe(0)
            expect(loginResponse.headers['set-cookie']).toBeUndefined()
        } finally {
            if (createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })

    it('rejects an unknown username without creating a session', async () => {
        let createdUserId: number | null = null

        try {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            expect(registerResponse.statusCode).toBe(201)
            createdUserId = registerResponse.json().id

            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    username: 'wronguser',
                    password: 'testpassword123'
                }
            })

            expect(loginResponse.statusCode).toBe(401)
            expect(loginResponse.json()).toEqual({ error: 'Invalid username or password'})

            const sessionResult = await pool.query(`
                SELECT COUNT(*)
                FROM sessions;
            `)

            expect(sessionResult.rows[0].count).toBe('0')
            expect(loginResponse.headers['set-cookie']).toBeUndefined()
        } finally {
            if (createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })
})

describe('GET /auth/me', () => {
    it('returns the authenticated user for a valid session', async () => {
        let createdUserId: number | null = null

        try {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            expect(registerResponse.statusCode).toBe(201)
            createdUserId = registerResponse.json().id

            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            const loginData = loginResponse.json()
            const cookieHeader = loginResponse.headers['set-cookie']

            expect(cookieHeader).toContain('HttpOnly')
            expect(loginResponse.statusCode).toBe(200)
            expect(loginData).toEqual({ message: 'Login successful'})

            const sessionResult = await pool.query(`
                SELECT id, token_hash, expires_at
                FROM sessions
                WHERE user_id = $1;
            `, [createdUserId])

            expect(sessionResult.rows.length).toBe(1)

            if (typeof cookieHeader !== 'string') {
                throw new Error('Expected a string Set-Cookie header')
            }

            const session = cookieHeader.split(';')
            const sessionValue = session[0].split('=')[1]

            const getResponse = await app.inject({
                method: 'GET',
                url: '/auth/me',
                headers: {
                    cookie: `session=${sessionValue}`
                }
            })

            const getResponseData = getResponse.json()

            expect(getResponse.statusCode).toBe(200)
            expect(getResponseData.username).toBe('testuser')
            expect(getResponseData.id).toBe(createdUserId)
        } finally {
            if (createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })

    it('rejects requests without a session cookie', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/auth/me'
        })

        const responseData = response.json()

        expect(response.statusCode).toBe(401)
        expect(responseData).toEqual({ error: 'Unauthorized' })
    })

    it('rejects an unknown session token', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/auth/me',
            headers: {
                cookie: 'session=invalidtoken'
            }
        })

        const responseData = response.json()

        expect(response.statusCode).toBe(401)
        expect(responseData).toEqual({ error: 'Unauthorized' })
    })

    it('rejects an expired session', async () => {
        let createdUserId: number | null = null

        try {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            expect(registerResponse.statusCode).toBe(201)
            createdUserId = registerResponse.json().id

            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            const loginData = loginResponse.json()
            const cookieHeader = loginResponse.headers['set-cookie']

            expect(cookieHeader).toContain('HttpOnly')
            expect(loginResponse.statusCode).toBe(200)
            expect(loginData).toEqual({ message: 'Login successful'})

            const sessionResult = await pool.query(`
                UPDATE sessions
                SET expires_at = NOW() - INTERVAL '1 day'
                WHERE user_id = $1
                RETURNING id, expires_at;
            `, [createdUserId])

            expect(sessionResult.rows.length).toBe(1)

            if (typeof cookieHeader !== 'string') {
                throw new Error('Expected a string Set-Cookie header')
            }

            const session = cookieHeader.split(';')
            const sessionValue = session[0].split('=')[1]

            const getResponse = await app.inject({
                method: 'GET',
                url: '/auth/me',
                headers: {
                    cookie: `session=${sessionValue}`
                }
            })

            const getResponseData = getResponse.json()

            expect(getResponse.statusCode).toBe(401)
            expect(getResponseData).toEqual({ error: 'Unauthorized' })
        } finally {
            if (createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })
})

describe('requireAuth preHandler', () => {
    it('rejects a missing cookie', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/test/protected'
        })

        expect(response.statusCode).toBe(401)
        expect(response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('rejects an invalid cookie', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/test/protected',
            headers: {
                cookie: 'session=invalidsession'
            }
        })

        expect(response.statusCode).toBe(401)
        expect(response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('allows a valid session and exposes the authenticated user', async () => {
        let createdUserId: number | null = null

        try {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            expect(registerResponse.statusCode).toBe(201)
            createdUserId = registerResponse.json().id

            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    username: 'testuser',
                    password: 'testpassword123'
                }
            })

            const loginData = loginResponse.json()
            const cookieHeader = loginResponse.headers['set-cookie']

            expect(cookieHeader).toContain('HttpOnly')
            expect(loginResponse.statusCode).toBe(200)
            expect(loginData).toEqual({ message: 'Login successful'})

            if (typeof cookieHeader !== 'string') {
                throw new Error('Expected a string Set-Cookie header')
            }

            const session = cookieHeader.split(';')
            const sessionValue = session[0].split('=')[1]

            const getResponse = await app.inject({
                method: 'GET',
                url: '/test/protected',
                headers: {
                    cookie: `session=${sessionValue}`
                }
            })

            const getResponseData = getResponse.json()

            expect(getResponse.statusCode).toBe(200)
            expect(getResponseData.user.username).toBe('testuser')
            expect(getResponseData.user.id).toBe(createdUserId)
        } finally {
            if (createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1;
                `, [createdUserId])
            }
        }
    })
})

afterAll(async () => {
    await app.close()
})