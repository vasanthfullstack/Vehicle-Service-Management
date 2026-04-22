import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './Components.css';

export default function ServiceRecords() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicle: '', description: '', status: 'pending' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchRecords = () => {
    API.get('/service-records/').then(res => setRecords(res.data));
  };

  useEffect(() => {
    fetchRecords();
    API.get('/vehicles/').then(res => setVehicles(res.data));
  }, []);

  const openAdd = () => {
    if (vehicles.length === 0) { setError('Please add a vehicle first.'); setTimeout(() => setError(''), 3000); return; }
    setForm({ vehicle: vehicles[0].id, description: '', status: 'pending' });
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (r) => {
    setForm({ vehicle: r.vehicle, description: r.description, status: r.status });
    setEditId(r.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.vehicle || !form.description) { setError('Vehicle and description are required.'); return; }
    try {
      if (editId) {
        await API.put(`/service-records/${editId}/`, form);
        setSuccess('Service record updated!');
      } else {
        await API.post('/service-records/', form);
        setSuccess('Service record created!');
      }
      setShowModal(false);
      fetchRecords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service record?')) return;
    await API.delete(`/service-records/${id}/`);
    setSuccess('Deleted.');
    fetchRecords();
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Service Records</h1>
        <button className="btn-primary" onClick={openAdd}>+ New Service</button>
      </div>

      {success && <div className="toast success">{success}</div>}
      {error && !showModal && <div className="toast error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle</th>
              <th>Description</th>
              <th>Issues</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan="7" className="empty">No service records yet.</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>
                  <strong>{r.vehicle_info?.vehicle}</strong>
                  <small className="desc">{r.vehicle_info?.license_plate}</small>
                </td>
                <td>{r.description.length > 60 ? r.description.substring(0, 60) + '...' : r.description}</td>
                <td>{r.issue_count}</td>
                <td className="price">₹{parseFloat(r.total_cost).toFixed(2)}</td>
                <td><span className={`badge ${r.status}`}>{r.status.replace('_', ' ')}</span></td>
                <td className="actions">
                  <button className="btn-sm view" onClick={() => navigate(`/service-records/${r.id}`)}>View</button>
                  <button className="btn-sm edit" onClick={() => openEdit(r)}>Edit</button>
                  <button className="btn-sm delete" onClick={() => handleDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Edit Service Record' : 'New Service Record'}</h2>
            {error && <div className="toast error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label>Vehicle *
                <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })}>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicle_make} {v.vehicle_model} ({v.license_plate})</option>
                  ))}
                </select>
              </label>
              <label>Description *
                <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the service needed..." />
              </label>
              {editId && (
                <label>Status
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
