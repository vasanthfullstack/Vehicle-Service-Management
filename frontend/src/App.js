import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Components from './pages/Components';
import Vehicles from './pages/Vehicles';
import ServiceRecords from './pages/ServiceRecords';
import ServiceRecordDetail from './pages/ServiceRecordDetail';
import Payments from './pages/Payments';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/components" element={<Components />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/service-records" element={<ServiceRecords />} />
            <Route path="/service-records/:id" element={<ServiceRecordDetail />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
