import { useState } from "react"
import { useAuth } from "../hooks/useAuth"

export function LoginForm() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { login } = useAuth()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)
        setLoginError(null)

        try {
            await login(username, password)
        } catch {
            setLoginError('Invalid username or password')
        } finally {
            setIsSubmitting(false)
        }
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor='username'>Username</label>
            <input
                required
                id='username'
                value={username}
                onChange={(event) => setUsername(event.target.value)}
            />
            <label htmlFor='password'>Password</label>
            <input
                required
                id='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type='password'
            />
            <button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>

            {loginError !== null && (
                <p id='login-error' role='alert'>
                    {loginError}
                </p>
            )}
        </form>
    )
}