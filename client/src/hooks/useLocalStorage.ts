import { useEffect, useState } from 'react'

export function useLocalStorage<T> (
    key: string,
    initialValue: T
 ) {
    const [value, setValue] = useState<T>(() => {
        const storedValue = localStorage.getItem("catches")

        if (storedValue === null) {
        return initialValue
        }
        
    return JSON.parse(storedValue)
    })

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value))
    }, [key, value])

    return [value, setValue] as const
}