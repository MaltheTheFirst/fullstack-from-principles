import { Link, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

function AppLayout() {
    const { logout } = useAuth()
    const [logoutError, setLogoutError] = useState<string | null>(null)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    async function handleLogout() {
        setLogoutError(null)
        setIsLoggingOut(true)

        try {
            await logout()
        } catch {
            setLogoutError('Logout was unsuccessful')
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <>
            <nav aria-label="Primary">
                <ul>
                    <li>
                        <Link to="/">Catch Log</Link>
                    </li>
                    <li>
                        <Link to="/stats">Statistics</Link>
                    </li>
                    <li>
                        <button type='button' onClick={handleLogout} disabled={isLoggingOut}>
                            {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </button>
                    </li>
                </ul>

                {logoutError !== null && (
                    <p id='login-error' role='alert'>
                        {logoutError}
                    </p>
                )}
            </nav>

            <Outlet />
        </>
    )
}

export default AppLayout