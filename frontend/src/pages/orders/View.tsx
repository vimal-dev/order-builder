import { useEffect, useState } from "react";
import { Table, Row, Col, Card, CardText, Modal, Button, Form } from "react-bootstrap";
import { useAuthenticatedAxios } from "../../hooks/useAxios";
import { IAttachment, IOrder, IOrderItem } from "../../types/order";
import { Helmet } from "react-helmet-async";
import { get as _get } from "lodash";
import { useFormik } from "formik";
import * as Yup from 'yup';
import * as coreAxios from "axios";

import config from "../../config";
import { useParams } from "react-router-dom";
import Attachment from "../../components/Attachment";
import { toast } from "react-toastify";

interface IUpdateStatus{
    id: number | string | null;
    status: string | null;
    comment: string | null;
}

const UploadSchema = Yup.object().shape({
    attached_file: Yup.mixed().required('File is required'),
});


const OrderView = () => {
    const axios = useAuthenticatedAxios();
    let { id } = useParams();
    const [refresh, setRefresh] = useState<number>(0);
    const [order, setOrder] = useState<IOrder | null>(null);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [loadingAttachments, setLoadingAttachments] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected_order_item, setSelectedOrderItem] = useState<IOrderItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const formikUpload = useFormik({
            initialValues: {
                attached_file: null
            },
            validationSchema: UploadSchema,
            onSubmit: async (values, { setErrors, resetForm }) => {
                setIsSubmitting(true);
                try {
                    if (values.attached_file) {
                        const formData = new FormData();
                        formData.append("attached_file", values.attached_file);
                        const response = await axios.post(`/orders/attachment/add/${selected_order_item?.id}`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        });
                        resetForm();
                        setRefresh(refresh + 1);
                        toast("File uploaded successfully");
                    }
                } catch (error: unknown) {
                    if (coreAxios.isAxiosError(error)) {
                        if (error.response && error.response.status === 422) {
                            setErrors(_get(error, "response.data.errors", {}));
                        }
                    }
                }
                setIsSubmitting(false);
            },
        });

    const fetchOrder = async (nextCursor = null) => {
        console.log("Called");
        setLoading(true);
        try {
            const params: Record<string, any> = { limit: 1 };
            if (nextCursor) params.cursor = nextCursor;
            const response = await axios.get(`/orders/${id}`, { params });
            setOrder(_get(response, "data.data", null));
        } catch (error) {
            console.error("Error fetching orders", error);
        }
        setLoading(false);
    };

    const fetchAttachments = async (nextCursor = null) => {
        if (!selected_order_item) {
            return;
        }
        setLoadingAttachments(true);
        try {
            const params: Record<string, any> = {};
            if (nextCursor) params.cursor = nextCursor;
            const response = await axios.get(`/orders/attachments/${selected_order_item?.id}`, { params });
            setAttachments(_get(response, "data.data.items", []));
        } catch (error) {
            console.error("Error fetching attachments", error);
        }
        setLoadingAttachments(false);
    };

    useEffect(() => {
        fetchOrder();
    }, []);

    useEffect(() => {
        fetchAttachments();
    }, [refresh]);

    useEffect(() => {
        fetchAttachments();
    }, [selected_order_item]);

    return (
        <>
            <Helmet>
                <title>${config.title} - Order Details</title>
            </Helmet>
            <Row>
                <Col>
                    <h2 className='mb-2 fw-50'>Orders {loading ? "Loading...." : order?.order_number}</h2>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Order Item</th>
                                <th>Quantity</th>
                                <th>Custom Design</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order?.order_items.map(item => (
                                <tr className={item.id === selected_order_item?.id ? 'activated blue' : ''} key={item.id} onClick={() => { setSelectedOrderItem(item) }}>
                                    <td>{item?.title}<strong>{item.sku}</strong></td>
                                    <td>{item?.quantity}</td>
                                    <td>{item?.custom_design || "N/A"}</td>
                                </tr>
                            ))}

                        </tbody>
                    </Table>
                </Col>
                <Col>
                    <Card>
                        <Card.Body>
                            {selected_order_item ? (
                                <>
                                    <Card.Title>{selected_order_item?.title}</Card.Title>
                                    <CardText>
                                        <p><strong>Custom Design: </strong>{selected_order_item?.custom_design || "N/A"}</p>
                                        <h5>Attachments</h5>
                                        <Form noValidate onSubmit={formikUpload.handleSubmit}>
                                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                                    <Form.Label className="text-center">
                                                        File to upload
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="file"
                                                        onChange={(event) => {
                                                            const file = event.currentTarget.files[0];
                                                            formikUpload.setFieldValue("attached_file", file);
                                                          }}
                                                    />
                                                    {formikUpload.touched.attached_file && formikUpload.errors.attached_file ? (
                                                        <Form.Control.Feedback>{formikUpload.errors.attached_file}</Form.Control.Feedback>
                                                    ) : null}
                                                </Form.Group>

                                                <div className="d-grid">
                                                    <Button variant="tertiary" type="submit" disabled={isSubmitting}>
                                                        {isSubmitting ? "Please wait..." : "Upload and notify"}
                                                    </Button>
                                                </div>
                                            </Form>
                                        <Row className="gx-1">
                                            {attachments.map(attachment => <Col key={attachment.id}><Attachment media={attachment}></Attachment></Col>)}
                                        </Row>
                                    </CardText>
                                </>
                            ) : (<>
                                <Card.Title>Order Item Not Selected</Card.Title>
                                <CardText>
                                    <p>Select an order item to load the attachments.</p>
                                </CardText>
                            </>)}
                        </Card.Body>
                    </Card>
                    <h2 className='mb-2 fw-50'></h2>
                </Col>
            </Row>
        </>
    );
};

export default OrderView;
