import { useState, useEffect, useCallback, useRef } from "react"
import { CatchContext } from "./CatchContext"
import { checkResponse } from "../api/checkResponse"
import { HttpError } from "../api/HttpError"
import { useAuth } from "../hooks/useAuth"
import type { ReactNode } from 'react'
import type { Catch } from '../types/Catch'

type CatchProviderProps = {
    children: ReactNode
}

export function CatchProvider({ children }: CatchProviderProps) {
    const [catches, setCatches] = useState<Catch[]>([])
    const [isLoadingCatches, setIsLoadingCatches] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [hasLoadedCatches, setHasLoadedCatches] = useState(false)
    const activeControllerRef = useRef<AbortController | null>(null)
    const { invalidateSession } = useAuth()

    const loadCatches = useCallback(() => {
        activeControllerRef.current?.abort()

        const controller = new AbortController()
        activeControllerRef.current = controller

        fetch('http://localhost:3001/catches', { 
            signal: controller.signal,
            credentials: 'include'
        })
        .then(response => {
            checkResponse(response, 'Failed to load catches')
            return response.json()
        })
        .then(data => {
            if (activeControllerRef.current === controller && !controller.signal.aborted) {
                setHasLoadedCatches(true)
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
            
            if (error instanceof HttpError) {
                if (error.status === 401) {
                    setLoadError('Your session has expired. Please log in again')
                    invalidateSession()
                } else {
                    setLoadError('Failed to load catches. Please try again')
                }
            } else {
                setLoadError('Unable to complete the request. Please try again.')
            }
            console.error(error)
        })
        .finally(() => {
            if (activeControllerRef.current === controller && !controller.signal.aborted) {
                setIsLoadingCatches(false)
            }
        })
    }, [invalidateSession])

    const retryLoadCatches = useCallback(() => {
        setIsLoadingCatches(true)
        setLoadError(null)
        loadCatches()
    }, [loadCatches])

    const cancelActiveLoad = useCallback(() => {
        activeControllerRef.current?.abort()

        activeControllerRef.current = null
        setIsLoadingCatches(false)
    }, [])

    const handleCreatedCatch = useCallback((createdCatch: Catch) => {
        if (hasLoadedCatches === true) {
            cancelActiveLoad()
            setCatches(currentCatches => [...currentCatches, createdCatch])
        } else {
            retryLoadCatches()
        }
    }, [hasLoadedCatches, cancelActiveLoad, retryLoadCatches])

    useEffect(() => {
        loadCatches()

        return () => {
            activeControllerRef.current?.abort()
        }
    }, [loadCatches])

    return (
        <CatchContext value={{ catches, setCatches, isLoadingCatches, loadError, retryLoadCatches, hasLoadedCatches, cancelActiveLoad, handleCreatedCatch }}>
            {children}
        </CatchContext>
    )
}