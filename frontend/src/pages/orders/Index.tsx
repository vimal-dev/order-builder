import { useEffect, useState } from "react";
import { Table, Button, Spinner, Row, Col } from "react-bootstrap";
import { useAuthenticatedAxios } from "../../hooks/useAxios";
import { IOrder } from "../../types/order";
import { Helmet } from "react-helmet-async";
import {get as _get} from "lodash"

import config from "../../config";
import { Link } from "react-router-dom";


const OrderIndex = () => {
    const axios = useAuthenticatedAxios();
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrders = async (nextCursor = null) => {
        console.log("Called");
        setLoading(true);
        try {
            const params: Record<string, any> = {};
            if (nextCursor) params.cursor = nextCursor;
            const response = await axios.get("/orders", { params });         
            setOrders(prev => [...prev, ..._get(response, "data.data.items", [])]);
            setCursor(_get(response, "data.data.next_cursor", null));
            setHasMore(!!_get(response, "data.data.next_cursor", null));
        } catch (error) {
            // console.error("Error fetching orders", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <>
          <Helmet>
              <title>${config.title} - Orders</title>
          </Helmet>
          <Row>
            <Col>
            <h2 className='mb-2 fw-50'>Orders</h2>
            {/* Search input field */}
            <input
            style={{ width: '200px' }}
            className='form-control mb-2'
            placeholder='Search'
            
            onChange={(e) => console.log(e.target.value)}
            />
            {/* Employee Reports table */}
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Order Number</th>
                            <th>Customer</th>
                            <th>Customer Email</th>
                            <th>#</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>{order.order_number}</td>
                                <td>{order.customer_name || "N/A"}</td>
                                <td>{order.customer_email}</td>
                                <td><Link to={`/orders/${order.id}`}>View</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {loading && <Spinner animation="border" />}
                {hasMore && !loading && (
                    <Button onClick={() => fetchOrders(cursor)}>Load More</Button>
                )}
            </Col>
          </Row>
          
        </>
    );
};

export default OrderIndex;
