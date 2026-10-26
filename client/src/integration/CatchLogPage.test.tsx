import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useContext } from 'react'
import CatchLogPage from '../pages/CatchLogPage'
import { CatchProvider } from '../context/CatchProvider'
import { useCatchLog } from '../hooks/useCatchLog'
import { CatchContext } from '../context/CatchContext'

function CatchSubmissionHarness() {
    const { 
        handleSubmit,
        formState,
        handleFishChange,
        handleLengthChange,
    } = useCatchLog()

    return (
        <form onSubmit={handleSubmit}>
            <input
                id='test-fish'
                value={formState.fish}
                onChange={(event) => handleFishChange(event.target.value)}
            />
            <label htmlFor="test-fish">Fish</label>
            <input
                id='test-length'
                value={formState.length}
                onChange={(event) => handleLengthChange(event.target.value)}
            />
            <label htmlFor="test-length">Length</label>
            <button type="submit">Submit</button>
        </form>
    )
}

function RetryHarness() {
    const context = useContext(CatchContext)

    if (!context) {
        throw new Error('RetryHarness must be used within CatchProvider')
    }

    const { retryLoadCatches } = context

    return (
        <button type="button" onClick={retryLoadCatches}>
            Force retry
        </button>
    )
}

afterEach(() => {
    vi.unstubAllGlobals()
})

test('adds a catch through the catch log', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, options) => {
        const method = options?.method ?? 'GET'

        if (method === 'POST') {
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    id: 3,
                    fish: 'Sea Bass',
                    length: 42
                })
            })
        }

        return Promise.resolve({
            ok: true,
            json: async () => []
        })
    }))

    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    fireEvent.change(
        screen.getByLabelText('Fish'),
        { target: { value: 'Sea Bass' } }
    )

    fireEvent.change(
        screen.getByLabelText('Length'),
        { target: { value: '42' } }
    )

    fireEvent.click(
        screen.getByRole('button', { name: 'Add Catch' })
    )

    expect(await screen.findByText('Sea Bass')).toBeInTheDocument()
})

test('deletes a catch from the catch log', async () => {
    vi.stubGlobal('fetch', vi.fn(() => 
        Promise.resolve({
            ok: true,
            json: async () => [
                { id: 1, fish: 'Horse Mackerel', length: 16 }
            ]
        })
    ))

    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    expect(await screen.findByText('Horse Mackerel')).toBeInTheDocument()

    const horseMackerel = screen.getByText('Horse Mackerel')
    const catchItem = horseMackerel.closest('li')

    if (!catchItem) {
        throw new Error('Catch item not found')
    }

    fireEvent.click(
        within(catchItem).getByRole('button', { name: 'Delete' })
    )

    await waitFor(() => {
        expect(screen.queryByText('Horse Mackerel')).not.toBeInTheDocument()
    })
})

test('edits a catch through the catch log', async () => {
    vi.stubGlobal('fetch', 
        vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { id: 1, fish: 'Horse Mackerel', length: 16 }
                ]
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 1,
                    fish: 'Atlantic Mackerel',
                    length: 16
                })
            })
    )

    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    const horseMackerel = await screen.findByText('Horse Mackerel')
    const catchItem = horseMackerel.closest('li')

    if (!catchItem) {
        throw new Error('Catch item not found')
    }

    fireEvent.click(
        within(catchItem).getByRole('button', { name: 'Edit' })
    )

    expect(
        screen.getByPlaceholderText('Name of fish')
    ).toHaveValue('Horse Mackerel')

    expect(
        screen.getByPlaceholderText('Length')
    ).toHaveValue(16)

    fireEvent.change(
        screen.getByPlaceholderText('Name of fish'),
        { target: { value: 'Atlantic Mackerel' } }
    )

    fireEvent.click(
        screen.getByRole('button', { name: 'Save Edit' })
    )

    expect(
        await screen.findByText('Atlantic Mackerel')
    ).toBeInTheDocument()

    expect(
        screen.queryByText('Horse Mackerel')
    ).not.toBeInTheDocument()
})

test('shows validation feedback for an invalid catch', () => {
    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    fireEvent.click(
        screen.getByRole('button', { name: 'Add Catch' })
    )

    expect(
        screen.getByText('Enter a fish name')
    ).toBeInTheDocument()

    expect(
        screen.getByText('Enter a length greater than 0')
    ).toBeInTheDocument()
})

test('clears validation feedback when the user edits the form', () => {
    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    fireEvent.click(
        screen.getByRole('button', { name: 'Add Catch' })
    )

    expect(
        screen.getByText('Enter a fish name')
    ).toBeInTheDocument()

    expect(
        screen.getByText('Enter a length greater than 0')
    ).toBeInTheDocument()

    fireEvent.change(
        screen.getByLabelText('Fish'),
        { target: { value: 'Sea Bass' } }
    )

    expect(
        screen.queryByText('Enter a fish name')
    ).not.toBeInTheDocument()

    expect(
        screen.queryByText('Enter a length greater than 0')
    ).toBeInTheDocument()
})

test('prevents overlapping catch creation requests', async () => {
    let resolvePost!: (response: Response) => void

    const pendingPost = new Promise<Response>((resolve) => {
        resolvePost = resolve
    })

    const fetchMock = vi.fn((_url, options) => {
        const method = options?.method ?? 'GET'

        if (method === 'POST') {
            return pendingPost
        }

        return Promise.resolve({
            ok: true,
            json: async () => []
        })
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchSubmissionHarness />
            </CatchProvider>
        </MemoryRouter>
    )

    fireEvent.change(
        screen.getByLabelText('Fish'),
        { target: { value: 'Sea Bass' } }
    )

    fireEvent.change(
        screen.getByLabelText('Length'),
        { target: { value: '42' } }
    )

    fireEvent.click(
        screen.getByRole('button', { name: 'Submit' })
    )

    expect(fetchMock.mock.calls.length).toBe(2)

    const countPostCalls = () => {
        return fetchMock.mock.calls.filter(
            ([, options]) => options?.method === 'POST'
        ).length
    }

    expect(countPostCalls()).toBe(1)

    fireEvent.submit(
        screen.getByRole('button', { name: 'Submit' }).closest('form')!
    )

    expect(countPostCalls()).toBe(1)

    await act(async () => {
        resolvePost({
            ok: true,
            json: async () => ({
                id: 3,
                fish: 'Sea Bass',
                length: 42
            })
        } as Response)
    })

    fireEvent.change(
        screen.getByLabelText('Fish'),
        { target: { value: 'Sea Bass' } }
    )

    fireEvent.change(
        screen.getByLabelText('Length'),
        { target: { value: '42' } }
    )

    fireEvent.click(
        screen.getByRole('button', { name: 'Submit' })
    )

    expect(countPostCalls()).toBe(2)
})

test('shows an error when loading catches fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => 
        Promise.reject(new Error('Server unavailable'))
    ))

    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    expect(await screen.findByRole('alert')).toBeInTheDocument()

    expect(screen.queryByText('No catches recorded yet')).not.toBeInTheDocument()
})

test('shows loading state while catches are being fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(() => 
        new Promise<Response>(() => {})
    ))

    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    expect(await screen.getByText('Loading catches...')).toBeInTheDocument()

    expect(screen.queryByText('No catches recorded yet')).not.toBeInTheDocument()
})

test('retries loading catches after a failed request', async () => {
    const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error('Server unavailable'))
        .mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { id: 1, fish: 'Dorada', length: 42 }
            ]
        })

    vi.stubGlobal('fetch', fetchMock)

    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))

    expect(fetchMock).toHaveBeenCalledTimes(2)

    expect(await screen.findByText('Dorada')).toBeInTheDocument()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('ignores stale GET responses', async () => {
    let resolveA!: (response: Response) => void
    let resolveB!: (response: Response) => void

    const fetchMock = vi.fn()
        .mockImplementationOnce(() => {
            return new Promise<Response>(resolve => {
                resolveA = resolve
            })
        })
        .mockImplementationOnce(() => {
            return new Promise<Response>(resolve => {
                resolveB = resolve
            })
        })

    vi.stubGlobal('fetch', fetchMock)

    render(
        <MemoryRouter>
            <CatchProvider>
                <RetryHarness />
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Force retry' }))

    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => {
        resolveB({
            ok: true,
            json: async () => [
                { id: 2, fish: 'Dorada', length: 42 }
            ]
        } as Response)
    })

    expect(screen.getByText('Dorada')).toBeInTheDocument()

    await act(async () => {
        resolveA({
            ok: true,
            json: async () => []
        } as Response)
    })

    expect(screen.getByText('Dorada')).toBeInTheDocument()

    expect(screen.queryByText('No catches recorded yet')).not.toBeInTheDocument()
})