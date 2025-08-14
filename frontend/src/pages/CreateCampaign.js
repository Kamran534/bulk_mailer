import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { campaignAPI, contactAPI } from '../services/api';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [htmlPreview, setHtmlPreview] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      from_email: '',
      from_name: '',
      subject: '',
      html_content: '',
      text_content: ''
    }
  });

  const { data: contactsData } = useQuery(
    'contacts-all', 
    () => contactAPI.getAll({ limit: 1000, status: 'active' })
  );

  const createMutation = useMutation(campaignAPI.create, {
    onSuccess: (response) => {
      toast.success('Campaign created successfully');
      navigate(`/campaigns/${response.data.id}`);
    },
    onError: () => {
      toast.error('Failed to create campaign');
    },
  });

  const contacts = contactsData?.data?.contacts || [];
  const htmlContent = watch('html_content');

  const onSubmit = (data) => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    createMutation.mutate({
      ...data,
      contact_ids: selectedContacts
    });
  };

  const handleContactToggle = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    setSelectedContacts(contacts.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  const templateVariables = [
    '{{first_name}}',
    '{{last_name}}',
    '{{email}}',
    '{{unsubscribe_url}}'
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create Campaign</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/campaigns')}>
          Back to Campaigns
        </Button>
      </div>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header>
                <h5>Campaign Details</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Campaign Name *</Form.Label>
                      <Form.Control
                        {...register('name', { required: 'Campaign name is required' })}
                        isInvalid={errors.name}
                        placeholder="e.g., Monthly Newsletter"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject Line *</Form.Label>
                      <Form.Control
                        {...register('subject', { required: 'Subject is required' })}
                        isInvalid={errors.subject}
                        placeholder="Your email subject"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.subject?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>From Email *</Form.Label>
                      <Form.Control
                        type="email"
                        {...register('from_email', { 
                          required: 'From email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        isInvalid={errors.from_email}
                        placeholder="noreply@yourcompany.com"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.from_email?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>From Name</Form.Label>
                      <Form.Control
                        {...register('from_name')}
                        placeholder="Your Company"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Email Content</h5>
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => setHtmlPreview(!htmlPreview)}
                  >
                    {htmlPreview ? 'Edit' : 'Preview'} HTML
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Alert variant="info">
                  <strong>Available variables:</strong> {templateVariables.join(', ')}
                </Alert>

                {!htmlPreview ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>HTML Content</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={10}
                        {...register('html_content')}
                        placeholder="Your HTML email content..."
                      />
                      <Form.Text className="text-muted">
                        You can use HTML tags and template variables like {`{{first_name}}`}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Plain Text Content</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        {...register('text_content')}
                        placeholder="Plain text version of your email..."
                      />
                      <Form.Text className="text-muted">
                        Fallback for email clients that don't support HTML
                      </Form.Text>
                    </Form.Group>
                  </>
                ) : (
                  <div>
                    <h6>HTML Preview:</h6>
                    <div 
                      className="border p-3 bg-light"
                      style={{ minHeight: '200px' }}
                      dangerouslySetInnerHTML={{ __html: htmlContent || '<p>No HTML content</p>' }}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Recipients ({selectedContacts.length})</h5>
                <div>
                  <Button variant="outline-primary" size="sm" onClick={selectAllContacts} className="me-2">
                    All
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {contacts.length === 0 ? (
                  <p className="text-muted">No active contacts found</p>
                ) : (
                  contacts.map((contact) => (
                    <Form.Check
                      key={contact.id}
                      type="checkbox"
                      id={`contact-${contact.id}`}
                      label={
                        <div>
                          <strong>{contact.email}</strong>
                          {(contact.first_name || contact.last_name) && (
                            <div className="text-muted small">
                              {contact.first_name} {contact.last_name}
                            </div>
                          )}
                        </div>
                      }
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleContactToggle(contact.id)}
                      className="mb-2"
                    />
                  ))
                )}
              </Card.Body>
            </Card>

            <div className="mt-3 d-grid">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg"
                disabled={createMutation.isLoading}
              >
                {createMutation.isLoading ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateCampaign;