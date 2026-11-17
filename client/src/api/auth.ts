export type CurrentUser = {
    id: number
    username: string
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const response = await fetch('http://localhost:3001/auth/me', {
        credentials: 'include'
    })

    if (response.status === 401) {
        return null
    }

    if (!response.ok) {
        throw new Error('Failed to load current user')
    }

    const user = await response.json()

    return user
}

export async function login(username: string, password: string): Promise<CurrentUser> {
    const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            username,
            password
        })
    })

    if (!response.ok) {
        throw new Error('Failed to log in')
    }

    const currentUser = await getCurrentUser()

    if (currentUser === null) {
        throw new Error('Failed to fetch authenticated user')
    }

    return currentUser
}

export async function register(username: string, password: string): Promise<CurrentUser> {
    const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username, password
        })
    })

    if (!response.ok) {
        throw new Error('Failed to register user')
    }

    const user = await response.json()

    return (user)
}

export async function logout(): Promise<void> {
    const response = await fetch('http://localhost:3001/auth/logout', {
        method: 'POST',
        credentials: 'include'
    })

    if (!response.ok) {
        throw new Error('Failed to log out')
    }
}