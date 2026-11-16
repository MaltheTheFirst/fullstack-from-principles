import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

export function useAuth() {
    const auth = useContext(AuthContext)

    if (auth === null) {
        throw new Error('useAuth must be used within catch provider')
    }

    return auth
}