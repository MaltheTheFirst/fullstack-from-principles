import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../components/ErrorBoundary'

function BrokenComponent(): React.ReactNode {
    throw new Error("Test error")
}

test('renders fallback UI when a child component throws', () => {
    render(
        <ErrorBoundary>
            <BrokenComponent />
        </ErrorBoundary>
    )

    expect(
        screen.getByRole("heading", { name: 'Something went wrong' })
    ).toBeInTheDocument()
})