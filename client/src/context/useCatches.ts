import { useContext } from 'react'
import { CatchContext } from './CatchContext'

export function useCatches() {
    const context = useContext(CatchContext)

    if (context === null) {
        throw new Error('useCatches must be used within CatchProvider')
    }

    return context
}