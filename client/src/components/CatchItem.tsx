import { Link } from 'react-router'
import type { Catch } from '../types/Catch'
import { useContext } from 'react'
import { UnitContext } from '../context/UnitContext'

type CatchItemProps = Catch & {
  onDelete: (id: number) => void
  onEdit: (id: number) => void
}

function CatchItem({ fish, length, id, onDelete, onEdit }: CatchItemProps) {
  const unit = useContext(UnitContext)

  const displayLength = 
    unit === "cm"
    ? length
    : Number((length / 2.54).toFixed(1))
  
  return (
    <li>
      <p>
        <Link to={`/catches/${id}`}>
          {fish}
        </Link> - {displayLength}{unit}</p>
      <button onClick={() => onDelete(id)}>Delete</button>
      <button onClick={() => onEdit(id)}>Edit</button>
    </li>
  )
}

export default CatchItem