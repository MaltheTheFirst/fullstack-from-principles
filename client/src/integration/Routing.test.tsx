import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { CatchProvider } from '../context/CatchProvider'
import { AuthContext } from '../context/AuthContext'

const testAuth = {
    user: { id: 1, username: 'alice' },
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn()
}

afterEach(() => {
    vi.unstubAllGlobals()
})

test('opens the correct catch detail from the log', async () => {
    vi.stubGlobal('fetch', vi.fn(() => {
        return Promise.resolve({
            ok: true,
            json: async () => [
                { id: 1, fish: 'Horse Mackerel', length: 16 }
            ]
        })
    }))

    render(
        <MemoryRouter initialEntries={['/']}>
            <AuthContext value={testAuth}>
                <CatchProvider>
                    <App />
                </CatchProvider>
            </AuthContext>
        </MemoryRouter>
    )

    fireEvent.click(
        await screen.findByRole('link', { name: 'Horse Mackerel' })
    )

    expect(
        screen.getByRole('heading', { name: 'Catch Details' })
    ).toBeInTheDocument()

    expect(
        screen.getByText('Horse Mackerel')
    ).toBeInTheDocument()

    const navigation = screen.getByRole('navigation', { name: 'Primary' })

    expect(
       screen.getByRole('navigation', { name: 'Primary' }) 
    ).toBeInTheDocument()

    expect(
        within(navigation).getByRole('link', { name: 'Catch Log' })
    ).toBeInTheDocument()

    expect(
        within(navigation).getByRole('link', { name: 'Statistics' })
    ).toBeInTheDocument()

    expect(
        screen.getByRole('main')
    ).toBeInTheDocument()
})

test('shows not found for an invalid catch id', () => {
    render(
        <MemoryRouter initialEntries={['/catches/999999']}>
            <AuthContext value={testAuth}>
                <CatchProvider>
                    <App />
                </CatchProvider>
            </AuthContext>
        </MemoryRouter>
    )

    expect(
        screen.getByRole('heading', { name: 'Catch not found' }
    )).toBeInTheDocument()
})