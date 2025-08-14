import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <Navbar style={{ backgroundColor: '#194765' }} variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img 
            src="/logo.png" 
            alt="Email Sender Logo" 
            height="32" 
            width="32" 
            className="me-2"
          />
          <span style={{ color: '#f97316', fontWeight: 'bold' }}>EMAIL SENDER</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" style={{ color: 'white' }}>
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/campaigns" style={{ color: 'white' }}>
              Campaigns
            </Nav.Link>
            <Nav.Link as={Link} to="/contacts" style={{ color: 'white' }}>
              Contacts
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;