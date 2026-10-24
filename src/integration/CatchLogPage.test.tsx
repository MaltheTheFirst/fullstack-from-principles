import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CatchLogPage from '../pages/CatchLogPage'
import { CatchProvider } from '../context/CatchProvider'

beforeEach(() => {
  localStorage.clear()
})

test('adds a catch through the catch log', () => {
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

    expect(screen.getByText('Sea Bass')).toBeInTheDocument()
})

test('deletes a catch from the catch log', () => {
    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    expect(screen.getByText('Horse Mackerel')).toBeInTheDocument()

    const horseMackerel = screen.getByText('Horse Mackerel')
    const catchItem = horseMackerel.closest('li')

    if (!catchItem) {
        throw new Error('Catch item not found')
    }

    fireEvent.click(
        within(catchItem).getByRole('button', { name: 'Delete' })
    )

    expect(screen.queryByText('Horse Mackerel')).not.toBeInTheDocument()
})

test('edits a catch through the catch log', () => {
    render(
        <MemoryRouter>
            <CatchProvider>
                <CatchLogPage />
            </CatchProvider>
        </MemoryRouter>
    )

    const horseMackerel = screen.getByText('Horse Mackerel')
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
        screen.getByText('Atlantic Mackerel')
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