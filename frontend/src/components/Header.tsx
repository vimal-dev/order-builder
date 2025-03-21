import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import useAuth from "../hooks/useAuth";
import {Nav, NavItem} from "react-bootstrap";
import {Link} from "react-router-dom";
import logo from "../assets/logo.png";
import config from "../config";

function Header() {
    const {user, logout} = useAuth();
    return (
        <Navbar sticky={"top"} className="navbar-dark bg-tertiary">
            <Container fluid>
                <Navbar.Brand as={Link} to="/">
                    <img
                        src={logo}
                        alt={config.title}
                        height="25"
                    />
                </Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    <Nav>
                        <NavItem>
                            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                        </NavItem>
                        <NavItem>
                            <Nav.Link as={Link} to="/orders">Orders</Nav.Link>
                        </NavItem>
                        <NavItem>
                            <Nav.Link as={Link} to="/exports">Exports</Nav.Link>
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text className="mr-auto">
                        Signed in as: <Link to="/account"> {user?.name} </Link>
                    </Navbar.Text>
                    <Nav>
                        <NavItem>
                            <Nav.Link onClick={logout}>Logout</Nav.Link>
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;