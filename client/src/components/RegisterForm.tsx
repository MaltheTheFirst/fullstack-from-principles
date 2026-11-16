import { useState } from "react"
import { register } from "../api/auth"

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
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
            />
            <button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register'}
            </button>

            {registrationError !== null && (
                <p id='registration-error' role='alert'>
                    {registrationError}
                </p>
            )}

            {registrationSuccess && (
                <p id='registration-success' role='status'>
                    Registration successful! You can now log in
                </p>
            )}
        </form>
    )
}