import config from "../config";
import Container from "react-bootstrap/Container";

function Footer() {
    return <>
        <div className="mt-3">
            <Container fluid>
                <div className="d-flex justify-content-end">
                    <p>{config.title} @ {new Date().getFullYear()}</p>
                </div>
            </Container>
        </div>
    </>
}

export default Footer;