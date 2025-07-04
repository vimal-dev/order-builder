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
import { useAuthenticatedAxios } from "../../hooks/useAxios";
import moment from "moment";


const OrderIndex = () => {
    const axios = useAuthenticatedAxios();
    const [showFilterable, setShowFilterable] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [quickExport, setQuickExport] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: "",
    });

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
        resetNextToken,
        onFilterColumnSelectHandler,
        onFilterOperatorSelectHandler,
        onFilterValueOneChangeHandler,
        onFilterValueTwoChangeHandler
    } = useFilter<IOrder>({
        endpoint: "/orders",
        exportIdentifier: "orders",
        exportEndpoint: "/exports/create",
        queryParams: {
            "q": search,
            "s": selectedStatus.join(","),
            "startDate": dateRange.startDate,
            "endDate": dateRange.endDate
        }
    });

    const toggleFilters = () => {
        setShowFilterable(!showFilterable)
    };

    const toggleStatus = (status: string) => {
        resetNextToken();
        setSelectedStatus((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status) // remove
                : [...prev, status]               // add
        );
    };

    const handleDateRange = (name: string, value: string) => {
        const dateRange = name === "startDate" ? moment(value).startOf("day").toISOString() : moment(value).endOf("day").toISOString();
        setDateRange((prev) => ({
            ...prev,
            [name]: value ? dateRange : "",
        }));
    }

    const quickExportHandler = async () => {
        setQuickExport(true)
        try {
            let f: Array<Record<string, any>> = [];
            if (search.length) {
                f.push({
                    "column": search[0] == "#" ? "order_number" : "customer_email",
                    "operator": "starts_with",
                    "query_1": search,
                    "query_2": null,
                })
            }
            if (selectedStatus.length) {
                f.push({
                    "column": "status",
                    "operator": "includes",
                    "query_1": selectedStatus,
                    "query_2": null,
                })
            }
            const startDate = dateRange.startDate;
            const endDate = dateRange.endDate;
            if (startDate && startDate.length > 0 && endDate && endDate.length > 0) {
                f.push({
                    column: "created",
                    operator: "between",
                    query_1: startDate,
                    query_2: endDate,
                });
            } else if (startDate && startDate.length > 0) {
                f.push({
                    column: "created",
                    operator: "gte",
                    query_1: startDate,
                    query_2: null,
                });
            } else if (endDate && endDate.length > 0) {
                f.push({
                    column: "created",
                    operator: "lte",
                    query_1: null,
                    query_2: endDate,
                });
            }

            const data = {
                "export_type": "orders",
                "export_options": {
                    "filters": f ? f : [],
                    "sorting": []

                }
            };
            await axios.post("/exports/create", data);
        } catch (e) {
        }
        setQuickExport(false)
    };


    useEffect(() => {
        fetchRecords();
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [search, selectedStatus, dateRange]);

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
                                <div className="d-flex flex-row align-items-center justify-content-start gap-2">
                                    <div className="input-group" style={{ maxWidth: '300px' }}>
                                        <input
                                            value={search}
                                            onChange={(e) => {
                                                resetNextToken();
                                                setSearch(e.target.value);
                                            }}
                                            type="search"
                                            id="form1"
                                            className="form-control"
                                            placeholder="Search"
                                        />
                                    </div>

                                    <div className="btn-group">
                                        {Object.values(Status).map((status) => (
                                            <button
                                                onClick={(_e) => toggleStatus(status)}
                                                className={`btn ${selectedStatus.includes(status) ? 'btn-tertiary' : 'btn-outline-tertiary'}`}
                                                key={status}
                                            >{status}</button>
                                        ))}
                                    </div>
                                    <div className="input-group" style={{ maxWidth: '300px' }}>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="startDate"
                                            onChange={(e) => handleDateRange(e.target.name, e.target.value)}
                                        />
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="endDate"
                                            onChange={(e) => handleDateRange(e.target.name, e.target.value)}
                                        />
                                    </div>
                                    <div className="ms-auto">
                                        <Button className="float-end btn btn-secondary ms-1" onClick={toggleFilters}>Advance Filters</Button>
                                        <Button className="float-end btn btn-tertiary" disabled={quickExport || (search.length <= 0 && selectedStatus.length <= 0 && dateRange.startDate.length <= 0 && dateRange.endDate.length <= 0)} onClick={quickExportHandler}>Export</Button>
                                    </div>
                                </div>
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
                                            })}>{order?.status}</Badge> <br />{new Date(order.created).toLocaleString()}</td>
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
