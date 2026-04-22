import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import './Components.css';

const emptyForm = { owner_name: '', owner_phone: '', owner_email: '', vehicle_make: '', vehicle_model: '', vehicle_year: '', license_plate: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVehicles = () => {
    API.get('/vehicles/').then(res => setVehicles(res.data));
  };

  useEffect(() => { fetchVehicles(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowModal(true); };

  const openEdit = (v) => {
    setForm({
      owner_name: v.owner_name, owner_phone: v.owner_phone, owner_email: v.owner_email || '',
      vehicle_make: v.vehicle_make, vehicle_model: v.vehicle_model,
      vehicle_year: v.vehicle_year.toString(), license_plate: v.license_plate,
    });
    setEditId(v.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.owner_name || !form.owner_phone || !form.vehicle_make || !form.vehicle_model || !form.vehicle_year || !form.license_plate) {
      setError('Please fill all required fields.');
      return;
    }
    try {
      if (editId) {
        await API.put(`/vehicles/${editId}/`, form);
        setSuccess('Vehicle updated!');
      } else {
        await API.post('/vehicles/', form);
        setSuccess('Vehicle added!');
      }
      setShowModal(false);
      fetchVehicles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.license_plate) setError(`License plate: ${data.license_plate[0]}`);
      else setError('Something went wrong.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle and all its service records?')) return;
    await API.delete(`/vehicles/${id}/`);
    setSuccess('Vehicle deleted.');
    fetchVehicles();
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Vehicles</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Vehicle</button>
      </div>

      {success && <div className="toast success">{success}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>License Plate</th>
              <th>Owner</th>
              <th>Phone</th>
              <th>Services</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr><td colSpan="6" className="empty">No vehicles registered yet.</td></tr>
            ) : vehicles.map(v => (
              <tr key={v.id}>
                <td><strong>{v.vehicle_make} {v.vehicle_model}</strong><small className="desc">{v.vehicle_year}</small></td>
                <td><strong>{v.license_plate}</strong></td>
                <td>{v.owner_name}</td>
                <td>{v.owner_phone}</td>
                <td>{v.service_count}</td>
                <td className="actions">
                  <button className="btn-sm edit" onClick={() => openEdit(v)}>Edit</button>
                  <button className="btn-sm delete" onClick={() => handleDelete(v.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            {error && <div className="toast error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label>Owner Name *
                <input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
              </label>
              <label>Phone *
                <input value={form.owner_phone} onChange={e => setForm({ ...form, owner_phone: e.target.value })} />
              </label>
              <label>Email
                <input type="email" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} />
              </label>
              <label>Vehicle Make *
                <input value={form.vehicle_make} onChange={e => setForm({ ...form, vehicle_make: e.target.value })} placeholder="e.g. Toyota" />
              </label>
              <label>Vehicle Model *
                <input value={form.vehicle_model} onChange={e => setForm({ ...form, vehicle_model: e.target.value })} placeholder="e.g. Camry" />
              </label>
              <label>Year *
                <input type="number" value={form.vehicle_year} onChange={e => setForm({ ...form, vehicle_year: e.target.value })} placeholder="e.g. 2022" />
              </label>
              <label>License Plate *
                <input value={form.license_plate} onChange={e => setForm({ ...form, license_plate: e.target.value })} placeholder="e.g. ABC-1234" />
              </label>
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
