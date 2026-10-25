import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { CatchProvider } from '../context/CatchProvider'

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
            <CatchProvider>
                <App />
            </CatchProvider>
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
            <CatchProvider>
                <App />
            </CatchProvider>
        </MemoryRouter>
    )

    expect(
        screen.getByRole('heading', { name: 'Catch not found' }
    )).toBeInTheDocument()
})