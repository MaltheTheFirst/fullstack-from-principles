import { useState, useEffect } from 'react'

type Species = {
    name: string
    scientificName: string
}

export function useSpecies() {
    const [species, setSpecies] = useState<Species[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()

        async function loadSpecies() {
            try {
                const response = await fetch('/species.json', {
                    signal: controller.signal
                })

                if (!response.ok) {
                    throw new Error('Failed to load species')
                }

                const data = await response.json()

                setSpecies(data)
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return
                }

                setError('Could not load species')
            } finally {
                setLoading(false)
            }

            return () => {
                controller.abort()
            }
        }

        loadSpecies()
    }, [])

    return { species, loading, error }
}