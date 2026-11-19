import { useState } from "react"
import { register } from "../api/auth"
import styles from './AuthForm.module.css'

export function RegisterForm() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [registrationError, setRegistrationError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [registrationSuccess, setRegistrationSuccess] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)
        setRegistrationError(null)
        setRegistrationSuccess(false)

        try {
            await register(username, password)
            setRegistrationSuccess(true)
        } catch {
            setRegistrationError('Failed to register user') 
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
                    minLength={12}
                    id='password'
                    type='password'
                    aria-describedby='password-hint'
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <p className={styles.hint} id='password-hint'>
                    Use at least 12 characters
                </p>
            </div>
            <button type='submit' disabled={isSubmitting} className={styles.submit}>
                {isSubmitting ? 'Registering...' : 'Register'}
            </button>

            {registrationError !== null && (
                <p id='registration-error' role='alert' className={styles.error}>
                    {registrationError}
                </p>
            )}

            {registrationSuccess && (
                <p id='registration-success' role='status' className={styles.success}>
                    Registration successful! You can now log in
                </p>
            )}
        </form>
    )
}