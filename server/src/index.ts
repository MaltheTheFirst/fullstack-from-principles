import { app } from './app.js'

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