import { Navigate, useOutlet } from "react-router-dom";
import Header from "../components/Header";
import Container from "react-bootstrap/Container";
import Footer from "../components/Footer";
import {HelmetProvider} from "react-helmet-async";
import useFrontAuth from "../hooks/useFrontAuth";

export const FrontProtectedLayout = () => {
    const { order, isTokenExpired, refreshAccessToken, logout } = useFrontAuth();
    const outlet = useOutlet();

    if(isTokenExpired()){
        const token = refreshAccessToken()
        if(!token) {
            logout();
        }
    }

    if (!order) {
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