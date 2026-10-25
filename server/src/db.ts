import { Pool } from 'pg'

const db = process.env.DATABASE_URL

if (db === undefined) {
    throw new Error('Database URL must be defined')
}

export const pool = new Pool({
    connectionString: db
})