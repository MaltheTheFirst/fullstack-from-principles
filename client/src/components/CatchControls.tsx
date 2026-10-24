import styles from './CatchControls.module.css'

type CatchControlsProps = {
    search: string
    sortOrder: string
    onSearchChange: (value: string) => void
    onSortOrderChange: (value: string) => void
}

function CatchControls({
    search,
    sortOrder,
    onSearchChange,
    onSortOrderChange
}: CatchControlsProps) {
  return (
    <>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search catches"
        />

        <select
          className={styles.select}
          value={sortOrder}
          onChange={(event) => onSortOrderChange(event.target.value)}
        >
          <option value="default">Default</option>
          <option value="shortest">Shortest first</option>
          <option value="longest">Longest first</option>
        </select>
      </div>
    </>
  )
}

export default CatchControls