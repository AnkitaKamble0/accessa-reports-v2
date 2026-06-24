import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Reports from './pages/Reports/Reports.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/reports" replace />} />
        <Route path="/reports/*" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
