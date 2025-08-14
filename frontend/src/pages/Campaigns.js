import React from 'react';
import { Button, Table, Badge, Card } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { campaignAPI } from '../services/api';

const Campaigns = () => {
  const queryClient = useQueryClient();
  const { data: campaignResponse, isLoading } = useQuery('campaigns', campaignAPI.getAll);
  const campaigns = campaignResponse?.data || [];

  const deleteMutation = useMutation(campaignAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('campaigns');
      toast.success('Campaign deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete campaign');
    },
  });

  const sendMutation = useMutation(campaignAPI.send, {
    onSuccess: () => {
      queryClient.invalidateQueries('campaigns');
      toast.success('Campaign sending started');
    },
    onError: () => {
      toast.error('Failed to start campaign');
    },
  });

  const pauseMutation = useMutation(campaignAPI.pause, {
    onSuccess: () => {
      queryClient.invalidateQueries('campaigns');
      toast.success('Campaign paused');
    },
    onError: () => {
      toast.error('Failed to pause campaign');
    },
  });

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete campaign "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Campaigns</h1>
        <Button as={Link} to="/campaigns/create" variant="primary">Create New Campaign</Button>
      </div>

      <Card>
        <Card.Body>
          {campaigns.length === 0 ? (
            <div className="text-center py-5">
              <h5>No campaigns yet</h5>
              <p className="text-muted">Create your first email campaign to get started</p>
              <Button as={Link} to="/campaigns/create" variant="primary">Create Campaign</Button>
            </div>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Sent</th>
                  <th>Opened</th>
                  <th>Clicked</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <Button as={Link} to={`/campaigns/${campaign.id}`} variant="link" className="p-0 text-start">
                        {campaign.name}
                      </Button>
                    </td>
                    <td>{campaign.subject}</td>
                    <td>{getStatusBadge(campaign.status)}</td>
                    <td>{campaign.total_recipients}</td>
                    <td>{campaign.sent_count || 0}</td>
                    <td>
                      {campaign.opened_count || 0}
                      {campaign.sent_count > 0 && (
                        <small className="text-muted">
                          {' '}({((campaign.opened_count || 0) / campaign.sent_count * 100).toFixed(1)}%)
                        </small>
                      )}
                    </td>
                    <td>
                      {campaign.clicked_count || 0}
                      {campaign.sent_count > 0 && (
                        <small className="text-muted">
                          {' '}({((campaign.clicked_count || 0) / campaign.sent_count * 100).toFixed(1)}%)
                        </small>
                      )}
                    </td>
                    <td>{formatDate(campaign.created_at)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button as={Link} to={`/campaigns/${campaign.id}`} variant="outline-primary" size="sm">View</Button>
                        
                        {campaign.status === 'draft' && (
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => sendMutation.mutate(campaign.id)}
                            disabled={sendMutation.isLoading}
                          >
                            Send
                          </Button>
                        )}
                        
                        {campaign.status === 'sending' && (
                          <Button 
                            variant="warning" 
                            size="sm"
                            onClick={() => pauseMutation.mutate(campaign.id)}
                            disabled={pauseMutation.isLoading}
                          >
                            Pause
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(campaign.id, campaign.name)}
                          disabled={deleteMutation.isLoading}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Campaigns;