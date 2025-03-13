import { Helmet } from 'react-helmet-async';
import config from "../config";
import { Col, Row } from "react-bootstrap";
import ConnectedStore from '../components/ConnectedStore';




const Home = () => {
  
  return (
      <>
          <Helmet>
              <title>${config.title} - Home</title>
          </Helmet>
          <Row className="justify-content-md-center">
            <Col xs md="4" lg="4">
              <ConnectedStore></ConnectedStore>
            </Col>
          </Row>
          
      </>
  )
}

export default Home;
