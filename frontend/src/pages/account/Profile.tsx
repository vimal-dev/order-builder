import {Card, Col, Row} from "react-bootstrap";
import useAuth from "../../hooks/useAuth";

const Profile = () => {
    const {user} = useAuth();
  return (
      <div className="product-device-count mt-2">
          <Card>
            <Card.Header>{user?.name}</Card.Header>
            <Card.Body>
                <Row>
                    <Col>

                    </Col>
                </Row>
            </Card.Body>
          </Card>
      </div>
  )
}

export default Profile;
