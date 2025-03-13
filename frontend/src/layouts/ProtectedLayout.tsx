import { Navigate, useOutlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Header from "../components/Header";
import Container from "react-bootstrap/Container";
import Footer from "../components/Footer";
import {HelmetProvider} from "react-helmet-async";

export const ProtectedLayout = () => {
    const { user, isTokenExpired, refreshAccessToken, logout } = useAuth();
    const outlet = useOutlet();

    if(isTokenExpired()){
        const token = refreshAccessToken()
        if(!token) {
            logout();
        }
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <HelmetProvider>
            <Header></Header>
            <Container fluid={true} className="mt-3">
                {outlet}
            </Container>
            <Footer></Footer>
        </HelmetProvider>
    );
};