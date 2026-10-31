import { pool } from "../db.js";

export async function setup() {
    try {
        const result = await pool.query(`
            SELECT identifier FROM public.test_environment;
        `)

        if (result.rows.length !== 1) {
            throw new Error('Database identity verification failed')
        }

        if (result.rows[0].identifier !== "fullstack-from-principles-test") {
            throw new Error('Database identity verification failed')
        }
    } finally {
        await pool.end()
    }
}