import { useOutlet } from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";

export const DefaultLayout = () => {
    const outlet = useOutlet();

    return (
        <HelmetProvider>
            {outlet}
        </HelmetProvider>
    )
};