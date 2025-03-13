
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import './App.scss'
import { DefaultLayout } from './layouts/DefaultLayout';
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/auth/Login";
import { ProtectedLayout } from "./layouts/ProtectedLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import OrderIndex from "./pages/orders/Index";
import OrderView from "./pages/orders/View";
import { ToastContainer } from "react-toastify";

function App() {
  useEffect(() => {
    document.body.classList.add(
        "header-fixed",
        "header-tablet-and-mobile-fixed",
        "aside-fixed",
        "aside-secondary-enabled"
    );
  }, []);
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout/>}>
            <Route path="/login" element={<Login/>}></Route>
          </Route>
          <Route element={<ProtectedLayout/>}>
            <Route path="/" element={<Home />}></Route>
            {/* <Route path="/account">
                <Route path="" element={<Profile/>}></Route>
                <Route path="change-password" element={<ChangePassword/>}></Route>
            </Route> */}
            <Route path="/orders">
                <Route path="" element={<OrderIndex/>}></Route>
                <Route path=":id" element={<OrderView/>}></Route>
            </Route> 
          </Route>
          <Route element={<DefaultLayout/>}>
            <Route path='*' element={<NotFound />}/>
          </Route>
        </Routes>
        <ToastContainer />
      </AuthProvider>
    </Router>
  )
}

export default App
