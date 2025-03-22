import { Helmet } from 'react-helmet-async';
import config from "../config";
import { Badge, Button, Card, CardText, Col, Form, Modal, Row, Table } from "react-bootstrap";
import * as Yup from 'yup';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as coreAxios from 'axios';
import { get as _get } from "lodash";
import { useAxios } from '../hooks/useAxios';
import { IAttachment, IOrder, IOrderItem } from '../types/front/order';
import Attachment from '../components/front/Attachment';
import { OrderStatus } from '../enums/order';
import logo from "../assets/logo.png";

const CredentialsSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    order_number: Yup.string().required('Order No. is required.'),
});

const StatusSchema = Yup.object().shape({
    comment: Yup.string().required('Comment is required'),
});


const Order = () => {
    const axios = useAxios();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<IOrder | null>(null);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [loadingAttachments, setLoadingAttachments] = useState(false);
    const [selected_order_item, setSelectedOrderItem] = useState<IOrderItem | null>(null);
    const [showModal, setShowModal] = useState(false);

    console.log(loadingAttachments);

    const formikCred = useFormik({
        initialValues: {
            email: '',
            order_number: ''
        },
        validationSchema: CredentialsSchema,
        onSubmit: async (values, { setErrors }) => {
            setLoading(true);
            try {
                const response = await axios.post(`/o/details`, values);
                setOrder(_get(response, "data.data", null));
                const order_items = _get(response, "data.data.order_items", []);
                if (order_items && order_items?.length) {
                    setSelectedOrderItem(order_items[0])
                }
            } catch (error: unknown) {
                if (coreAxios.isAxiosError(error)) {
                    if (error.response && error.response.status === 422) {
                        setErrors(_get(error, "response.data.errors", {}));
                    }
                }
            }
            setLoading(false);
        },
    });

    const formikStatus = useFormik({
        initialValues: {
            id: null,
            status: null,
            comment: ""
        },
        validationSchema: StatusSchema,
        onSubmit: async (values, { setErrors }) => {
            setIsSubmitting(true);
            try {
                await axios.post(`o/attachment/update/${selected_order_item?.id}/${values.id}`, { "status": values.status, "comment": values.comment });
                fetchAttachments();
                handleModalClose();
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

    const fetchAttachments = async () => {
        if (!selected_order_item) {
            return;
        }
        setLoadingAttachments(true);
        try {
            const params: Record<string, any> = {};
            // if (nextCursor) params.cursor = nextCursor;
            const response = await axios.get(`/o/attachments/${selected_order_item?.id}`, { params });
            setAttachments(_get(response, "data.data.items", []));
        } catch (error) {
            console.error("Error fetching attachments", error);
        }
        setLoadingAttachments(false);
    };

    const handleStatus = (id: string | number | null, status: string | null) => {
        formikStatus.setFieldValue("id", id);
        formikStatus.setFieldValue("status", status);
        setShowModal(true)
    };

    const handleModalClose = () => {
        formikStatus.setFieldValue("id", null);
        formikStatus.setFieldValue("status", null);
        formikStatus.setFieldValue("comment", null);
        setShowModal(false)
    }

    useEffect(() => {
        fetchAttachments();
    }, [selected_order_item]);

    return (
        <>
            <Helmet>
                <title>${config.title} - Order Details</title>
            </Helmet>

            {order ? (
                <>
                    <Col>
                        <div className="d-flex bg-tertiary justify-content-center py-2 mb-4">
                            <img
                                src={logo}
                                alt={config.title}
                                height="50"
                                className='content-align-center'
                            />
                        </div>
                        <h2 className='mb-2 fw-50'>Orders {loading ? "Loading...." : order?.order_number}</h2>
                        <Row className='g-0'>
                            <Col>
                                <Row>
                                    <Col>
                                        <Table striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th>Order Item</th>
                                                    <th>#</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order?.order_items.map(item => (
                                                    <tr className={item.id === selected_order_item?.id ? 'activated blue' : ''} key={item.id} onClick={() => { setSelectedOrderItem(item) }}>
                                                        <td>
                                                            {item?.product_name}{item?.title ? <><br />{item?.title}</> : ''}<br />
                                                            <span><strong>SKU: </strong>{item?.sku}</span><br />
                                                        </td>
                                                        <td>
                                                            <Button variant='jewelry' size='sm' disabled={item.id === selected_order_item?.id ? true : false} onClick={() => { setSelectedOrderItem(item) }}>{item.id === selected_order_item?.id ? "Selected":"Select"}</Button>
                                                        </td>
                                                    </tr>
                                                ))}

                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
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
                                                    {attachments.map(attachment => <Col key={attachment.id}><Attachment media={attachment} handleStatus={handleStatus}></Attachment></Col>)}
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
                            </Col>
                        </Row>
                        <Modal show={showModal} onHide={handleModalClose}>
                            <Modal.Header closeButton>
                                <Modal.Title>{formikStatus.values.status === "Accept" ? "Accept Design" : "Request Revision"}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Form noValidate onSubmit={formikStatus.handleSubmit}>
                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                        <Form.Label className="text-center">
                                            Comment
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Your comment?"
                                            name="comment"
                                            onChange={formikStatus.handleChange}
                                            onBlur={formikStatus.handleBlur}
                                            value={formikStatus.values.comment}
                                        />
                                        {formikStatus.touched.comment && formikStatus.errors.comment ? (
                                            <Form.Control.Feedback>{formikStatus.errors.comment}</Form.Control.Feedback>
                                        ) : null}
                                    </Form.Group>

                                    <div>
                                        <Button className='rounded-0' variant="secondary" onClick={handleModalClose}>
                                            Close
                                        </Button>
                                        <Button className='float-end rounded-0' variant="tertiary" type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? "Please wait..." : "Update"}
                                        </Button>
                                    </div>
                                </Form>
                            </Modal.Body>
                        </Modal>
                    </Col>
                </>
            ) : (
                <>
                    <Row className="justify-content-md-center">
                        <Col md={8} lg={6} xs={12}>
                            <div className="border border-3 border-tertiary"></div>
                            <Card className="shadow rounded-0">
                                <Card.Body>
                                    <div className="text-center">
                                        <img
                                            src={logo}
                                            alt={config.title}
                                            height="50"
                                        />
                                    </div>
                                    <div className="mb-3 mt-md-4">
                                        <p className="text-center mb-5">Please enter your order details!</p>
                                        <div className="mb-3">
                                            <Form noValidate onSubmit={formikCred.handleSubmit}>
                                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                                    <Form.Label className="text-center">
                                                        Email address
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        placeholder="Enter email"
                                                        name="email"
                                                        onChange={formikCred.handleChange}
                                                        onBlur={formikCred.handleBlur}
                                                        value={formikCred.values.email}
                                                        isInvalid={!!formikCred.errors.email}
                                                    />
                                                    {formikCred.touched.email && formikCred.errors.email ? (
                                                        <Form.Control.Feedback>{formikCred.errors.email}</Form.Control.Feedback>
                                                    ) : null}
                                                </Form.Group>
                                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                                    <Form.Label className="text-center">
                                                        Order Number
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter order number"
                                                        name="order_number"
                                                        onChange={formikCred.handleChange}
                                                        onBlur={formikCred.handleBlur}
                                                        value={formikCred.values.order_number}
                                                        isInvalid={!!formikCred.errors.order_number}
                                                    />
                                                    {formikCred.touched.order_number && formikCred.errors.order_number ? (
                                                        <Form.Control.Feedback>{formikCred.errors.order_number}</Form.Control.Feedback>
                                                    ) : null}
                                                </Form.Group>

                                                <div className="d-grid">
                                                    <Button variant="jewelry" type="submit" disabled={isSubmitting || formikCred.values.email === "" || formikCred.values.order_number === ""}>
                                                        {isSubmitting ? "Please wait..." : "Fetch Order"}
                                                    </Button>
                                                </div>
                                            </Form>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}



        </>
    )
}

export default Order;
