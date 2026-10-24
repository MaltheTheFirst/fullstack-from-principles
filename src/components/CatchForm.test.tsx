import { render, screen, fireEvent } from '@testing-library/react'
import { createRef } from 'react'
import CatchForm from './CatchForm'

test('calls onFishChange when fish input changes', () => {
    const onFishChange = vi.fn()

    render(
        <CatchForm
            fish=""
            length=""
            editingId={null}
            onFishChange={onFishChange}
            onLengthChange={() => {}}
            onSubmit={() => {}}
            onCancelEdit={() => {}}
            fishInputRef={createRef<HTMLInputElement>()}
            lengthInputRef={createRef<HTMLInputElement>()}
            errors={{
                fish: null,
                length: null
            }}
        />
    )

    fireEvent.change(screen.getByLabelText('Fish'), {
        target: { value: 'Sea Bass' },
    })

    expect(onFishChange).toHaveBeenCalledWith('Sea Bass')
})

test('calls onSubmit when the form is submitted', () => {
    const onSubmit = vi.fn()

    render(
        <CatchForm
            fish="Sea Bass"
            length="25"
            editingId={null}
            onFishChange={() => {}}
            onLengthChange={() => {}}
            onSubmit={onSubmit}
            onCancelEdit={() => {}}
            fishInputRef={createRef<HTMLInputElement>()}
            lengthInputRef={createRef<HTMLInputElement>()}
            errors={{
                fish: null,
                length: null
            }}
        />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add Catch' }))

    expect(onSubmit).toHaveBeenCalled()
})

test('shows edit controls when editing a catch', () => {
    render(
        <CatchForm
            fish="Sea Bass"
            length="25"
            editingId={1}
            onFishChange={() => {}}
            onLengthChange={() => {}}
            onSubmit={() => {}}
            onCancelEdit={() => {}}
            fishInputRef={createRef<HTMLInputElement>()}
            lengthInputRef={createRef<HTMLInputElement>()}
            errors={{
                fish: null,
                length: null
            }}
        />
    )

    expect(
        screen.getByRole('button', { name: 'Save Edit' })
    ).toBeInTheDocument()

    expect(
        screen.getByRole('button', { name: 'Cancel' })
    ).toBeInTheDocument()
})

test('shows a validation error', () => {
    render(
        <CatchForm
            fish=""
            length=""
            editingId={null}
            errors={{
                fish: "Enter a fish name",
                length: "Enter a length greater than 0"
            }}
            onFishChange={() => {}}
            onLengthChange={() => {}}
            onSubmit={() => {}}
            onCancelEdit={() => {}}
            fishInputRef={createRef<HTMLInputElement>()}
            lengthInputRef={createRef<HTMLInputElement>()}
        />
    )

    expect(
        screen.getByText('Enter a fish name')
    ).toBeInTheDocument()

    expect(
        screen.getByText('Enter a length greater than 0')
    ).toBeInTheDocument()
})

test('marks invalid fileds and links them to their error messages', () => {
    render(
        <CatchForm
            fish=""
            length=""
            editingId={null}
            errors={{
                fish: 'Enter a fish name',
                length: 'Enter a length greater than 0'
            }}
            onFishChange={() => {}}
            onLengthChange={() => {}}
            onSubmit={() => {}}
            onCancelEdit={() => {}}
            fishInputRef={createRef<HTMLInputElement>()}
            lengthInputRef={createRef<HTMLInputElement>()}
        />
    )

    const fishInput = screen.getByLabelText('Fish')
    const lengthInput = screen.getByLabelText('Length')

    expect(fishInput).toHaveAttribute('aria-invalid', 'true')
    expect(fishInput).toHaveAttribute('aria-describedby', 'fish-error')

    expect(lengthInput).toHaveAttribute('aria-invalid', 'true')
    expect(lengthInput).toHaveAttribute('aria-describedby', 'length-error')
})