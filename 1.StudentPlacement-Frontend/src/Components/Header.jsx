import "./Header.css"
import { NavLink } from "react-router-dom"

const Header=()=>{
    return(<>
    <header>
        <div id="brand-name"><h1>Student Placement Preparation Hub</h1></div>
        <div className="components">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/register">Register</NavLink>
            <NavLink to="/login">Login</NavLink>
        </div>
    </header>
    </>)
}
export default Header