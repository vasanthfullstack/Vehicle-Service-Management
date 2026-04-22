import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/components', label: 'Components', icon: '🔧' },
  { path: '/vehicles', label: 'Vehicles', icon: '🚗' },
  { path: '/service-records', label: 'Services', icon: '🛠️' },
  { path: '/payments', label: 'Payments', icon: '💳' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        ☰
      </button>
      <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🚘 VSMS</h2>
          <p>Vehicle Service Mgmt</p>
        </div>
        <ul className="nav-links">
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
