import { useState } from "react"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import styles from './AuthScreen.module.css'

export function AuthScreen() {
    const [mode, setMode] = useState<'login' | 'register'>('login')

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>
                        {mode === 'login' ? 'Welcome back' : 'Create an account'}
                    </h1>
                    <p>
                        {mode === 'login'
                            ? 'Sign in to manage your catches'
                            : 'Start tracking your fishing catches'
                        }
                    </p>
                </div>

                {mode === 'login' ? <LoginForm /> : <RegisterForm />}

                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className={styles.switchMode}>
                    {mode === 'login' ? 'Create an account' : 'Back to login'}
                </button>
            </div>
        </div>
    )
}