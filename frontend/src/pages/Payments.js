import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import './Components.css';

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    API.get('/payments/').then(res => setPayments(res.data));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Payment History</h1>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Payment #</th>
              <th>Service</th>
              <th>Vehicle</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan="7" className="empty">No payments recorded yet.</td></tr>
            ) : payments.map(p => (
              <tr key={p.id}>
                <td><strong>#{p.id}</strong></td>
                <td>Service #{p.service_record}</td>
                <td>{p.service_record_info?.vehicle}</td>
                <td className="price">₹{parseFloat(p.amount).toFixed(2)}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.payment_method.replace('_', ' ')}</td>
                <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                <td>{new Date(p.payment_date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
