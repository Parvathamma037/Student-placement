import './App.css'
import {Routes,Route,useLocation} from "react-router-dom"
import Header from './Components/Header'
import Home from './Components/Home'
import Register from './Components/Register'
import Login from './Components/Login'
import Student from './Components/Student'
import Teacher from './Components/Teacher'
import Parent from './Components/Parent'
function App() {
  const location = useLocation();
  const hideHeaderRoutes = ["/woner", ];
  return (<>
      {!hideHeaderRoutes.includes(location.pathname) && <Header/>}
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/teacher" element={<Teacher/> }/>
      <Route path="/student" element={ <Student/>}/>
      <Route path="/Parent" element={<Parent/>}/>
    </Routes> 
  </>
  )
}

export default App
