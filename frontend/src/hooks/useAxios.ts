import axios from "axios";
import useAuth from "./useAuth";
import config from "../config";
import { useMemo } from "react";

const useAuthenticatedAxios = () => {
    const { token, refresh_token, refreshAccessToken, logout } = useAuth();

    const instance = useMemo(() => {
        const axiosInstance = axios.create({
            baseURL: config.apiBase,
            headers: { "Content-Type": "application/json" },
        });

        axiosInstance.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers["Authorization"] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        axiosInstance.interceptors.response.use(
            (res) => res,
            async (err) => {
                const originalConfig = err.config;
                if (err.response) {
                    // Handle token expiration
                    if (err.response.status === 401 && !originalConfig._retry && refresh_token) {
                        originalConfig._retry = true;
                        try {
                            const access_token = await refreshAccessToken();
                            if (access_token) {
                                originalConfig.headers["Authorization"] = `Bearer ${access_token}`;
                                return axiosInstance(originalConfig);
                            } else {
                                logout();
                            }
                        } catch (_error) {
                            logout();
                        }
                    }
                }

                return Promise.reject(err);
            }
        );

        return axiosInstance;
    }, [token, refresh_token, refreshAccessToken, logout]); // Dependency array ensures it updates when auth state changes

    return instance;
};


const useAxios = () => {
    const instance = axios.create({
        baseURL: config.apiBase,
        headers: {
            "Content-Type": "application/json",
        },
    });

    instance.interceptors.request.use(
        (config) => {
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    instance.interceptors.response.use((response) => {
        return Promise.resolve(response);
    }, error => {
        // console.warn('Error status', error.response.status)
        return Promise.reject(error)
        // let status = _.get(error, "response.status", null);
        // if (status === 403) {
        //     window.location.href = config.login_path;
        // } else {
        //     return Promise.reject(error)
        // }
    });

    return instance
}

export {useAxios, useAuthenticatedAxios};
