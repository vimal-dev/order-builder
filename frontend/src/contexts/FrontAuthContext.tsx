import {createContext, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import config from "../config";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import {get as _get} from "lodash";
import AuthService from "../services/auth";
import { FrontAuthContextType, IAuthOrder } from "../types/FrontAuthContextType";

export const FrontAuthContext = createContext<FrontAuthContextType>({
    order: null,
    token: null,
    refresh_token: null,
    tokenExpiresIn: () => -1,
    isTokenExpired: () => false,
    login: async (_token, _refresh_token) => {},
    updateTokens: (_token, _refresh_token) => {},
    refreshAccessToken: async () => null,
    logout: async () => {},
    isAuthenticated: () => {return false;},
});

export const FrontAuthProvider = ({ children }: any) => {
    const [order, setOrder] = useLocalStorage("order", null);
    const [token, setToken] = useLocalStorage("frontToken", null);
    const [refresh_token, setRefreshToken] = useLocalStorage("refresh_token", null);
    const navigate = useNavigate();

    // call this function when you want to authenticate the user
    const login = (token: string, refresh_token: string|null) => {
        const payload: Record<string, any> = jwtDecode(token);
        const order: IAuthOrder = {
            identifier: payload.sub,
            order_number: payload.order_number,
            email: payload.email
        }
        setToken(token);
        setOrder(order);
        setRefreshToken(refresh_token);
        navigate(config.authSuccessRedirect);
    };

    const refreshAccessToken = async (): Promise<string | null> => {
        if(refresh_token) {
            try {
                const rs = await AuthService.refreshToken({"token": refresh_token});
                const new_token = _get(rs, "data.token", null)
                const new_refresh_token = _get(rs, "data.refresh_token", null)
                updateTokens(new_token, new_refresh_token)
                return new_token;
            } catch (e) {

            }
        }
        return null;
    }

    const updateTokens = (token: string, refresh_token: string|null) => {
        const payload: Record<string, any> = jwtDecode(token);
        const order: IAuthOrder = {
            identifier: payload.sub,
            order_number: payload.order_number,
            email: payload.email
        }
        setOrder(order);
        setToken(token);
        setRefreshToken(refresh_token);
    };

    // call this function to sign out logged in user
    const logout = () => {
        setOrder(null);
        setRefreshToken(null);
        setToken(null);
        navigate(config.authRedirect, { replace: true });
    };

    const tokenExpiresIn = () => {
        if(token) {
            const payload: Record<string, any> = jwtDecode(token);
            const exp: number|null = payload.hasOwnProperty("exp")? payload.exp:null;
            if(exp){
                const n = moment()
                const e = moment.unix(exp);
                let diff = e.diff(n, "seconds");
                if(diff < 0){
                    diff = 0;
                }
                return diff;
            }
            return -1;
        } else {
            return 0;
        }
    };

    const isTokenExpired = (margin: number = 0) => {
        const exp = tokenExpiresIn();
        return exp >= 0 && exp <= margin;
    };

    const isAuthenticated = () => {
        return order && token;
    };

    const value = useMemo(
        () => ({
            order,
            token,
            refresh_token,
            tokenExpiresIn,
            isTokenExpired,
            isAuthenticated,
            login,
            logout,
            refreshAccessToken,
            updateTokens
        }),
        [order, token, refresh_token]
    );
    // const value = {
    //     user,
    //     token,
    //     refresh_token,
    //     isAuthenticated,
    //     login,
    //     logout
    // };
    return <FrontAuthContext.Provider value={value}>{children}</FrontAuthContext.Provider>;
};
