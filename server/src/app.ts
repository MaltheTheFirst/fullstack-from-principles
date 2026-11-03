import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import Fastify from 'fastify'
import { pool } from './db.js'
import { catchRoutes } from './routes/catches.js'
import { authRoutes } from './routes/auth.js'

export const app = Fastify({
    logger: true,
    ajv: {
        customOptions: {
            removeAdditional: false,
            coerceTypes: false
        }
    }
})

app.addHook('onClose', async () => {
    await pool.end()
})

app.decorateRequest('authenticatedUser', null)

await app.register(cors, {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
})

await app.register(cookie)

await app.register(catchRoutes)
await app.register(authRoutes)

const handleHealth = () => {
    return { status: 'ok' }
}

app.get('/health', handleHealth)