import {useEffect, useState} from "react";
import {get as _get} from "lodash"
import {Button, Card,Spinner} from "react-bootstrap";
import { useAuthenticatedAxios } from "../hooks/useAxios";
import config from "../config";

type Store = {
    isConnected?: boolean,
    name: string,
}

const ConnectedStore = () => {
    const axios = useAuthenticatedAxios();
    const [store, setStore] = useState<Store>({
        isConnected: false,
        name: ""
    });
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);

    const getStoreStatus = async () => {
        setLoading(true)
        try {
          
            const response = await axios.get(config.apiEndpoints.store.isConnected);
            const store = _get(response, "data", {})
            const shop_connected = _get(store, "data.shop_connected", null)
            setStore({
                isConnected: shop_connected? true:false,
                name: shop_connected
            })
        } catch (e) {
            console.log(e)
        }
        setLoading(false)
    };

    useEffect(() =>  {
        getStoreStatus();
    }, [])

    useEffect(() =>  {
        getStoreStatus();
    }, [refresh])

    const handleRefresh = () => {
        setRefresh(refresh+1);
    };

    return (
        <div className="connected-store mt-2">
            <Card>
                <Card.Body>
                    <Card.Title>Store Connection Status</Card.Title>
                    <Card.Text>
                        <span><strong>Connected Store: </strong>{store.name}</span>
                        <Button className={"float-end"} disabled={loading} size={"sm"} onClick={handleRefresh} variant={"secondary"}>
                            {loading && <Spinner size={"sm"}></Spinner>} REFRESH
                        </Button>
                    </Card.Text>
                </Card.Body>
            </Card>
        </div>
    )
};

export default ConnectedStore;

