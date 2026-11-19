import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import styles from './AuthForm.module.css'

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
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
                <label htmlFor='username'>Username</label>
                <input
                    className={styles.input}
                    required
                    id='username'
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
            </div>
            <div className={styles.field}>
                <label htmlFor='password'>Password</label>
                <input
                    className={styles.input}
                    required
                    id='password'
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type='password'
                />
            </div>
            <button type='submit' disabled={isSubmitting} className={styles.submit}>
                {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>

            {loginError !== null && (
                <p id='login-error' role='alert' className={styles.error}>
                    {loginError}
                </p>
            )}
        </form>
    )
}