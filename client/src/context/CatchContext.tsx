import { createContext } from 'react'
import type { Catch } from '../types/Catch'

type CatchContextValue = {
    catches: Catch[]
    setCatches: React.Dispatch<React.SetStateAction<Catch[]>>
}

export const CatchContext = createContext<CatchContextValue | null>(null)