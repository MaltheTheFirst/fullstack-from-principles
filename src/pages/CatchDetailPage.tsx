import { useParams, Link } from 'react-router'
import { useCatches } from '../context/useCatches'

function CatchDetailPage() {
    const { id } = useParams()
    const catchId = Number(id)

    const { catches } = useCatches()

    const catchItem = catches.find((item) => item.id === catchId)

    if (!catchItem) {
        return (
            <main id="center">
                <h1>Catch not found</h1>
                <Link to="/">Back to Catch Log</Link>
            </main>
        )
    }

    return (
        <main id="center">
            <h1>Catch Details</h1>
            <p>Catch ID: {id}</p>
            <p>{catchItem.fish}</p>
            <p>Length: {catchItem.length}</p>
        </main>
    )
}

export default CatchDetailPage