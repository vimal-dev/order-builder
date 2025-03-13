import {useContext} from "react";
import {AuthContext} from "../contexts/AuthContext";

export enum Role {
    ROLE_SUPER_ADMIN = "Super Admin",
    ROLE_ADMIN = "Admin"
}

const useAuth = () => {
    return useContext(AuthContext);
};

export default useAuth;