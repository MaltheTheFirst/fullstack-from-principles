import { createContext } from "react"
import type { CurrentUser } from "../api/auth"

type AuthContextValue = {
    user: CurrentUser | null
    isLoading: boolean
    error: string | null
    login: (username: string, password: string) => Promise<void>
    logout: () => Promise<void>
    invalidateSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)