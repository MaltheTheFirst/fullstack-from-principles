import { HttpError } from "./HttpError"

export function checkResponse(response: Response, message: string) {
    if (!response.ok) {
        throw new HttpError(message, response.status)
    }
}