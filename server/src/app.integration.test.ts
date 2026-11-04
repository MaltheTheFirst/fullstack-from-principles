import { describe, it, expect, afterAll } from 'vitest'
import { createAuthenticatedTestUser } from './test/helpers.js'
import { app } from './app.js'
import { pool } from './db.js'
import { create } from 'domain'

describe('POST /catches persistence', () => {
    it('persists a created catch in PostgreSQL', async () => {
        let createdCatchId: number
        let createdUserId: number | null = null

        try {
            const username = `test${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`

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
                method: 'POST',
                url: '/catches',
                headers: {
                    cookie: `session=${sessionValue}`
                },
                payload: {
                    fish: 'Dorada',
                    length: 35
                }
            })

            expect(response.statusCode).toBe(201)

            const catchData = response.json()

            expect(Number.isSafeInteger(catchData.id) && catchData.id > 0).toBe(true)

            createdCatchId = catchData.id

            const persistence = await pool.query(`
                SELECT id, fish, length, user_id
                FROM catches
                WHERE id = $1;
            `, [createdCatchId])

            expect(persistence.rows.length).toBe(1)
            expect(persistence.rows[0].user_id).toBe(createdUserId)
            expect(persistence.rows[0].fish).toEqual('Dorada')
            expect(persistence.rows[0].length).toBe(35)
        } finally {
            if(createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1
                `, [createdUserId])
            }
        }
    })
})

describe('PATCH /catches/:id persistence', () => {
    it('updates only the requested fields in PostgreSQL', async () => {
        let createdCatchId: number
        let createdUserId: number | null = null

        try {
            const username = `test${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`

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

            const postResponse = await app.inject({
                method: 'POST',
                url: '/catches',
                headers: {
                    cookie: `session=${sessionValue}`
                },
                payload: {
                    fish: 'Dorada',
                    length: 35
                }
            })

            expect(postResponse.statusCode).toBe(201)

            const catchData = postResponse.json()

            expect(Number.isSafeInteger(catchData.id) && catchData.id > 0).toBe(true)

            createdCatchId = catchData.id

            const patchResponse = await app.inject({
                method: 'PATCH',
                url: `/catches/${createdCatchId}`,
                headers: {
                    cookie: `session=${sessionValue}`
                },
                payload: {
                    length: 42
                }
            })

            expect(patchResponse.statusCode).toBe(200)

            const persistence = await pool.query(`
                SELECT id, fish, length
                FROM catches
                WHERE id = $1;
            `, [createdCatchId])

            expect(persistence.rows[0].id).toBe(createdCatchId)
            expect(persistence.rows.length).toBe(1)
            expect(persistence.rows[0].fish).toEqual('Dorada')
            expect(persistence.rows[0].length).toBe(42)
        } finally {
            if(createdUserId !== null) {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1
                `, [createdUserId])
            }
        }
    })
})

describe('DELETE /catches/:id persistence', () => {
    it('removes a deleted catch from PostgreSQL', async () => {
        let createdCatchId: number
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

            const postResponse = await app.inject({
                method: 'POST',
                url: '/catches',
                headers: {
                    cookie: `session=${sessionValue}`
                },
                payload: {
                    fish: 'Dorada',
                    length: 35
                }
            })

            expect(postResponse.statusCode).toBe(201)

            const catchData = postResponse.json()

            expect(Number.isSafeInteger(catchData.id) && catchData.id > 0).toBe(true)

            createdCatchId = catchData.id

            const deleteResponse = await app.inject({
                method: 'DELETE',
                url: `/catches/${createdCatchId}`,
                headers: {
                    cookie: `session=${sessionValue}`
                }
            })

            expect(deleteResponse.statusCode).toBe(204)

            const persistence = await pool.query(`
                SELECT id, fish, length
                FROM catches
                WHERE id = $1;
            `, [createdCatchId])

            expect(persistence.rows.length).toBe(0)
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

describe('Catch resource ownership', () => {
    it('only returns catches owned by the authenticated user', async () => {
        const aliceData = await createAuthenticatedTestUser()
        const aliceSession = aliceData.cookie

        try {
            const bobData = await createAuthenticatedTestUser()
            const bobSession = bobData.cookie

            try {
                const alicePostResponse = await app.inject({
                    method: 'POST',
                    url: '/catches',
                    headers: {
                        cookie: `${aliceSession}`
                    },
                    payload: {
                        fish: 'Dorada',
                        length: 35
                    }
                })

                expect(alicePostResponse.statusCode).toBe(201)

                const aliceCatchData = alicePostResponse.json()
                const aliceCatchId = aliceCatchData.id

                const aliceGetResponse = await app.inject({
                    method: 'GET',
                    url: '/catches',
                    headers: {
                        cookie: `${aliceSession}`
                    }
                })

                const aliceCatchIds = aliceGetResponse.json().map(
                    (catchItem: { id: number }) => catchItem.id
                )

                expect(aliceCatchIds).toContain(aliceCatchId)

                const bobGetResponse = await app.inject({
                    method: 'GET',
                    url: '/catches',
                    headers: {
                        cookie: `${bobSession}`
                    }
                })

                const bobCatchIds = bobGetResponse.json().map(
                    (catchItem: { id: number }) => catchItem.id
                )

                expect(bobGetResponse.statusCode).toBe(200)
                expect(bobCatchIds).not.toContain(aliceCatchId)
            } finally {
                await bobData.cleanup()
            }
        } finally {
            await aliceData.cleanup()
        }
    })

    it('assigns newly created catches to the authenticated user', async () => {
        const alice = await createAuthenticatedTestUser()

        try {
            const alicePostResponse = await app.inject({
                method: 'POST',
                url: '/catches',
                headers: {
                    cookie: `${alice.cookie}`
                },
                payload: {
                    fish: 'Dorada',
                    length: 35
                }
            })

            expect(alicePostResponse.statusCode).toBe(201)

            const catchId = alicePostResponse.json().id

            const query = await pool.query(`
                SELECT user_id FROM catches
                WHERE id = $1
            `, [catchId])

            expect(query.rows[0].user_id).toEqual(alice.userId)
        } finally {
            await alice.cleanup()
        }
    })

    it('returns 404 when updating another users catch', async () => {
        const alice = await createAuthenticatedTestUser()

        try {
            const bob = await createAuthenticatedTestUser()

            try {
                const alicePostResponse = await app.inject({
                    method: 'POST',
                    url: '/catches',
                    headers: {
                        cookie: `${alice.cookie}`
                    },
                    payload: {
                        fish: 'Dorada',
                        length: 35
                    }
                })

                expect(alicePostResponse.statusCode).toBe(201)

                const catchId = alicePostResponse.json().id

                const bobPatchResponse = await app.inject({
                    method: 'PATCH',
                    url: `/catches/${catchId}`,
                    headers: {
                        cookie: `${bob.cookie}`
                    },
                    payload: {
                        fish: 'Dorada',
                        length: 50
                    }
                })

                expect(bobPatchResponse.statusCode).toBe(404)

                const aliceGetResponse = await app.inject({
                    method: 'GET',
                    url: '/catches',
                    headers: {
                        cookie: `${alice.cookie}`
                    }
                })

                expect(aliceGetResponse.statusCode).toBe(200)

                const aliceCatch = aliceGetResponse.json().find(
                    (catchItem: { id: number }) => catchItem.id === catchId
                )

                expect(aliceCatch.length).toBe(35)
                expect(aliceCatch.fish).toEqual('Dorada')
            } finally {
                await bob.cleanup()
            }
        } finally {
            await alice.cleanup()
        }
    })

    it('returns 404 when deleting another users catch', async () => {
        const alice = await createAuthenticatedTestUser()

        try {
            const bob = await createAuthenticatedTestUser()

            try {
                const alicePostResponse = await app.inject({
                    method: 'POST',
                    url: '/catches',
                    headers: {
                        cookie: `${alice.cookie}`
                    },
                    payload: {
                        fish: 'Dorada',
                        length: 35
                    }
                })

                expect(alicePostResponse.statusCode).toBe(201)

                const catchId = alicePostResponse.json().id

                const bobDeleteResponse = await app.inject({
                    method: 'DELETE',
                    url: `/catches/${catchId}`,
                    headers: {
                        cookie: `${bob.cookie}`
                    }
                })

                expect(bobDeleteResponse.statusCode).toBe(404)

                const aliceGetResponse = await app.inject({
                    method: 'GET',
                    url: '/catches',
                    headers: {
                        cookie: `${alice.cookie}`
                    }
                })

                expect(aliceGetResponse.statusCode).toBe(200)

                const aliceCatch = aliceGetResponse.json().find(
                    (catchItem: { id: number }) => catchItem.id === catchId
                )

                expect(aliceCatch).toBeDefined()
                expect(aliceCatch.length).toBe(35)
                expect(aliceCatch.fish).toEqual('Dorada')

                const aliceDeleteResponse = await app.inject({
                    method: 'DELETE',
                    url: `/catches/${catchId}`,
                    headers: {
                        cookie: `${alice.cookie}`
                    }
                })

                expect(aliceDeleteResponse.statusCode).toBe(204)

                const aliceVerifyDeleteResponse = await app.inject({
                    method: 'GET',
                    url: `/catches`,
                    headers: {
                        cookie: `${alice.cookie}`
                    }
                })

                const aliceCatchDelete = aliceVerifyDeleteResponse.json().find(
                    (catchItem: { id: number }) => catchItem.id === catchId
                )

                expect(aliceCatchDelete).toBeUndefined()
            } finally {
                await bob.cleanup()
            }
        } finally {
            await alice.cleanup()
        }
    })
})

afterAll(async () => {
    await app.close()
})