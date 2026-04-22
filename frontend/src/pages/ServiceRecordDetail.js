import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './ServiceRecordDetail.css';

export default function ServiceRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [components, setComponents] = useState([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ description: '', resolution_type: 'new_component', component: '', labor_charge: '0', quantity: '1' });
  const [payMethod, setPayMethod] = useState('cash');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRecord = useCallback(() => {
    API.get(`/service-records/${id}/`).then(res => { setRecord(res.data); setLoading(false); }).catch(() => { setLoading(false); });
  }, [id]);

  useEffect(() => {
    fetchRecord();
    API.get('/components/').then(res => setComponents(res.data));
  }, [fetchRecord]);

  const filteredComponents = components.filter(c =>
    issueForm.resolution_type === 'new_component' ? c.component_type === 'part' : c.component_type === 'repair_service'
  );

  const handleAddIssue = async (e) => {
    e.preventDefault();
    setError('');
    if (!issueForm.description) { setError('Description is required.'); return; }
    try {
      await API.post('/issues/', { ...issueForm, service_record: id, component: issueForm.component || null });
      setShowIssueModal(false);
      setSuccess('Issue added!');
      fetchRecord();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add issue.');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Remove this issue?')) return;
    await API.delete(`/issues/${issueId}/`);
    fetchRecord();
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/payments/', { service_record: id, payment_method: payMethod });
      setShowPayModal(false);
      setSuccess('Payment processed successfully!');
      fetchRecord();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!record) return <div className="loading">Service record not found.</div>;

  const isPaid = record.status === 'paid';

  return (
    <div className="detail-page">
      <button className="btn-back" onClick={() => navigate('/service-records')}>← Back to Services</button>

      {success && <div className="toast success">{success}</div>}
      {error && !showIssueModal && <div className="toast error">{error}</div>}

      <div className="detail-header">
        <div>
          <h1>Service #{record.id}</h1>
          <span className={`badge ${record.status}`}>{record.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="info-card">
          <h3>Vehicle Information</h3>
          <div className="info-row"><span>Vehicle:</span><strong>{record.vehicle_info?.vehicle}</strong></div>
          <div className="info-row"><span>License Plate:</span><strong>{record.vehicle_info?.license_plate}</strong></div>
          <div className="info-row"><span>Owner:</span><strong>{record.vehicle_info?.owner_name}</strong></div>
        </div>

        <div className="info-card">
          <h3>Service Details</h3>
          <div className="info-row"><span>Description:</span><strong>{record.description}</strong></div>
          <div className="info-row"><span>Created:</span><strong>{new Date(record.created_at).toLocaleDateString()}</strong></div>
          <div className="info-row"><span>Total Cost:</span><strong className="total-price">₹{parseFloat(record.total_cost).toFixed(2)}</strong></div>
        </div>
      </div>

      <div className="issues-section">
        <div className="section-header">
          <h2>Issues & Components ({record.issues?.length || 0})</h2>
          {!isPaid && <button className="btn-primary" onClick={() => { setIssueForm({ description: '', resolution_type: 'new_component', component: '', labor_charge: '0', quantity: '1' }); setError(''); setShowIssueModal(true); }}>+ Add Issue</button>}
        </div>

        {record.issues?.length === 0 ? (
          <p className="no-issues">No issues added yet. Click "Add Issue" to report problems and select components.</p>
        ) : (
          <div className="issues-list">
            {record.issues.map(issue => (
              <div className="issue-card" key={issue.id}>
                <div className="issue-main">
                  <div className="issue-desc">
                    <strong>{issue.description}</strong>
                    <span className={`badge ${issue.resolution_type === 'new_component' ? 'part' : 'repair_service'}`}>
                      {issue.resolution_type === 'new_component' ? 'New Component' : 'Repair'}
                    </span>
                  </div>
                  {!isPaid && <button className="btn-sm delete" onClick={() => handleDeleteIssue(issue.id)}>Remove</button>}
                </div>
                <div className="issue-details">
                  {issue.component_name && <span>Component: <strong>{issue.component_name}</strong> × {issue.quantity} = ₹{(parseFloat(issue.component_price) * issue.quantity).toFixed(2)}</span>}
                  {parseFloat(issue.labor_charge) > 0 && <span>Labor: <strong>₹{parseFloat(issue.labor_charge).toFixed(2)}</strong></span>}
                  <span className="issue-total">Subtotal: <strong>₹{parseFloat(issue.total_cost).toFixed(2)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Section */}
      <div className="payment-section">
        {isPaid && record.payment ? (
          <div className="payment-done">
            <h3>✅ Payment Completed</h3>
            <div className="info-row"><span>Amount Paid:</span><strong>₹{parseFloat(record.payment.amount).toFixed(2)}</strong></div>
            <div className="info-row"><span>Method:</span><strong>{record.payment.payment_method}</strong></div>
            <div className="info-row"><span>Date:</span><strong>{new Date(record.payment.payment_date).toLocaleString()}</strong></div>
          </div>
        ) : (
          record.issues?.length > 0 && (
            <div className="payment-ready">
              <div className="payment-summary">
                <h3>Payment Summary</h3>
                <div className="grand-total">
                  <span>Total Amount Due:</span>
                  <strong>₹{parseFloat(record.total_cost).toFixed(2)}</strong>
                </div>
              </div>
              <button className="btn-pay" onClick={() => setShowPayModal(true)}>Process Payment</button>
            </div>
          )
        )}
      </div>

      {/* Add Issue Modal */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Issue</h2>
            {error && <div className="toast error">{error}</div>}
            <form onSubmit={handleAddIssue}>
              <label>Issue Description *
                <textarea rows="2" value={issueForm.description} onChange={e => setIssueForm({ ...issueForm, description: e.target.value })} placeholder="Describe the problem..." />
              </label>
              <label>Resolution Type
                <select value={issueForm.resolution_type} onChange={e => setIssueForm({ ...issueForm, resolution_type: e.target.value, component: '' })}>
                  <option value="new_component">New Component</option>
                  <option value="repair">Repair Service</option>
                </select>
              </label>
              <label>Component
                <select value={issueForm.component} onChange={e => setIssueForm({ ...issueForm, component: e.target.value })}>
                  <option value="">-- Select Component --</option>
                  {filteredComponents.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (₹{parseFloat(c.price).toFixed(2)})</option>
                  ))}
                </select>
              </label>
              {issueForm.resolution_type === 'new_component' && (
                <label>Quantity
                  <input type="number" min="1" value={issueForm.quantity} onChange={e => setIssueForm({ ...issueForm, quantity: e.target.value })} />
                </label>
              )}
              <label>Labor Charge (₹)
                <input type="number" step="0.01" min="0" value={issueForm.labor_charge} onChange={e => setIssueForm({ ...issueForm, labor_charge: e.target.value })} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Process Payment</h2>
            <div className="pay-amount">
              <span>Amount:</span>
              <strong>₹{parseFloat(record.total_cost).toFixed(2)}</strong>
            </div>
            <form onSubmit={handlePayment}>
              <label>Payment Method
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn-pay">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
