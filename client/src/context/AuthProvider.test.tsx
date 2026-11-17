import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from './AuthProvider'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import * as authApi from '../api/auth'

vi.mock('../api/auth', () => ({
    getCurrentUser: vi.fn(),
    logout: vi.fn()
}))

function LogoutButton() {
    const { logout } = useAuth()
    const [error, setError] = useState<string | null>(null)

    async function handleLogout() {
        try {
            await logout()
        } catch {
            setError('Logout failed')
        }
    }

    return (
        <>
            <button onClick={() => void handleLogout()}>
                Logout
            </button>
            {error && <p role='alert'>{error}</p>}
        </>
    )
}

describe('AuthProvider logout', () => {
    it('removes authenticated content after a successful logout', async () => {
        const mockedGetCurrentUser = vi.mocked(authApi.getCurrentUser)
        const mockedLogout = vi.mocked(authApi.logout)

        mockedGetCurrentUser.mockResolvedValue({
            id: 1,
            username: 'alice'
        })

        mockedLogout.mockResolvedValue(undefined)

        render(
            <AuthProvider>
                <p>Authenticated application</p>
                <LogoutButton />
            </AuthProvider>
        )

        expect(
            await screen.findByText('Authenticated application')
        ).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

        await waitFor(() => {
            expect(
                screen.queryByText('Authenticated application')
            ).not.toBeInTheDocument()
        })

        expect(mockedLogout).toHaveBeenCalledTimes(1)

        expect(
            screen.getByRole('button', { name: 'Create an account' })
        ).toBeInTheDocument()
    })

    it('preserves authenticated content when logout fails', async () => {
        const mockedGetCurrentUser = vi.mocked(authApi.getCurrentUser)
        const mockedLogout = vi.mocked(authApi.logout)

        mockedGetCurrentUser.mockResolvedValue({
            id: 1,
            username: 'alice'
        })

        mockedLogout.mockRejectedValue(new Error('Failed to log out'))

        render(
            <AuthProvider>
                <p>Authenticated application</p>
                <LogoutButton />
            </AuthProvider>
        )

        expect(
            await screen.findByText('Authenticated application')
        ).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

        expect(
            await screen.findByRole('alert')
        ).toHaveTextContent('Logout failed')

        expect(mockedLogout).toHaveBeenCalledTimes(1)

        expect(
            await screen.findByText('Authenticated application')
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', { name: 'Create an account' })
        ).not.toBeInTheDocument()
    })
})