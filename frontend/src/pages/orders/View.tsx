import { useEffect, useState } from "react";
import { Table, Row, Col, Card, CardText, Button, Form, Badge } from "react-bootstrap";
import { useAuthenticatedAxios } from "../../hooks/useAxios";
import { IAttachment, IOrder, IOrderItem } from "../../types/order";
import { Helmet } from "react-helmet-async";
import { get as _get } from "lodash";
import { useFormik } from "formik";
import * as Yup from 'yup';
import * as coreAxios from "axios";

import config from "../../config";
import { Link, useParams } from "react-router-dom";
import Attachment from "../../components/Attachment";
import { toast } from "react-toastify";
import { OrderStatus, Status } from "../../enums/order";
import classNames from "classnames";

// interface IUpdateStatus{
//     id: number | string | null;
//     status: string | null;
//     comment: string | null;
// }

const UploadSchema = Yup.object().shape({
    attached_file: Yup.mixed().required('File is required'),
});


const DispatchUploadSchema = Yup.object().shape({
    pdf_file: Yup.mixed().required('File is required'),
    gift_file: Yup.mixed().required('File is required'),
});

const OrderView = () => {
    const axios = useAuthenticatedAxios();
    let { id } = useParams();
    const [refresh, setRefresh] = useState<number>(0);
    const [order, setOrder] = useState<IOrder | null>(null);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [_loadingAttachments, setLoadingAttachments] = useState(false);
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
                    await axios.post(`/orders/attachment/add/${selected_order_item?.id}`, formData, {
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

    const formikDispatch = useFormik({
        initialValues: {
            pdf_file: null,
            gift_file: null
        },
        validationSchema: DispatchUploadSchema,
        onSubmit: async (values, { setErrors, resetForm }) => {
            setIsSubmitting(true);
            try {
                const formData = new FormData();
                if (values.pdf_file) {
                    formData.append("pdf_file", values.pdf_file);
                }
                if (values.gift_file) {
                    formData.append("gift_file", values.gift_file);
                }
                await axios.post(`/orders/dispatch/${selected_order_item?.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                resetForm();
                toast("File uploaded successfully");
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
            const order_items = _get(response, "data.data.order_items", []);
            if (order_items && order_items?.length) {
                setSelectedOrderItem(order_items[0])
            }
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
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order?.order_items.map(item => (
                                <tr className={item.id === selected_order_item?.id ? 'activated blue' : ''} key={item.id} onClick={() => { setSelectedOrderItem(item) }}>
                                    <td>
                                        {item?.product_name}{item?.title ? <><br />{item?.title}</> : ''}<br />
                                        <span><strong>SKU: </strong>{item?.sku}</span><br />
                                        {item?.properties.map(property => (<><span><strong>{property.name}: </strong>{property.value}</span><br /></>))}
                                    </td>
                                    <td>{item?.quantity}</td>
                                    <td>
                                        <Badge className="rounded-0" bg={classNames("", {
                                            "success": item?.status === Status.DESIGN_APPROVED || item?.status === Status.READY_FOR_PRODUCTION,
                                            "info": item?.status === Status.PROCESSING,
                                            "warning": item?.status === Status.WAITING_FOR_APPROVAL,
                                            "danger": item?.status === Status.REJECTED || item?.status === Status.REVISION_REQUESTED
                                        })}>{item?.status}</Badge>
                                        {(item?.status === OrderStatus.STATUS_READY_FOR_PRODUCTION && item?.pdf_url) && (<div className="m-3"></div>)}
                                        {(item?.status === OrderStatus.STATUS_READY_FOR_PRODUCTION && item?.pdf_url) && (
                                            <Link to={item?.pdf_url} target="_blank" className="btn btn-sm btn-success rounded-0 me-2">Download PDF/Image</Link>
                                        )}
                                        {(item?.status === OrderStatus.STATUS_READY_FOR_PRODUCTION && item?.gift_url) && (
                                            <Link to={item?.gift_url} target="_blank" className="btn btn-sm btn-success rounded-0 me-2">Download Gift Image</Link>
                                        )}
                                    </td>
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
                                        {(selected_order_item.status !== OrderStatus.STATUS_DESIGN_APPROVED &&  selected_order_item.status !== OrderStatus.STATUS_READY_FOR_PRODUCTION) && (
                                            <>
                                                <h5>Add Design</h5>
                                                <Form noValidate onSubmit={formikUpload.handleSubmit}>
                                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                                        <Form.Label className="text-center">
                                                            File to upload
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            onChange={(event) => {
                                                                const input = event.currentTarget as HTMLInputElement;
                                                                if (input.files && input.files.length > 0) {
                                                                    const file = input.files[0];
                                                                    formikUpload.setFieldValue("attached_file", file);
                                                                }
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
                                            </>
                                        )}

                                        {(selected_order_item.status == OrderStatus.STATUS_DESIGN_APPROVED ||  selected_order_item.status == OrderStatus.STATUS_READY_FOR_PRODUCTION) && (
                                            <>
                                                <h5>Dispatch & Mark production Ready</h5>
                                                <Form noValidate onSubmit={formikDispatch.handleSubmit}>
                                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                                        <Form.Label className="text-center">
                                                            Pdf/Image File
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            name="pdf_file"
                                                            onChange={(event) => {
                                                                const input = event.currentTarget as HTMLInputElement;
                                                                if (input.files && input.files.length > 0) {
                                                                    const file = input.files[0];
                                                                    formikDispatch.setFieldValue("pdf_file", file);
                                                                }
                                                            }}
                                                        />
                                                        {formikDispatch.touched.pdf_file && formikDispatch.errors.pdf_file ? (
                                                            <Form.Control.Feedback>{formikDispatch.errors.pdf_file}</Form.Control.Feedback>
                                                        ) : null}
                                                    </Form.Group>

                                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                                        <Form.Label className="text-center">
                                                            Gift Image
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            name="gift_file"
                                                            onChange={(event) => {
                                                                const input = event.currentTarget as HTMLInputElement;
                                                                if (input.files && input.files.length > 0) {
                                                                    const file = input.files[0];
                                                                    formikDispatch.setFieldValue("gift_file", file);
                                                                }
                                                            }}
                                                        />
                                                        {formikDispatch.touched.gift_file && formikDispatch.errors.gift_file ? (
                                                            <Form.Control.Feedback>{formikDispatch.errors.gift_file}</Form.Control.Feedback>
                                                        ) : null}
                                                    </Form.Group>

                                                    <div className="d-grid">
                                                        <Button variant="tertiary" type="submit" disabled={isSubmitting}>
                                                            {isSubmitting ? "Please wait..." : "Upload and Dispatch"}
                                                        </Button>
                                                    </div>
                                                </Form>
                                            </>
                                        )}
                                        <h5 className="mt-2">Attachments</h5>
                                        {attachments.map(attachment => <Col key={attachment.id}><Attachment media={attachment} handleStatus={(id, status) => console.log(`${id}: ${status}`)}></Attachment></Col>)}
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
