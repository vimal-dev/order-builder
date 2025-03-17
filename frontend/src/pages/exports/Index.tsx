import { useEffect, useState } from "react";
import { Table, Button, Spinner, Row, Col, Card } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { get as _get } from "lodash"

import config from "../../config";
import useFilter from "../../hooks/useFilter";
import { FilterableFieldsGroupInterface } from "../../hooks/useFilter";
import Filterable from "../../components/Filterable";
import { IExport } from "../../types/export";
import { useAuthenticatedAxios } from "../../hooks/useAxios";


const ExportIndex = () => {
    const [downloading, setDownloading] = useState(false);
    const axios = useAuthenticatedAxios();

    const filterableFields: Array<FilterableFieldsGroupInterface> = [];

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
    } = useFilter<IExport>({
        endpoint: "/exports",
        queryParams: []
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    const loadMore = () => {
        const next_token = _get(meta, "next_token", null);
        if (next_token) {
            fetchRecords();
        }
    }

    const handleDownload = async (id: number) => {
        setDownloading(true)
        try {
          const response = await axios.get(`/exports/download/${id}`, {
            responseType: "blob", // Important for binary data
          });
      
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement("a");
          a.href = url;
          a.download = "exported-data.xlsx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Download failed:", error);
        }
        setDownloading(false)
      };

    return (
        <>
            <Helmet>
                <title>${config.title} - Exports</title>
            </Helmet>
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Title>Exports</Card.Title>
                            <Filterable
                                loading={loading}
                                canExport={true}
                                showFilterable={false}
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
                                        <th>Export Created</th>
                                        <th>Status</th>
                                        <th>#</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(exp => (
                                        <tr key={exp.id}>
                                            <td>{new Date(exp.updated).toLocaleString()}</td>
                                            <td>{exp.status}</td>
                                            <td><Button disabled={exp.status != "Completed" || downloading} onClick={() => handleDownload(exp.id)} size="sm" >Download</Button></td>
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

export default ExportIndex;
