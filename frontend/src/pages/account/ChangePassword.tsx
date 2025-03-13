import {Button, Card, Col, Container, Form, Row} from "react-bootstrap";
import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from 'yup';
import axios from "axios";
import {get as _get} from "lodash"
import ProfileService from "../../services/profile";

const FormSchema = Yup.object().shape({
    password_one: Yup.string().required('Password is required'),
    password_two: Yup.string().oneOf([Yup.ref('password_one'), ''], 'Passwords must match')
});

const ChangePassword = () => {
    // let { uid, token } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formikForm = useFormik({
        initialValues: {
            password_one: '',
            password_two: ''
        },
        validationSchema: FormSchema,
        onSubmit: async(values, {setErrors}) => {
            setIsSubmitting(true);
            try {
                const response = await ProfileService.changePassword(values);
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
    return (
        <div>
            <Container>
                <Row className="vh-100 d-flex justify-content-center align-items-center">
                    <Col md={8} lg={6} xs={12}>
                        <div className="border border-3 border-tertiary"></div>
                        <Card className="shadow rounded-0">
                            <Card.Body>
                            <Form noValidate onSubmit={formikForm.handleSubmit}>
                                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                                    <Form.Label className="text-center">
                                                        Password
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        placeholder="password"
                                                        name="password_one"
                                                        onChange={formikForm.handleChange}
                                                        onBlur={formikForm.handleBlur}
                                                        value={formikForm.values.password_one}
                                                        isInvalid={!!formikForm.errors.password_one}
                                                    />
                                                    {formikForm.touched.password_one && formikForm.errors.password_one ? (
                                                        <Form.Control.Feedback>{formikForm.errors.password_one}</Form.Control.Feedback>
                                                    ) : null}
                                                </Form.Group>
                                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                                    <Form.Label className="text-center">
                                                        Confirm Password
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        placeholder="password"
                                                        name="password_two"
                                                        onChange={formikForm.handleChange}
                                                        onBlur={formikForm.handleBlur}
                                                        value={formikForm.values.password_two}
                                                        isInvalid={!!formikForm.errors.password_two}
                                                    />
                                                    {formikForm.touched.password_two && formikForm.errors.password_two ? (
                                                        <Form.Control.Feedback>{formikForm.errors.password_two}</Form.Control.Feedback>
                                                    ) : null}
                                                </Form.Group>

                                                <div className="d-grid">
                                                    <Button variant="tertiary" type="submit" disabled={isSubmitting}>
                                                        {isSubmitting ? "Please wait..." : "Submit"}
                                                    </Button>
                                                </div>
                                            </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default ChangePassword;
