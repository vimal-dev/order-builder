import {get as _get} from "lodash";
import { useAuthenticatedAxios } from "../hooks/useAxios";
import config from "../config";

const StoreService = {
    status: async () => {
        const axios = useAuthenticatedAxios();
        const response = await axios.get(config.apiEndpoints.store.isConnected);
        return _get(response, "data", null)
    },
    connect: async () => {
        const axios = useAuthenticatedAxios();
        const response = await axios.post(config.apiEndpoints.store.connect);
        return _get(response, "data", null)
    }
}

export default StoreService;