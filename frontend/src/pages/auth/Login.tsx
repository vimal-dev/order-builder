import { useEffect, useState } from "react";
import { Col, Button, Row, Container, Card, Form } from "react-bootstrap";
import useAuth from "../../hooks/useAuth";
import { useFormik } from "formik";
import * as Yup from 'yup';
import config from "../../config";
import { get as _get } from "lodash";
import AuthService from "../../services/auth";
import axios from "axios";
import logo from "../../assets/logo.png";

const LoginSchema = Yup.object().shape({
    username: Yup.string().email('Invalid email').required('Email is required'),
});

const OtpSchema = Yup.object().shape({
    username: Yup.string().email('Invalid email').required('Email is required'),
    code: Yup.string().required('Verification code is required.'),
});

const Login = () => {
    const { login } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [identifier, setIdentifier] = useState<string | null>(null);
    const formikLogin = useFormik({
        initialValues: {
            username: ''
        },
        validationSchema: LoginSchema,
        onSubmit: async (values, { setErrors }) => {
            setIsSubmitting(true);
            try {
                await AuthService.login(values);
                setIdentifier(values.username);
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
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
            username: '',
            code: ''
        },
        validationSchema: OtpSchema,
        onSubmit: async (values, { setErrors }) => {
            setIsSubmitting(true);
            try {
                const loginResponse = await AuthService.verifyOtp(values);
                const token = _get(loginResponse, "data.access_token", null)
                const refresh_token = _get(loginResponse, "data.refresh_token", null)
                login(token, refresh_token);
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    if (error.response && error.response.status === 422) {
                        setErrors(_get(error, "response.data.errors", {}));
                    }
                }
            }
            setIsSubmitting(false);
        },
    });
    useEffect(() => {
        formikOtp.setFieldValue("username", identifier)
    }, [identifier])
    return (
        <div>
            <Container>
                <Row className="vh-100 d-flex justify-content-center align-items-center">
                    <Col md={8} lg={6} xs={12}>
                        <div className="border border-3 border-tertiary"></div>
                        <Card className="shadow rounded-0">
                            <Card.Body>
                                <div className="mb-3 mt-md-4">
                                    <div className="text-center">
                                        <img
                                            src={logo}
                                            alt={config.title}
                                            height="50"
                                        />
                                    </div>
                                    <div className="mb-3">
                                    {identifier ? (
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
                                                    <Form.Text muted>
                                                        Please enter OTP to login!
                                                    </Form.Text>
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
                                                        name="username"
                                                        onChange={formikLogin.handleChange}
                                                        onBlur={formikLogin.handleBlur}
                                                        value={formikLogin.values.username}
                                                        isInvalid={!!formikLogin.errors.username}
                                                    />
                                                    <Form.Text muted>
                                                        Enter your registered email!
                                                    </Form.Text>
                                                    {formikLogin.touched.username && formikLogin.errors.username ? (
                                                        <Form.Control.Feedback>{formikLogin.errors.username}</Form.Control.Feedback>
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
            </Container>
        </div>
    );
}

export default Login;
