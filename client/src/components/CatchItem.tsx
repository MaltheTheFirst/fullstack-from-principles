import type { Catch } from '../types/Catch'
import { Link } from 'react-router'
import { useContext } from 'react'
import { UnitContext } from '../context/UnitContext'
import styles from './CatchItem.module.css'
import buttonStyles from '../styles/buttons.module.css'

type CatchItemProps = Catch & {
  onDelete: (id: number) => void
  onEdit: (id: number) => void
  isDeleting: boolean
}

function CatchItem({ fish, length, id, onDelete, onEdit, isDeleting }: CatchItemProps) {
  const unit = useContext(UnitContext)

  const displayLength = 
    unit === "cm"
    ? length
    : Number((length / 2.54).toFixed(1))
  
  return (
    <li className={styles.item}>
      <p className={styles.details}>
        <Link to={`/catches/${id}`}>
          {fish}
        </Link> - {displayLength}{unit}</p>
      <div className={styles.actions}>
        <button onClick={() => onEdit(id)} className={buttonStyles.secondary}>
          Edit
        </button>
        <button disabled={isDeleting} onClick={() => onDelete(id)} className={buttonStyles.danger}>
            { isDeleting
                ? 'Deleting...'
                : 'Delete'
            }
        </button>
      </div>
    </li>
  )
}

export default CatchItem