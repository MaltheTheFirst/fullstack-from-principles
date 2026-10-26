import { createContext } from 'react'
import type { Catch } from '../types/Catch'

type CatchContextValue = {
    catches: Catch[]
    setCatches: React.Dispatch<React.SetStateAction<Catch[]>>
    isLoadingCatches: boolean
    loadError: string | null
    retryLoadCatches: () => void
    hasLoadedCatches: boolean
    cancelActiveLoad: () => void
    handleCreatedCatch: (createdCatch: Catch) => void
}

export const CatchContext = createContext<CatchContextValue | null>(null)