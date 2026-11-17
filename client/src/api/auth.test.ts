import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCurrentUser } from './auth'
import { logout } from './auth'

describe('getCurrentUser', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('returns the user when authenticated', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                id: 1,
                username: 'alice'
            })
        })

        vi.stubGlobal('fetch', fetchMock)

        const user = await getCurrentUser()

        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3001/auth/me',
            { credentials: 'include' }
        )

        expect(user).toEqual({
            id: 1,
            username: 'alice'
        })
    })

    it('returns null when /auth/me returns 401 Unauthorized', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 401
        })

        vi.stubGlobal('fetch', fetchMock)

        const user = await getCurrentUser()

        expect(user).toBeNull()
    })

    it('throws an error when /auth/me returns 500 Internal Server Error', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 500
        })

        vi.stubGlobal('fetch', fetchMock)

        await expect(getCurrentUser()).rejects.toThrow('Failed to load current user')
    })
})

describe('logout', () => {
    it('resolves successfully when the logout request returns 200', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 200
        })

        vi.stubGlobal('fetch', fetchMock)

        await expect(logout()).resolves.toBeUndefined()
        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:3001/auth/logout',
            {
                method: 'POST',
                credentials: 'include'
            }
        )
    })

    it('rejects with an error when the logout request returns 500', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 500
        })

        vi.stubGlobal('fetch', fetchMock)

        await expect(logout()).rejects.toThrow('Failed to log out')
    })
})