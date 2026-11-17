import { describe, it, expect } from "vitest"
import { app } from '../app.js'
import { pool } from "../db.js"

type AuthorisationTestSetup = {
    aliceUserId: number
    bobUserId: number
    aliceCookie: string
    bobCookie: string
    aliceCatchId: number
    bobCatchId: number
}

async function setupAuthorisationTest(): Promise<AuthorisationTestSetup> {
    let createdAliceId: number | null = null
    let createdBobId: number | null = null

    try {
        const aliceUsername = `alice_${crypto.randomUUID().slice(0, 8)}`
        const bobUsername = `bob_${crypto.randomUUID().slice(0, 8)}`


        const aliceResponse = await app.inject({
            method: 'POST',
            url: '/auth/register',
            payload: {
                username: aliceUsername,
                password: 'testpasswordalice'
            }
        })

        expect(aliceResponse.statusCode).toBe(201)
        createdAliceId = aliceResponse.json().id

        const bobResponse = await app.inject({
            method: 'POST',
            url: '/auth/register',
            payload: {
                username: bobUsername,
                password: 'testpasswordbob'
            }
        })

        expect(bobResponse.statusCode).toBe(201)
        createdBobId = bobResponse.json().id

        const aliceLogin = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                username: aliceUsername,
                password: 'testpasswordalice'
            }
        })

        const bobLogin = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                username: bobUsername,
                password: 'testpasswordbob'
            }
        })

        expect(aliceLogin.statusCode).toBe(200)
        expect(bobLogin.statusCode).toBe(200)

        const aliceCookieHeader = aliceLogin.headers['set-cookie']

        if (typeof aliceCookieHeader !== 'string') {
            throw new Error('Expected Alice session cookie')
        }

        const aliceCookie = aliceCookieHeader.split(';')[0]

        const bobCookieHeader = bobLogin.headers['set-cookie']

        if (typeof bobCookieHeader !== 'string') {
            throw new Error('Expected Bob session cookie')
        }

        const bobCookie = bobCookieHeader.split(';')[0]

        const aliceCatchResponse = await app.inject({
            method: 'POST',
            url: '/catches',
            headers: {
                cookie: aliceCookie
            },
            payload: {
                fish: 'Horse Mackerel',
                length: 16
            }
        })

        expect(aliceCatchResponse.statusCode).toBe(201)

        const bobCatchResponse = await app.inject({
            method: 'POST',
            url: '/catches',
            headers: {
                cookie: bobCookie
            },
            payload: {
                fish: 'Sea Bass',
                length: 32
            }
        })

        expect(bobCatchResponse.statusCode).toBe(201)

        if (createdAliceId === null) {
            throw new Error('Alice ID must not be null')
        }

        if (createdBobId === null) {
            throw new Error('Bob ID must not be null')
        }

        return {
            aliceUserId: createdAliceId,
            bobUserId: createdBobId,
            aliceCookie,
            bobCookie,
            aliceCatchId: aliceCatchResponse.json().id,
            bobCatchId: bobCatchResponse.json().id
        }
    } catch (setupError) {
        try {
            await cleanupAuthorisationTest(createdAliceId, createdBobId)
        } catch (cleanupError) {
            throw new AggregateError(
                [setupError, cleanupError],
                'Test setup and cleanup both failed',
                { cause: cleanupError }
            )
        }

        throw setupError
    }
}

async function cleanupAuthorisationTest(
    aliceUserId: number | null,
    bobUserId: number | null
): Promise<void> {
    const errors: unknown[] = []

    try {
        if (aliceUserId !== null) {
            await pool.query(`
                DELETE FROM users
                WHERE id = $1;
            `, [aliceUserId])
        }
    } catch (error) {
        errors.push(error)
    }

    try {
        if (bobUserId !== null) {
            await pool.query(`
                DELETE FROM users
                WHERE id = $1;
            `, [bobUserId])
        }
    } catch (error) {
        errors.push(error)
    }

    if (errors.length > 0) {
        throw new AggregateError(errors, 'Failed to clean up test users')
    }
}

describe('Catch resource authorisation', () => {
    it('only returns catches belonging to the authenticated user', async () => {
        const setup = await setupAuthorisationTest()

        try {
            const aliceGetResponse = await app.inject({
                method: 'GET',
                url: '/catches',
                headers: {
                    cookie: setup.aliceCookie
                }
            })

            expect(aliceGetResponse.statusCode).toBe(200)

            const bobGetResponse = await app.inject({
                method: 'GET',
                url: '/catches',
                headers: {
                    cookie: setup.bobCookie
                }
            })

            expect(bobGetResponse.statusCode).toBe(200)

            const aliceCatches = aliceGetResponse.json()
            const bobCatches = bobGetResponse.json()

            expect(aliceCatches).toHaveLength(1)
            expect(bobCatches).toHaveLength(1)

            expect(aliceCatches[0].id).toBe(setup.aliceCatchId)
            expect(bobCatches[0].id).toBe(setup.bobCatchId)

            expect(aliceCatches.some(
                (catchItem: { id: number }) => catchItem.id === setup.bobCatchId
            )).toBe(false)

            expect(bobCatches.some(
                (catchItem: { id: number }) => catchItem.id === setup.aliceCatchId
            )).toBe(false)
        } finally {
            await cleanupAuthorisationTest(
                setup.aliceUserId,
                setup.bobUserId
            )
        }
    })

    it('prevents users from modifying another users catch', async () => {
        const setup = await setupAuthorisationTest()

        try {
            const unauthorisedPatch = await app.inject({
                method: 'PATCH',
                url: `/catches/${setup.bobCatchId}`,
                headers: {
                    cookie: setup.aliceCookie
                },
                payload: {
                    fish: 'Hacked Fish'
                }
            })

            expect(unauthorisedPatch.statusCode).toBe(404)

            const bobGetValidation = await app.inject({
                method: 'GET',
                url: '/catches',
                headers: {
                    cookie: setup.bobCookie
                }
            })

            expect(bobGetValidation.statusCode).toBe(200)

            const bobCatchesAfterPatch = bobGetValidation.json()
            const bobCatchAfterPatch = bobCatchesAfterPatch.find(
                (catchItem: { id: number }) => catchItem.id === setup.bobCatchId
            )

            expect(bobCatchAfterPatch?.fish).toBe('Sea Bass')
        } finally {
            await cleanupAuthorisationTest(
                setup.aliceUserId,
                setup.bobUserId
            )
        }
    })

    it('prevents users from deleting another users catch', async () => {
        const setup = await setupAuthorisationTest()

        try {
            const deleteResponse = await app.inject({
                method: 'DELETE',
                url: `/catches/${setup.bobCatchId}`,
                headers: {
                    cookie: setup.aliceCookie
                }
            })

            expect(deleteResponse.statusCode).toBe(404)

            const bobGetResponse = await app.inject({
                method: 'GET',
                url: '/catches',
                headers: {
                    cookie: setup.bobCookie
                }
            })

            expect(bobGetResponse.statusCode).toBe(200)

            const bobCatches = bobGetResponse.json()

            expect(bobCatches).toHaveLength(1)
            expect(bobCatches[0].id).toBe(setup.bobCatchId)
            expect(bobCatches[0].fish).toBe('Sea Bass')
            expect(bobCatches[0].length).toBe(32)

            const bobDeleteResponse = await app.inject({
                method: 'DELETE',
                url: `/catches/${setup.bobCatchId}`,
                headers: {
                    cookie: setup.bobCookie
                }
            })

            expect(bobDeleteResponse.statusCode).toBe(204)

            const bobValidateDeleteResponse = await app.inject({
                method: 'GET',
                url: '/catches',
                headers: {
                    cookie: setup.bobCookie
                }
            })

            expect(bobValidateDeleteResponse.statusCode).toBe(200)

            const bobDeletedCatches = bobValidateDeleteResponse.json()

            expect(bobDeletedCatches).toHaveLength(0)
        } finally {
            await cleanupAuthorisationTest(
                setup.aliceUserId,
                setup.bobUserId
            )
        }
    })

    it('rejects catch requests without a session', async () => {
        const getResponse = await app.inject({
            method: 'GET',
            url: '/catches'
        })

        expect(getResponse.statusCode).toBe(401)

        const postResponse = await app.inject({
            method: 'POST',
            url: '/catches',
            payload: {
                fish: 'Sea Bass',
                length: 32
            }
        })

        expect(postResponse.statusCode).toBe(401)

        const patchResponse = await app.inject({
            method: 'PATCH',
            url: '/catches/1',
            payload: {
                fish: 'Sea Bass'
            }
        })

        expect(patchResponse.statusCode).toBe(401)

        const deleteResponse = await app.inject({
            method: 'DELETE',
            url: '/catches/1'
        })

        expect(deleteResponse.statusCode).toBe(401)
    })

    it('rejects catch requests with an invalid session', async () => {
        const getResponse = await app.inject({
            method: 'GET',
            url: '/catches',
            headers: {
                cookie: 'session=invalid-token'
            }
        })

        expect(getResponse.statusCode).toBe(401)

        const postResponse = await app.inject({
            method: 'POST',
            url: '/catches',
            payload: {
                fish: 'Sea Bass',
                length: 32
            },
            headers: {
                cookie: 'session=invalid-token'
            }
        })

        expect(postResponse.statusCode).toBe(401)

        const patchResponse = await app.inject({
            method: 'PATCH',
            url: '/catches/1',
            payload: {
                fish: 'Sea Bass'
            },
            headers: {
                cookie: 'session=invalid-token'
            }
        })

        expect(patchResponse.statusCode).toBe(401)

        const deleteResponse = await app.inject({
            method: 'DELETE',
            url: '/catches/1',
            headers: {
                cookie: 'session=invalid-token'
            }
        })

        expect(deleteResponse.statusCode).toBe(401)
    })

    it('rejects catch requests with an expired session', async () => {
        const setup = await setupAuthorisationTest()

        try {
            const validationResponse = await app.inject({
                method: 'GET',
                url: '/catches',
                headers: {
                    cookie: setup.aliceCookie
                }
            })

            expect(validationResponse.statusCode).toBe(200)

            const updateExpiry = await pool.query(`
                UPDATE sessions
                SET expires_at = NOW() - INTERVAL '1 minute'
                WHERE user_id = $1;
            `, [setup.aliceUserId])

            expect(updateExpiry.rowCount).toBe(1)

            const getResponse = await app.inject({
                method: 'GET',
                url: '/catches',
                headers: {
                    cookie: setup.aliceCookie
                }
            })

            expect(getResponse.statusCode).toBe(401)
        } finally {
            await cleanupAuthorisationTest(
                setup.aliceUserId,
                setup.bobUserId
            )
        }
    })
})