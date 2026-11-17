import type { ReactNode } from "react"
import type { CurrentUser } from "../api/auth"
import { getCurrentUser, login as apiLogin, logout as apiLogout } from "../api/auth"
import { useState, useEffect } from "react"
import { AuthContext } from "./AuthContext"
import { AuthScreen } from "../components/AuthScreen"

type AuthProviderProps = {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<CurrentUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function restoreSession() {
            try {
                const currentUser = await getCurrentUser()

                if (!cancelled) {
                    setUser(currentUser)
                }
            } catch {
                if (!cancelled) {
                    setError('Failed to fetch current user')
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        restoreSession()

        return () => {
            cancelled = true
        }
    }, [])
    
    async function login(username: string, password: string) {
        const currentUser = await apiLogin(username, password)
        setUser(currentUser)
    }

    async function logout() {
        await apiLogout()
        setUser(null)
    }


    if (isLoading) {
        return <p>Checking session...</p>
    }

    if (error !== null) {
        return <p>{error}</p>
    }

    return (
        <AuthContext value={ {user, isLoading, error, login, logout }}>
            {user === null ? <AuthScreen/> : children}
        </AuthContext>
    )
}