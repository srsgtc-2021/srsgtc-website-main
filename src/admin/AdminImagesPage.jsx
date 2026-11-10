import React from 'react';
import AdminImageGrid from './AdminImageGrid';
import './admin.css';

export default function AdminImagesPage({
  title,
  description,
  table,
  prefix,
  addSlotKeyPrefix,
  addLabel,
}) {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div><h1>{title}</h1><p>{description}</p></div>
      </div>
      <AdminImageGrid
        table={table}
        prefix={prefix}
        addSlotKeyPrefix={addSlotKeyPrefix}
        addLabel={addLabel}
        title={`${title} images`}
      />
    </div>
  );
}
