import styles from './CatchForm.module.css'

type CatchFormProps = {
    fish: string
    length: string
    editingId: number | null
    onFishChange: (value: string) => void
    onLengthChange: (value: string) => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    onCancelEdit: () => void
    fishInputRef: React.RefObject<HTMLInputElement | null>
    lengthInputRef: React.RefObject<HTMLInputElement | null>
    errors: {
        fish: string | null
        length: string | null
    }
}

function CatchForm({
    fish,
    length,
    editingId,
    onFishChange,
    onLengthChange,
    onSubmit,
    onCancelEdit,
    fishInputRef,
    lengthInputRef,
    errors
}: CatchFormProps) {
    return (
        <form className={styles.form} onSubmit={onSubmit}>
            <label htmlFor="fish">Fish</label>
            <input
                className={styles.input}
                id="fish"
                value={fish}
                onChange={(event) => onFishChange(event.target.value)}
                placeholder="Name of fish"
                ref={fishInputRef}
                aria-invalid={errors.fish !== null}
                aria-describedby={errors.fish ? 'fish-error' : undefined}
            />
            <label htmlFor="length">Length</label>
            <input
                className={styles.input}
                id="length"
                value={length}
                onChange={(event) => onLengthChange(event.target.value)}
                placeholder="Length"
                ref={lengthInputRef}
                type="number"
                aria-invalid={errors.length !== null}
                aria-describedby={errors.length ? 'length-error' : undefined}
            />
            <div className={styles.actions}>
                <button type="submit">
                    {editingId !== null ? "Save Edit" : "Add Catch"}
                </button>
                {
                    editingId !== null && 
                    <button type="button" onClick={onCancelEdit}>Cancel</button>
                }

                {errors.fish && (
                    <p id="fish-error" role="alert">
                        {errors.fish}
                    </p>
                )}

                {errors.length && (
                    <p id="length-error" role="alert">
                        {errors.length}
                    </p>
                )}
            </div>
        </form>
    )
}

export default CatchForm