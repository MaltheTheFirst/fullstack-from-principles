import { useSpecies } from '../hooks/useSpecies'
import styles from './StatsPage.module.css'

function StatsPage() {
    const { species, loading, error } = useSpecies()

    return (
        <div className={styles.page}>
            <h1>Catch Statistics</h1>

            {loading ? (
                <p>Loading Species...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <ul className={styles.speciesList}>
                    {species.map((item) => (
                        <li key={item.scientificName} className={styles.speciesItem}>
                            <span className={styles.commonName}>
                                {item.name}
                            </span>
                            <span className={styles.scientificName}>
                                {item.scientificName}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default StatsPage