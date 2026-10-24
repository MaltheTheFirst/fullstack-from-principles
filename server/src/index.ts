import Fastify from 'fastify'

type Catch = {
    id: number,
    fish: string,
    length: number
}

const app = Fastify({ logger: true })
const catches: Catch[] = [
    { id: 1, fish: 'Horse Mackerel', length: 16 },
    { id: 2, fish: 'Sea Bass', length: 42 }
]

const handleHealth = () => {
    return { status: 'ok' }
}

const handleCatches = () => {
    return catches
}

app.get('/health', handleHealth)
app.get('/catches', handleCatches)

try {
    const address = await app.listen({
        port: 3001,
        host: '127.0.0.1'
    })

    app.log.info(`Server listening at ${address}`)
} catch (error) {
    app.log.error(error)
    process.exit(1)
}