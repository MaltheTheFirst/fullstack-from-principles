import { describe, it, expect, afterAll } from 'vitest'
import { pool } from './db.js'
import { app } from './app.js'

describe('GET /health', () => {
    it('returns the health status', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ status: 'ok' })
    })
})

describe('POST /catches', () => {
    it('rejects a negative catch length', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/catches',
            payload: {
                fish: 'Dorada',
                length: -5
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects a missing required field', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/catches',
            payload: {
                fish: 'Dorada'
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects a whitespace-only fish name', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/catches',
            payload: {
                fish: ' ',
                length: 42
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects an unknown property', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/catches',
            payload: {
                fish: 'Dorada',
                length: 42,
                isAdmin: true
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects an incorrect numeric type', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/catches',
            payload: {
                fish: 'Dorada',
                length: '42'
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })
})

describe('PATCH /catches/:id', () => {
    it('rejects an empty PATCH body', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/catches/1',
            payload: {}
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects a whitespace-only fish name', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/catches/1',
            payload: {
                fish: ' ',
                length: 42
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects an unknown property', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/catches/1',
            payload: {
                fish: 'Dorada',
                length: 42,
                isAdmin: true
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects a negative catch length', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/catches/1',
            payload: {
                fish: 'Dorada',
                length: -5
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects a nonnumeric catch ID', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/catches/abc',
            payload: {
                fish: 'Dorada'
            }
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects an unsafe integer catch ID', async () => {
        let createdUserId: number | null = null

        try {
            const username = `test${crypto.randomUUID().slice(0, 8)}`

            const registerResponse = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    username: username,
                    password: 'testpassword123'
                }
            })

            expect(registerResponse.statusCode).toBe(201)

            createdUserId = registerResponse.json().id

            const loginResponse = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: {
                    username: username,
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

            const response = await app.inject({
                method: 'PATCH',
                url: '/catches/9007199254740992',
                headers: {
                    cookie: `session=${sessionValue}`
                },
                payload: {
                    fish: 'Dorada'
                }
            })

            expect(response.statusCode).toBe(400)
            expect(response.json()).toMatchObject({
                error: 'ID must be a positive integer'
            })
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

describe('DELETE /catches/:id', () => {
    it('rejects string in id', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/catches/abc',
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })

    it('rejects request when id is 0', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/catches/0',
        })

        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
            code: 'FST_ERR_VALIDATION'
        })
    })
})

afterAll(async () => {
    await app.close()
})