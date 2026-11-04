import { app } from "../app.js"
import { pool } from "../db.js"

type TestUser = {
    userId: number
    cookie: string
    cleanup: () => Promise<void>
}

export async function createAuthenticatedTestUser(): Promise<TestUser> {
    let createdUserId: number | null = null

    try {
        const username = `test${crypto.randomUUID().slice(0, 8)}`

        const response = await app.inject({
            method: 'POST',
            url: '/auth/register',
            payload: {
                username: username,
                password: 'testpassword123'
            }
        })

        if (response.statusCode !== 201) {
            throw new Error(`Test user registration failed: ${response.statusCode} ${response.body}`)
        }

        const authData = response.json()

        createdUserId = authData.id

        if (
            typeof createdUserId !== 'number' ||
            !Number.isSafeInteger(createdUserId) ||
            createdUserId <= 0
        ) {
            throw new Error('Registration returned an invalid user ID')
        }

        const loginResponse = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: {
                username: username,
                password: 'testpassword123'
            }
        })

        if (loginResponse.statusCode !== 200) {
            throw new Error(`Login failed: ${loginResponse.statusCode} ${loginResponse.body}`)
        }

        const cookieHeader = loginResponse.headers['set-cookie']

        if (typeof cookieHeader !== 'string') {
            throw new Error('Expected a string Set-Cookie header')
        }

        const session = cookieHeader.split(';')
        const sessionValue = session[0].split('=')[1]

        return({
            userId: createdUserId,
            cookie: `session=${sessionValue}`,
            cleanup: async () => {
                await pool.query(`
                    DELETE FROM users
                    WHERE id = $1
                `, [createdUserId])
            }
        })
    } catch (error) {
        if (createdUserId !== null) {
            await pool.query(`
                DELETE FROM users
                WHERE id = $1;
            `, [createdUserId])
        }

        throw error
    }
}