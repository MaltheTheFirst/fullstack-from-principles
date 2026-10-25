import { useReducer, useRef , useCallback, useState, useMemo } from 'react'
import { useCatches } from '../context/useCatches'
import { catchFormSchema } from '../schemas/catchFormSchema'

type CatchFormState = {
  fish: string
  length: string
  editingId: number | null
  errors: {
    fish: string | null
    length: string | null
  }
}

const initialFormState: CatchFormState = {
  fish: "",
  length: "",
  editingId: null,
  errors: {
    fish: null,
    length: null
  }
}

type CatchFormAction = 
  | { type: "fishChanged"; value: string }
  | { type: "lengthChanged"; value: string }
  | { type: "startEditing"; id: number; fish: string; length: number }
  | { type: "cancelEditing" }
  | { type: "reset" }
  | {
      type: "validationFailed",
      errors: {
        fish: string | null
        length: string | null
      } 
    }

function catchFormReducer(
  state: CatchFormState,
  action: CatchFormAction
): CatchFormState {
  switch (action.type) {
    case  "fishChanged":
      return {
        ...state,
        fish: action.value,
        errors: {
            ...state.errors,
            fish: null
        }
      }
    
    case "lengthChanged":
      return {
        ...state,
        length: action.value,
        errors: {
            ...state.errors,
            length: null
        }
    }
  
    case "startEditing":
      return {
        fish: action.fish,
        length: String(action.length),
        editingId: action.id,
        errors: {
            fish: null,
            length: null
        }
    }

    case "cancelEditing":
    case "reset":
      return initialFormState

    case "validationFailed":
      return {
        ...state,
        errors: action.errors
    }

    default:
      return state
  }
}

export function useCatchLog() {
    const fishInputRef = useRef<HTMLInputElement>(null)
    const lengthInputRef = useRef<HTMLInputElement>(null)
    const { catches, setCatches } = useCatches()
    const [formState, dispatch] = useReducer(
        catchFormReducer,
        initialFormState
    )
    const [search, setSearch] = useState("")
    const [sortOrder, setSortOrder] = useState("default")

    const { filteredCatches, sortedCatches } = useMemo(() => {
        const filteredCatches = catches.filter((catchItem) => {
            return catchItem.fish
                .toLowerCase()
                .includes(search.toLowerCase())
            })  

        const sortedCatches = [...filteredCatches]

        if (sortOrder === "shortest") {
            sortedCatches.sort((a, b) => a.length - b.length)
        }

        if (sortOrder === "longest") {
            sortedCatches.sort((a, b) => b.length - a.length)
        }

        return {
            filteredCatches,
            sortedCatches
        }
		}, [catches, search, sortOrder])

    const catchCount = catches.length
    
    const longestCatch = 
        catches.length > 0
            ? Math.max(...catches.map((catchItem) => catchItem.length))
            : null

    function handleCancelEdit() {
        dispatch({ type: "cancelEditing" })
    }

    const handleEdit = useCallback((id: number) => {
        const catchToEdit = catches.find((catchItem) => {
            return catchItem.id === id
        })

        if (catchToEdit === undefined) {
            return
        }

        dispatch({
            type: "startEditing",
            id: catchToEdit.id,
            fish: catchToEdit.fish,
            length: catchToEdit.length
        })

        fishInputRef.current?.focus()
    }, [catches])

    const handleDelete = useCallback((id: number) => {
        fetch(`http://127.0.0.1:3001/catches/${id}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete catch')
                }

                setCatches((currentCatches) => {
                    return currentCatches.filter((catchItem) => {
                        return catchItem.id !== id
                    })
                })
            })
            .catch(error => {
                console.error(error)
            })

    }, [setCatches])

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		  	event.preventDefault()

        const result = catchFormSchema.safeParse({
            fish: formState.fish,
            length: formState.length
        })

        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors

            const fishError = fieldErrors.fish?.[0] ?? null
            const lengthError = fieldErrors.length?.[0] ?? null

            dispatch({
                type: "validationFailed",
                errors: {
                  fish: fishError,
                  length: lengthError
                }
            })

            if (fishError) {
                fishInputRef.current?.focus()
            } else if (lengthError) {
                lengthInputRef.current?.focus()
            }

        return
        }

        const validatedCatch = result.data

        if (formState.editingId !== null) {
            fetch(`http://127.0.0.1:3001/catches/${formState.editingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(validatedCatch)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update catch')
                    }

                    return response.json()
                })
                .then(updatedCatch => {
                    setCatches(currentCatches => {
                        return currentCatches.map(catchItem => {
                            if (catchItem.id === updatedCatch.id) {
                                return updatedCatch
                            }

                            return catchItem
                        })
                    })

                    dispatch({ type: "reset" })

                })
                .catch(error => {
                    console.error(error)
                })
            return
        }

        fetch('http://127.0.0.1:3001/catches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(validatedCatch)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create catch')
                }

                return response.json()
            })
            .then(data => {
                setCatches(currentCatches => [...currentCatches, data])
                dispatch({ type: "reset" })
            })
            .catch(error => {
                console.error(error)
            })
	}

    function handleFishChange(value: string) {
        dispatch({
            type: "fishChanged",
            value
        })
    }

    function handleLengthChange(value: string) {
        dispatch({
          type: "lengthChanged",
          value
        })
    }

    return {
        catches,
        setCatches,
        formState,
        dispatch,
        handleCancelEdit,
        handleEdit,
        handleDelete,
        handleSubmit,
        handleFishChange,
        handleLengthChange,
        fishInputRef,
        lengthInputRef,
        search,
        setSearch,
        sortOrder,
        setSortOrder,
        filteredCatches,
        sortedCatches,
        catchCount,
        longestCatch,
    }
}

