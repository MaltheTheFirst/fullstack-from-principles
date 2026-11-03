import type { FastifyReply, FastifyRequest } from 'fastify'
import { resolveSession } from './session.js'

export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const session = request.cookies.session

    if (!session) {
        return reply.code(401).send({ error: 'Unauthorized' })
    }

    const validatedSession = await resolveSession(session)

    if (!validatedSession) {
        return reply.code(401).send({ error: 'Unauthorized' })
    }

    request.authenticatedUser = validatedSession
}