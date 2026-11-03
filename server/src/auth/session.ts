import { createHash } from 'node:crypto'
import { pool } from '../db.js'

export type AuthenticatedUser = {
    id: number
    username: string
}

export async function resolveSession(sessionToken: string): Promise<AuthenticatedUser | null> {
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex')

    const result = await pool.query(`
        SELECT user_id
        FROM sessions
        WHERE token_hash = $1
            AND expires_at > NOW();
    `, [tokenHash])

    if (result.rows.length === 0) {
        return null
    }

    const userId = result.rows[0].user_id

    const userResult = await pool.query(`
        SELECT id, username
        FROM users
        WHERE id = $1;
    `, [userId])

    if (userResult.rows.length === 0) {
        return null
    }

    return(userResult.rows[0])
}