import { Helmet } from 'react-helmet-async';
import config from "../config";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import * as Yup from 'yup';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as coreAxios from 'axios';
import { get as _get } from "lodash";
import { useAxios } from '../hooks/useAxios';

const OrderLoginSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    order_number: Yup.string().required('Order No. is required.'),
});




const Order = () => {
    const axios = useAxios();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [tokenRequested, setTokenRequested] = useState<boolean>(false);

    console.log(token)

    const formikLogin = useFormik({
        initialValues: {
            email: '',
            order_number: ''
        },
        validationSchema: OrderLoginSchema,
        onSubmit: async (values, { setErrors }) => {
            setIsSubmitting(true);
            try {
                //
                formikOtp.setFieldValue("email", values.email)
                formikOtp.setFieldValue("order_number", values.order_number)
                setTokenRequested(true)
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

    const formikOtp = useFormik({
        initialValues: {
            email: '',
            order_number: '',
            code: ''
        },
        validationSchema: OrderLoginSchema,
        onSubmit: async (values, { setErrors }) => {
            setIsSubmitting(true);
            try {
                // const params: Record<string, any> = {};
                // const response = await axios.get("/orders", { params , headers: { Authorization: `Bearer ${token}` }});
                const response = await axios.post("/orders/validate", values);
                setToken(_get(response, "data.data", null))
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

  return (
      <>
          <Helmet>
              <title>${config.title} - Order Details</title>
          </Helmet>
          <Row className="justify-content-md-center">
          <Col md={8} lg={6} xs={12}>
                        <div className="border border-3 border-tertiary"></div>
                        <Card className="shadow rounded-0">
                            <Card.Body>
                                <div className="mb-3 mt-md-4">
                                    <h2 className="fw-bold mb-2 text-uppercase">{config.title}</h2>
                                    {tokenRequested ? <p className=" mb-5">Please enter OTP to login!</p>:<p className=" mb-5">Please enter your order details!</p>}

                                    <div className="mb-3">
                                    {tokenRequested ? (
                                            <Form onSubmit={formikOtp.handleSubmit}>
                                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                                    <Form.Label className="text-center">
                                                        Enter OTP
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter OTP"
                                                        name="code"
                                                        onChange={formikOtp.handleChange}
                                                        onBlur={formikOtp.handleBlur}
                                                        value={formikOtp.values.code}
                                                    />
                                                    {formikOtp.touched.code && formikOtp.errors.code ? (
                                                        <Form.Control.Feedback type="invalid">{formikOtp.errors.code}</Form.Control.Feedback>
                                                    ) : null}
                                                </Form.Group>

                                                <div className="d-grid">
                                                    <Button variant="tertiary" type="submit" disabled={isSubmitting}>
                                                        {isSubmitting ? "Please wait..." : "Login"}
                                                    </Button>
                                                </div>
                                            </Form>
                                            ):(
                                            <Form noValidate onSubmit={formikLogin.handleSubmit}>
                                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                                    <Form.Label className="text-center">
                                                        Email address
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        placeholder="Enter email"
                                                        name="email"
                                                        onChange={formikLogin.handleChange}
                                                        onBlur={formikLogin.handleBlur}
                                                        value={formikLogin.values.email}
                                                        isInvalid={!!formikLogin.errors.email}
                                                    />
                                                    {formikLogin.touched.email && formikLogin.errors.email ? (
                                                        <Form.Control.Feedback>{formikLogin.errors.email}</Form.Control.Feedback>
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
                                                        onChange={formikLogin.handleChange}
                                                        onBlur={formikLogin.handleBlur}
                                                        value={formikLogin.values.order_number}
                                                        isInvalid={!!formikLogin.errors.order_number}
                                                    />
                                                    {formikLogin.touched.order_number && formikLogin.errors.order_number ? (
                                                        <Form.Control.Feedback>{formikLogin.errors.order_number}</Form.Control.Feedback>
                                                    ) : null}
                                                </Form.Group>

                                                <div className="d-grid">
                                                    <Button variant="tertiary" type="submit" disabled={isSubmitting}>
                                                        {isSubmitting ? "Please wait..." : "Login"}
                                                    </Button>
                                                </div>
                                            </Form>
                                        )
                                        }
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
          </Row>
          
      </>
  )
}

export default Order;
