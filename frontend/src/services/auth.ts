import config from "../config";
import {get as _get} from "lodash"
import { useAxios } from "../hooks/useAxios";


const AuthService = {
    login: async (data: Record<string, any>) => {
        const axios = useAxios();
        const response = await axios.post(config.apiEndpoints.login, data);
        return _get(response, "data", null)
    },
    verifyOtp: async (data: Record<string, any>) => {
        const axios = useAxios();
        const response = await axios.post(config.apiEndpoints.otp, data);
        return _get(response, "data", null)
    },
    refreshToken: async (data: Record<string, any>) => {
        const axios = useAxios()
        const response = await axios.post(config.apiEndpoints.refreshToken, data);
        return _get(response, "data", null)
    },
    register: async (data: Record<string, any>) => {
        if (config.apiEndpoints.register === null)
            return null
        const axios = useAxios()
        const response = await axios.post(config.apiEndpoints.register, data);
        return _get(response, "data", null)
    },
    forgot: async (data: Record<string, any>) => {
        if (config.apiEndpoints.forgot === null)
            return null
        const axios = useAxios()
        const response = await axios.post(config.apiEndpoints.forgot, data);
        return _get(response, "data", null)
    },
    reset: async (data: Record<string, any>) => {
        if (config.apiEndpoints.reset === null)
            return null
        const axios = useAxios()
        const response = await axios.post(config.apiEndpoints.reset, data);
        return _get(response, "data", null)
    }
}

export default AuthService