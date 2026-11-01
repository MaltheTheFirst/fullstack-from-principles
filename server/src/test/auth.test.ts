import { describe, it, expect, afterAll } from 'vitest'
import { app } from '../app.js'
import { pool } from '../db.js'
import argon2 from 'argon2'

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

afterAll(async () => {
    await app.close()
})