import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Row, Col, Table, Badge, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { campaignAPI } from '../services/api';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: campaignData, isLoading } = useQuery(
    ['campaign', id],
    () => campaignAPI.getById(id)
  );

  const sendMutation = useMutation(campaignAPI.send, {
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign', id]);
      toast.success('Campaign sending started');
    },
    onError: () => {
      toast.error('Failed to start campaign');
    },
  });

  const pauseMutation = useMutation(campaignAPI.pause, {
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign', id]);
      toast.success('Campaign paused');
    },
    onError: () => {
      toast.error('Failed to pause campaign');
    },
  });

  if (isLoading) {
    return <div>Loading campaign...</div>;
  }

  if (!campaignData?.data) {
    return (
      <Alert variant="danger">
        Campaign not found
        <div className="mt-2">
          <Button variant="primary" onClick={() => navigate('/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </Alert>
    );
  }

  const { campaign, recipients } = campaignData.data;

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      scheduled: 'warning',
      sending: 'primary',
      sent: 'success',
      paused: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getRecipientStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      sent: 'success',
      failed: 'danger',
      bounced: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openRate = campaign.sent_count > 0 ? 
    ((campaign.opened_count || 0) / campaign.sent_count * 100).toFixed(1) : 0;
  
  const clickRate = campaign.sent_count > 0 ? 
    ((campaign.clicked_count || 0) / campaign.sent_count * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>{campaign.name}</h1>
          <p className="text-muted mb-0">Campaign ID: {campaign.id}</p>
        </div>
        <div>
          {campaign.status === 'draft' && (
            <Button 
              variant="success" 
              onClick={() => sendMutation.mutate(campaign.id)}
              disabled={sendMutation.isLoading}
              className="me-2"
            >
              {sendMutation.isLoading ? 'Starting...' : 'Send Campaign'}
            </Button>
          )}
          
          {campaign.status === 'sending' && (
            <Button 
              variant="warning" 
              onClick={() => pauseMutation.mutate(campaign.id)}
              disabled={pauseMutation.isLoading}
              className="me-2"
            >
              {pauseMutation.isLoading ? 'Pausing...' : 'Pause Campaign'}
            </Button>
          )}
          
          <Button variant="outline-secondary" onClick={() => navigate('/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{campaign.total_recipients}</h3>
              <p className="text-muted mb-0">Total Recipients</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{campaign.sent_count || 0}</h3>
              <p className="text-muted mb-0">Emails Sent</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{openRate}%</h3>
              <p className="text-muted mb-0">Open Rate</p>
              <small className="text-muted">({campaign.opened_count || 0} opens)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{clickRate}%</h3>
              <p className="text-muted mb-0">Click Rate</p>
              <small className="text-muted">({campaign.clicked_count || 0} clicks)</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Campaign Details</h5>
            </Card.Header>
            <Card.Body>
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td>{getStatusBadge(campaign.status)}</td>
                  </tr>
                  <tr>
                    <td><strong>Subject:</strong></td>
                    <td>{campaign.subject}</td>
                  </tr>
                  <tr>
                    <td><strong>From:</strong></td>
                    <td>
                      {campaign.from_name ? `${campaign.from_name} <${campaign.from_email}>` : campaign.from_email}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Created:</strong></td>
                    <td>{formatDate(campaign.created_at)}</td>
                  </tr>
                  <tr>
                    <td><strong>Sent:</strong></td>
                    <td>{formatDate(campaign.sent_at)}</td>
                  </tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5>Email Content</h5>
            </Card.Header>
            <Card.Body>
              {campaign.html_content ? (
                <div>
                  <h6>HTML Version:</h6>
                  <div 
                    className="border p-3 bg-light mb-3"
                    style={{ maxHeight: '300px', overflow: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: campaign.html_content }}
                  />
                </div>
              ) : null}
              
              {campaign.text_content ? (
                <div>
                  <h6>Text Version:</h6>
                  <pre className="bg-light p-3 border" style={{ fontSize: '0.875rem' }}>
                    {campaign.text_content}
                  </pre>
                </div>
              ) : null}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Recipients ({recipients.length})</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflow: 'auto' }}>
              {recipients.length === 0 ? (
                <p className="text-muted">No recipients found</p>
              ) : (
                <Table size="sm" responsive>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Opened</th>
                      <th>Clicked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td>{recipient.email}</td>
                        <td>{recipient.first_name} {recipient.last_name}</td>
                        <td>{getRecipientStatusBadge(recipient.status)}</td>
                        <td>
                          {recipient.sent_at ? (
                            <small>{formatDate(recipient.sent_at)}</small>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {recipient.opened_at ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {recipient.clicked_at ? (
                            <span className="text-primary">✓</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CampaignDetail;