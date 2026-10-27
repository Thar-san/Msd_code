import React, { useState } from 'react';
import { X, Edit3, Link2, Tag, Calendar, Check, Loader2 } from 'lucide-react';

export default function EditUrlModal({ link, onUpdate, onClose, showToast }) {
  const [title, setTitle] = useState(link.title || '');
  const [url, setUrl] = useState(link.redirectURL || '');
  const [status, setStatus] = useState(link.status || 'active');
  const [expiresAt, setExpiresAt] = useState(
    link.expiresAt ? new Date(link.expiresAt).toISOString().split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      showToast('Destination URL is required', 'error');
      return;
    }

    try {
      setLoading(true);
      await onUpdate(link._id, {
        title: title.trim(),
        url: url.trim(),
        status,
        expiresAt: expiresAt || null,
      });
      showToast('Link updated successfully', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Edit3 size={20} className="modal-title-icon text-indigo" />
            <h2 className="modal-title">Edit Short Link</h2>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          <div className="modal-field">
            <label className="field-label">
              <Link2 size={14} /> Destination Target URL
            </label>
            <input
              type="url"
              className="styled-modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="modal-field">
            <label className="field-label">
              <Tag size={14} /> Title / Description
            </label>
            <input
              type="text"
              className="styled-modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Company Launch Page"
            />
          </div>

          <div className="modal-row-2col">
            <div className="modal-field">
              <label className="field-label">Status</label>
              <select
                className="styled-modal-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="modal-field">
              <label className="field-label">
                <Calendar size={14} /> Expiration Date
              </label>
              <input
                type="date"
                className="styled-modal-input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
