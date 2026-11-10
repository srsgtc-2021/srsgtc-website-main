import React from 'react';
import './admin.css';

export default function AdminPlaceholder({ title, description }) {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div><h1>{title}</h1><p>{description}</p></div>
      </div>
      <div className="admin-card admin-placeholder">This section is coming next.</div>
    </div>
  );
}
