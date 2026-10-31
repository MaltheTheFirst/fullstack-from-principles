import { describe, it, expect, afterAll } from 'vitest'
import { app } from './app.js'
import { pool } from './db.js'

describe('POST /catches persistence', () => {
    it('persists a created catch in PostgreSQL', async () => {
        let createdCatchId: number | null = null

        try {
            const response = await app.inject({
                method: 'POST',
                url: '/catches',
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
                SELECT id, fish, length
                FROM catches
                WHERE id = $1;
            `, [createdCatchId])

            expect(persistence.rows.length).toBe(1)
            expect(persistence.rows[0].fish).toEqual('Dorada')
            expect(persistence.rows[0].length).toBe(35)
        } finally {
            if(createdCatchId !== null) {
                const response = await app.inject({
                    method: 'DELETE',
                    url: `/catches/${createdCatchId}`
                })

                expect(response.statusCode).toBe(204)
            }
        }
    })
})

describe('PATCH /catches/:id persistence', () => {
    it('updates only the requested fields in PostgreSQL', async () => {
        let createdCatchId: number | null = null

        try {
            const postResponse = await app.inject({
                method: 'POST',
                url: '/catches',
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
            if(createdCatchId !== null) {
                const response = await app.inject({
                    method: 'DELETE',
                    url: `/catches/${createdCatchId}`
                })

                expect(response.statusCode).toBe(204)
            }
        }
    })
})

describe('DELETE /catches/:id persistence', () => {
    it('removes a deleted catch from PostgreSQL', async () => {
        let createdCatchId: number | null = null

        try {
            const postResponse = await app.inject({
                method: 'POST',
                url: '/catches',
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
            })

            expect(deleteResponse.statusCode).toBe(204)

            const persistence = await pool.query(`
                SELECT id, fish, length
                FROM catches
                WHERE id = $1;
            `, [createdCatchId])

            expect(persistence.rows.length).toBe(0)
        } finally {
            if(createdCatchId !== null) {
                await pool.query(`
                    DELETE FROM catches
                    WHERE id = $1;
                `, [createdCatchId])
            }
        }
    })
})

afterAll(async () => {
    await app.close()
})