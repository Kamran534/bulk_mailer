import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { campaignAPI, contactAPI } from '../services/api';

const Dashboard = () => {
  const { data: campaignsResponse } = useQuery('campaigns', campaignAPI.getAll);
  const { data: contactsData } = useQuery('contacts', () => contactAPI.getAll({ limit: 1 }));

  const campaigns = campaignsResponse?.data || [];
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'sending').length;
  const totalContacts = contactsData?.data?.pagination?.total || 0;
  
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0;

  const recentCampaigns = campaigns
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Campaigns',
      value: totalCampaigns,
      bg: 'primary',
      icon: '📊'
    },
    {
      title: 'Active Campaigns',
      value: activeCampaigns,
      bg: 'success',
      icon: '🚀'
    },
    {
      title: 'Total Contacts',
      value: totalContacts.toLocaleString(),
      bg: 'info',
      icon: '👥'
    },
    {
      title: 'Emails Sent',
      value: totalSent.toLocaleString(),
      bg: 'warning',
      icon: '📧'
    }
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <div>
          <Button as={Link} to="/campaigns/create" variant="primary" className="me-2">Create Campaign</Button>
          <Button as={Link} to="/contacts" variant="outline-primary">Manage Contacts</Button>
        </div>
      </div>

      <Row className="mb-4">
        {stats.map((stat, index) => (
          <Col md={3} key={index}>
            <Card className={`text-white bg-${stat.bg} mb-3`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title className="h4">{stat.value}</Card.Title>
                    <Card.Text>{stat.title}</Card.Text>
                  </div>
                  <div style={{ fontSize: '2rem' }}>
                    {stat.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Performance Metrics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <div className="text-center">
                    <h3 className="text-primary">{openRate}%</h3>
                    <p className="text-muted">Open Rate</p>
                  </div>
                </Col>
                <Col>
                  <div className="text-center">
                    <h3 className="text-success">{clickRate}%</h3>
                    <p className="text-muted">Click Rate</p>
                  </div>
                </Col>
                <Col>
                  <div className="text-center">
                    <h3 className="text-info">{totalSent}</h3>
                    <p className="text-muted">Total Sent</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Recent Campaigns</h5>
              <Button as={Link} to="/campaigns" variant="outline-primary" size="sm">View All</Button>
            </Card.Header>
            <Card.Body>
              {recentCampaigns.length === 0 ? (
                <p className="text-muted text-center">No campaigns yet</p>
              ) : (
                <div>
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                      <div>
                        <h6 className="mb-1">{campaign.name}</h6>
                        <small className="text-muted">
                          {campaign.status} • {campaign.sent_count || 0} sent
                        </small>
                      </div>
                      <Button as={Link} to={`/campaigns/${campaign.id}`} variant="outline-primary" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;