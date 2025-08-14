import React, { useState } from 'react';
import { Button, Table, Card, Form, Modal, Alert } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { contactAPI } from '../services/api';

const Contacts = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newContact, setNewContact] = useState({ email: '', first_name: '', last_name: '' });
  const [uploadResult, setUploadResult] = useState(null);

  const { data: contactsData, isLoading } = useQuery(
    'contacts',
    () => contactAPI.getAll({ limit: 100 })
  );

  const addMutation = useMutation(contactAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('contacts');
      setShowAddModal(false);
      setNewContact({ email: '', first_name: '', last_name: '' });
      toast.success('Contact added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add contact');
    },
  });

  const uploadMutation = useMutation(contactAPI.uploadCSV, {
    onSuccess: (response) => {
      queryClient.invalidateQueries('contacts');
      setUploadResult(response.data);
      toast.success(`CSV processed: ${response.data.successful} contacts added`);
    },
    onError: () => {
      toast.error('Failed to upload CSV');
    },
  });

  const deleteMutation = useMutation(contactAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('contacts');
      toast.success('Contact deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });

  const unsubscribeMutation = useMutation(contactAPI.unsubscribe, {
    onSuccess: () => {
      queryClient.invalidateQueries('contacts');
      toast.success('Contact unsubscribed');
    },
    onError: () => {
      toast.error('Failed to unsubscribe contact');
    },
  });

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const formData = new FormData();
      formData.append('csv', file);
      uploadMutation.mutate(formData);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  const contacts = contactsData?.data?.contacts || [];

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContact.email) {
      toast.error('Email is required');
      return;
    }
    addMutation.mutate(newContact);
  };

  const handleDelete = (id, email) => {
    if (window.confirm(`Are you sure you want to delete contact "${email}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      unsubscribed: 'warning',
      bounced: 'danger'
    };
    return <span className={`badge bg-${variants[status] || 'secondary'}`}>{status}</span>;
  };

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Contacts ({contactsData?.data?.pagination?.total || 0})</h1>
        <div>
          <Button variant="outline-primary" onClick={() => setShowAddModal(true)} className="me-2">
            Add Contact
          </Button>
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            Upload CSV
          </Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          {contacts.length === 0 ? (
            <div className="text-center py-5">
              <h5>No contacts yet</h5>
              <p className="text-muted">Add contacts manually or upload a CSV file</p>
              <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                Upload CSV
              </Button>
            </div>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>{contact.email}</td>
                    <td>{contact.first_name} {contact.last_name}</td>
                    <td>{getStatusBadge(contact.status)}</td>
                    <td>{formatDate(contact.created_at)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        {contact.status === 'active' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => unsubscribeMutation.mutate(contact.id)}
                          >
                            Unsubscribe
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(contact.id, contact.email)}
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

      {/* Add Contact Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Contact</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddContact}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                value={newContact.first_name}
                onChange={(e) => setNewContact({...newContact, first_name: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                value={newContact.last_name}
                onChange={(e) => setNewContact({...newContact, last_name: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={addMutation.isLoading}>
              {addMutation.isLoading ? 'Adding...' : 'Add Contact'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Upload CSV Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Contacts CSV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>CSV Format:</strong> Your CSV should have columns: email, first_name, last_name
            <br />
            <small>The email column is required. Other columns are optional.</small>
          </Alert>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-4 text-center ${
              isDragActive ? 'border-primary bg-light' : 'border-secondary'
            }`}
            style={{ cursor: 'pointer' }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the CSV file here...</p>
            ) : (
              <div>
                <p>Drag & drop a CSV file here, or click to select</p>
                <Button variant="outline-primary">Choose File</Button>
              </div>
            )}
          </div>

          {uploadMutation.isLoading && (
            <div className="mt-3">
              <Alert variant="info">Uploading and processing CSV...</Alert>
            </div>
          )}

          {uploadResult && (
            <div className="mt-3">
              <Alert variant="success">
                <h6>Upload Results:</h6>
                <ul className="mb-0">
                  <li>Processed: {uploadResult.processed} rows</li>
                  <li>Successful: {uploadResult.successful} contacts</li>
                  <li>Failed: {uploadResult.failed} rows</li>
                </ul>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-2">
                    <strong>Sample errors:</strong>
                    <ul className="mt-1">
                      {uploadResult.errors.slice(0, 3).map((error, index) => (
                        <li key={index} className="small">
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Contacts;