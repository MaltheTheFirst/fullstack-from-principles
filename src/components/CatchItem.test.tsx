import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CatchItem from './CatchItem'

test('renders the catch fish name', () => {
    render(
        <MemoryRouter>
            <CatchItem
                id={1}
                fish="Horse Mackerel"
                length={16}
                onDelete={() => {}}
                onEdit={() => {}}
            />
        </MemoryRouter>
    )

    expect(screen.getByText('Horse Mackerel')).toBeInTheDocument()
})

test('calls onDelete with the catch id when delete is clicked', () => {
    const onDelete = vi.fn()

    render(
        <MemoryRouter>
            <CatchItem
                id={1}
                fish="Horse Mackerel"
                length={16}
                onDelete={onDelete}
                onEdit={() => {}}
            />
        </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith(1)
})