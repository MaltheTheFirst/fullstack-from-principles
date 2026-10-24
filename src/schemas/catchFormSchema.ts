import { z } from 'zod'

export const catchFormSchema = z.object({
    fish: z
        .string()
        .trim()
        .min(1, 'Enter a fish name'),

    length: z.coerce
        .number()
        .positive('Enter a length greater than 0')
})

export type CatchFormData = z.infer<typeof catchFormSchema>