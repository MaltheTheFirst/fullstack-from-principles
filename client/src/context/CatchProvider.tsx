import { useState, useEffect, useCallback, useRef } from "react"
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
    const activeControllerRef = useRef<AbortController | null>(null)

    const loadCatches = useCallback(() => {
        activeControllerRef.current?.abort()

        const controller = new AbortController()
        activeControllerRef.current = controller

        fetch('http://127.0.0.1:3001/catches', { 
            signal: controller.signal
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load catches')
            }

            return response.json()
        })
        .then(data => {
            if (activeControllerRef.current === controller && !controller.signal.aborted) {
                setCatches(data)
            }
        })
        .catch((error) => {
            if (error instanceof Error && error.name === 'AbortError') {
                return
            }

            if (activeControllerRef.current !== controller || controller.signal.aborted) {
                return
            }
            
            console.error(error)
            setLoadError('Failed to load catches')
        })
        .finally(() => {
            if (activeControllerRef.current === controller && !controller.signal.aborted) {
                setIsLoadingCatches(false)
            }
        })
    }, [])

    const retryLoadCatches = () => {
        setIsLoadingCatches(true)
        setLoadError(null)
        loadCatches()
    }

    useEffect(() => {
        loadCatches()

        return () => {
            activeControllerRef.current?.abort()
        }
    }, [loadCatches])

    return (
        <CatchContext value={{ catches, setCatches, isLoadingCatches, loadError, retryLoadCatches }}>
            {children}
        </CatchContext>
    )
}