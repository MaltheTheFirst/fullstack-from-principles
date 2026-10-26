import { useState } from 'react'
import { Link } from 'react-router'
import { UnitContext } from '../context/UnitContext'
import { useCatchLog } from '../hooks/useCatchLog'
import CatchControls from '../components/CatchControls'
import CatchList from '../components/CatchList'
import CatchForm from '../components/CatchForm'
import '../App.css'

function CatchLogPage() {
    const { 
        catches,
        formState, 
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
        longestCatch,
        isCreating,
        createError,
        isLoadingCatches,
        loadError,
        retryLoadCatches,
        hasLoadedCatches,
        deletingIds,
        deleteError,
        isUpdating,
        updateError
    } = useCatchLog()

    const [unit, setUnit] = useState<"cm" | "in">("cm")

    const displayLongestCatch =
        longestCatch === null
            ? null
            : unit === "cm"
                ? longestCatch
                : Number((longestCatch / 2.54).toFixed(1))

    return (
        <UnitContext value={unit}>
            <main id="center">
                <Link to="/" style={{ textDecoration: 'none' }}><h1>Catch Log</h1></Link>
                <Link to="/stats">Statistics</Link>

                <CatchControls 
                    search={search}
                    sortOrder={sortOrder}
                    onSearchChange={setSearch}
                    onSortOrderChange={setSortOrder}
                />

                <select
                value={unit}
                onChange={(event) => setUnit(event.target.value as "cm" | "in")}
                >
                <option value="cm">Centimeters</option>
                <option value="in">Inches</option>
                </select>

                {   
                catches.length === 0 
                    ? <h3>No catches logged yet</h3> 
                    : <h3>{catches.length} catches logged</h3> 
                }

                {
                catches.length === 0
                    ? null
                    : <h3>Longest catch: {displayLongestCatch}{unit}</h3>
                }

                {
                isLoadingCatches && !hasLoadedCatches
                    ? <p>Loading catches...</p>
                    : loadError && !hasLoadedCatches
                        ? <>
                            <p role="alert">{loadError}</p>
                            <button type="button" onClick={retryLoadCatches}>Retry</button>
                        </>
                        : catches.length === 0
                            ? <p>No catches recorded yet</p>
                            : search !== "" && filteredCatches.length === 0
                                ? <p>No catches match your search</p>
                                : <CatchList
                                    catches={sortedCatches}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                    deletingIds={deletingIds}
                                    />
                }

                {deleteError && <p role="alert">{deleteError}</p>}
                {isLoadingCatches && hasLoadedCatches && <p>Refreshing catches...</p>}
                {loadError && hasLoadedCatches && <p role="alert">{loadError}</p>}
                
                <button type="button" onClick={retryLoadCatches} disabled={isLoadingCatches}>
                    Refresh catches
                </button>

                <CatchForm 
                    fish={formState.fish}
                    length={formState.length}
                    editingId={formState.editingId}
                    onFishChange={handleFishChange}
                    onLengthChange={handleLengthChange}
                    onSubmit={handleSubmit}
                    onCancelEdit={handleCancelEdit}
                    fishInputRef={fishInputRef}
                    lengthInputRef={lengthInputRef}
                    errors={formState.errors}
                    isCreating={isCreating}
                    createError={createError}
                    isUpdating={isUpdating}
                    updateError={updateError}
                />
            </main>
        </UnitContext>
    )
}

export default CatchLogPage