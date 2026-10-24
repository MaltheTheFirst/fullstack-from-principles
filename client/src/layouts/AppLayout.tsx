import { Link, Outlet } from 'react-router'

function AppLayout() {
    return (
        <>
            <nav aria-label="Primary">
                <ul>
                    <li>
                        <Link to="/">Catch Log</Link>
                    </li>
                    <li>
                        <Link to="/stats">Statistics</Link>
                    </li>
                </ul>
            </nav>

            <Outlet />
        </>
    )
}

export default AppLayout