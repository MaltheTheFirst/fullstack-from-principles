import { useState, useEffect } from "react"
import { CatchContext } from "./CatchContext"
import type { ReactNode } from 'react'
import type { Catch } from '../types/Catch'

type CatchProviderProps = {
    children: ReactNode
}

export function CatchProvider({ children }: CatchProviderProps) {
    const [catches, setCatches] = useState<Catch[]>([])
    const [isLoadingCatches, setIsLoadingCatches] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        fetch('http://127.0.0.1:3001/catches')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load catches')
                }

                return response.json()
            })
            .then(data => setCatches(data))
            .catch((error) => {
                console.error(error)
                setLoadError('Failed to load catches')
            })
            .finally(() => {
                setIsLoadingCatches(false)
            })
    }, [])

    return (
        <CatchContext value={{ catches, setCatches, isLoadingCatches, loadError }}>
            {children}
        </CatchContext>
    )
}