import { useState } from "react"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

export function AuthScreen() {
    const [mode, setMode] = useState<'login' | 'register'>('login')

    return (
        <>
            {mode === 'login' ? <LoginForm /> : <RegisterForm />}

            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Create an account' : 'Back to login'}
            </button>
        </>
    )
}