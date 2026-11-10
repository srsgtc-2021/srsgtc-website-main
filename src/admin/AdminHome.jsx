import React from 'react';
import AdminImageGrid from './AdminImageGrid';
import './admin.css';

export default function AdminHome() {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Home</h1>
          <p>Manage the homepage marquee and the marine investigation image.</p>
        </div>
      </div>

      <AdminImageGrid
        table="marquee_images"
        prefix="home/marquee"
        addSlotKeyPrefix="home.marquee"
        addLabel="Add marquee item"
        title="Marquee"
      />

      <AdminImageGrid
        table="home_images"
        prefix="home/feature"
        title="Marine investigation"
        single
      />
    </div>
  );
}
