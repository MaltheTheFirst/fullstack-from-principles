import type { AuthenticatedUser } from "./session.ts"

declare module 'fastify' {
    interface FastifyRequest {
        authenticatedUser: AuthenticatedUser | null
    }
}