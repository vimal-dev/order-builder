import { useEffect, useState } from "react";
import { Table, Button, Spinner, Row, Col, Card, Badge } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { get as _get } from "lodash"

import config from "../../config";
import { Link } from "react-router-dom";
import useFilter from "../../hooks/useFilter";
import { FilterableFieldsGroupInterface } from "../../hooks/useFilter";
import Filterable from "../../components/Filterable";
import { IOrder } from "../../types/order";
import { Status } from "../../enums/order";
import classNames from "classnames";


const OrderIndex = () => {
    const [showFilterable, setShowFilterable] = useState(false);

    const filterableFields: Array<FilterableFieldsGroupInterface> = [
        {
            title: "Order",
            fields: [
                {
                    label: "Customer Email",
                    value: "customer_email",
                    type: "string"
                },
                {
                    label: "Order Number",
                    value: "order_number",
                    type: "string"
                },
                {
                    label: "Status",
                    value: "status",
                    type: "string"
                },
                {
                    label: "Created",
                    value: "created",
                    type: "datetime"
                }
            ]
        }
    ];

    const {
        loading,
        records,
        meta,
        selectedFilters,
        sortColumn,
        removeSortColumn,
        resetSorting,
        applyFilters,
        exportRecords,
        fetchRecords,
        addFilter,
        removeFilter,
        resetFilter,
        onFilterColumnSelectHandler,
        onFilterOperatorSelectHandler,
        onFilterValueOneChangeHandler,
        onFilterValueTwoChangeHandler
    } = useFilter<IOrder>({
        endpoint: "/orders",
        exportIdentifier: "orders",
        exportEndpoint: "/exports/create",
        queryParams: []
    });

    const toggleFilters = () => {
        setShowFilterable(!showFilterable)
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const loadMore = () => {
        const next_token = _get(meta, "next_token", null);
        if (next_token) {
            fetchRecords();
        }
    }

    return (
        <>
            <Helmet>
                <title>${config.title} - Orders</title>
            </Helmet>
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Title>Orders</Card.Title>
                            <div className="page-actions">
                                <Button className="float-end btn btn-secondary btn-sm" onClick={toggleFilters}>Filters</Button>
                                <div className="clearfix"></div>
                            </div>
                            <Filterable
                                loading={loading}
                                canExport={true}
                                showFilterable={showFilterable}
                                selectedFilters={selectedFilters}
                                sortColumn={sortColumn}
                                removeSortColumn={removeSortColumn}
                                resetSorting={resetSorting}
                                filterableFields={filterableFields}
                                sortableFields={[]}
                                queryParams={[]}
                                exportRecords={exportRecords}
                                applyFilters={applyFilters}
                                addFilter={addFilter}
                                removeFilter={removeFilter}
                                resetFilter={resetFilter}
                                onFilterColumnSelectHandler={onFilterColumnSelectHandler}
                                onFilterOperatorSelectHandler={onFilterOperatorSelectHandler}
                                onFilterValueOneChangeHandler={onFilterValueOneChangeHandler}
                                onFilterValueTwoChangeHandler={onFilterValueTwoChangeHandler}
                            ></Filterable>
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Order Number</th>
                                        <th>Customer</th>
                                        <th>Customer Email</th>
                                        <th>Status & Last Updated</th>
                                        <th>#</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.order_number}</td>
                                            <td>{order.customer_name || "N/A"}</td>
                                            <td>{order.customer_email}</td>
                                            <td><Badge className="rounded-0" bg={classNames("", {
                                                                                        "success": order?.status === Status.DESIGN_APPROVED || order?.status === Status.READY_FOR_PRODUCTION,
                                                                                        "info": order?.status === Status.PROCESSING,
                                                                                        "warning": order?.status === Status.WAITING_FOR_APPROVAL,
                                                                                        "danger": order?.status === Status.REJECTED || order?.status === Status.REVISION_REQUESTED
                                                                                      })}>{order?.status}</Badge> <br />{new Date(order.updated).toLocaleString()}</td>
                                            <td><Link to={`/orders/${order.id}`}>View</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            
                            {("next_token" in meta && meta["next_token"]) && (
                                <Button onClick={() => loadMore()} disabled={loading}>{loading && <Spinner size="sm" animation="border" />} Load More</Button>
                            )}
                        </Card.Body>
                    </Card>

                </Col>
            </Row>

        </>
    );
};

export default OrderIndex;
