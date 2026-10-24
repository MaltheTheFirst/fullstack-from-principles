import { useLocalStorage } from "../hooks/useLocalStorage"
import { CatchContext } from "./CatchContext"
import type { ReactNode } from 'react'
import type { Catch } from '../types/Catch'

type CatchProviderProps = {
    children: ReactNode
}

export function CatchProvider({ children }: CatchProviderProps) {
    const [catches, setCatches] = useLocalStorage<Catch[]>("catches", [
        {
            fish: "Horse Mackerel",
            length: 16,
            id: 1
        },
        {
            fish: "Painted Comber",
            length: 12,
            id: 2
        },
        {
            fish: "Guilthead Seabream",
            length: 12,
            id: 3
        }
    ])

    return (
        <CatchContext value={{ catches, setCatches }}>
            {children}
        </CatchContext>
    )
}