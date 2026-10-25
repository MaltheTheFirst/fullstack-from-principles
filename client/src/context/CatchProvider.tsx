import { useState, useEffect } from "react"
import { CatchContext } from "./CatchContext"
import type { ReactNode } from 'react'
import type { Catch } from '../types/Catch'

type CatchProviderProps = {
    children: ReactNode
}

export function CatchProvider({ children }: CatchProviderProps) {
    const [catches, setCatches] = useState<Catch[]>([])

    useEffect(() => {
        fetch('http://127.0.0.1:3001/catches')
            .then(response => response.json())
            .then(data => setCatches(data))
    }, [])

    return (
        <CatchContext value={{ catches, setCatches }}>
            {children}
        </CatchContext>
    )
}