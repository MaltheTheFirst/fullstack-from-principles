import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
    children: ReactNode
}

type ErrorBoundaryState = {
    hasError: boolean
}

export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = {
        hasError: false
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return{
            hasError: true
        }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Unhandled render error", error, info)
    }

    render() {
        if (this.state.hasError) {
            return(
                <main id="center">
                    <h1>Something went wrong</h1>
                    <p>The application could not render this page</p>
                </main>
            )
        }

        return this.props.children
    }
}