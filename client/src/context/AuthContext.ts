import type { CurrentUser } from "../api/auth"
import { createContext } from "react"

type AuthContextValue = {
    user: CurrentUser | null
    isLoading: boolean
    error: string | null
    login: (username: string, password: string) => Promise<void>
    logout: () => Promise<void>
    invalidateSession: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)