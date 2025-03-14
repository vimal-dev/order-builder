import {useContext} from "react";
import {FrontAuthContext} from "../contexts/FrontAuthContext";

export enum Role {
    ROLE_SUPER_ADMIN = "Super Admin",
    ROLE_ADMIN = "Admin"
}

const useFrontAuth = () => {
    return useContext(FrontAuthContext);
};

export default useFrontAuth;