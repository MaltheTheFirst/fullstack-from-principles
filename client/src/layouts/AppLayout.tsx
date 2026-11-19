import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import styles from './AppLayout.module.css'

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
            <header className={styles.header}>
                <nav aria-label="Primary" className={styles.nav}>
                    <ul className={styles.links}>
                        <li>
                            <NavLink 
                                to="/"
                                className={({ isActive }) => isActive ? styles.active : undefined} 
                                end
                            >
                                Catch Log
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/stats"
                                className={({ isActive }) => isActive ? styles.active : undefined}
                                end
                            >
                                Statistics
                            </NavLink>
                        </li>
                        <li className={styles.logoutItem}>
                            <button type='button' onClick={handleLogout} disabled={isLoggingOut} className={styles.logout}>
                                {isLoggingOut ? 'Logging out...' : 'Log Out'}
                            </button>
                        </li>
                    </ul>

                    {logoutError !== null && (
                        <p id='logout-error' role='alert'>
                            {logoutError}
                        </p>
                    )}
                </nav>
            </header>
            
            <main className={styles.main}>
                <Outlet />
            </main>
        </>
    )
}

export default AppLayout