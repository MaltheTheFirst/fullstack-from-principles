import { catchFormSchema } from './catchFormSchema'

test('parses valid catch form data', () => {
    const result = catchFormSchema.safeParse({
        fish: 'Goliath Grouper',
        length: '200',
    })

    expect(result.success).toBe(true)

    if (result.success) {
        expect(result.data).toEqual({
            fish: 'Goliath Grouper',
            length: 200,
        })
    }
})

test('rejects invalid catch form data', () => {
    const result = catchFormSchema.safeParse({
        fish: '',
        length: '0',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors

        expect(fieldErrors.fish?.[0]).toBe('Enter a fish name')
        expect(fieldErrors.length?.[0]).toBe('Enter a length greater than 0')
    }
})