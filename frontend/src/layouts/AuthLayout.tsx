import { Navigate, useOutlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import {HelmetProvider} from "react-helmet-async";

export const AuthLayout = () => {
    const { user } = useAuth();
    const outlet = useOutlet();

    if (user) {
        return <Navigate to="/" />;
    }

    return (
        <HelmetProvider>
            {outlet}
        </HelmetProvider>
    )
};