import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import './Components.css';

const emptyForm = { name: '', description: '', component_type: 'part', price: '', stock_quantity: '0' };

export default function Components() {
  const [components, setComponents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchComponents = () => {
    API.get('/components/').then(res => setComponents(res.data));
  };

  useEffect(() => { fetchComponents(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (comp) => {
    setForm({
      name: comp.name,
      description: comp.description || '',
      component_type: comp.component_type,
      price: comp.price,
      stock_quantity: comp.stock_quantity.toString(),
    });
    setEditId(comp.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.price) {
      setError('Name and Price are required.');
      return;
    }
    try {
      if (editId) {
        await API.put(`/components/${editId}/`, form);
        setSuccess('Component updated!');
      } else {
        await API.post('/components/', form);
        setSuccess('Component added!');
      }
      setShowModal(false);
      fetchComponents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this component?')) return;
    await API.delete(`/components/${id}/`);
    setSuccess('Component deleted.');
    fetchComponents();
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Components & Pricing</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Component</button>
      </div>

      {success && <div className="toast success">{success}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.length === 0 ? (
              <tr><td colSpan="5" className="empty">No components registered yet.</td></tr>
            ) : components.map(c => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  {c.description && <small className="desc">{c.description}</small>}
                </td>
                <td><span className={`badge ${c.component_type}`}>{c.component_type === 'part' ? 'New Part' : 'Repair Service'}</span></td>
                <td className="price">₹{parseFloat(c.price).toFixed(2)}</td>
                <td>{c.component_type === 'part' ? c.stock_quantity : '—'}</td>
                <td className="actions">
                  <button className="btn-sm edit" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn-sm delete" onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Edit Component' : 'Add Component'}</h2>
            {error && <div className="toast error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label>Name *
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>Description
                <textarea rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </label>
              <label>Type *
                <select value={form.component_type} onChange={e => setForm({ ...form, component_type: e.target.value })}>
                  <option value="part">New Part</option>
                  <option value="repair_service">Repair Service</option>
                </select>
              </label>
              <label>Price (₹) *
                <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </label>
              {form.component_type === 'part' && (
                <label>Stock Quantity
                  <input type="number" min="0" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
                </label>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
