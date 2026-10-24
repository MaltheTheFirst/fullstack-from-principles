import { useSpecies } from '../hooks/useSpecies'

function StatsPage() {
    const { species, loading, error } = useSpecies()

    if (loading) {
        return (
            <main id="center">
                <p>Loading Species...</p>
            </main>
        )
    }

    if (error) {
        return (
            <main id="center">
                <p>{error}</p>
            </main>
        )
    }

    return (
        <main id="center">
            <h1>Catch Statistics</h1>
            <p>Stats page</p>

            <ul>
                {species.map((item) => (
                    <li key={item.scientificName}>
                        {item.name} - {item.scientificName}
                    </li>
                ))}
            </ul>
        </main>
    )
}

export default StatsPage