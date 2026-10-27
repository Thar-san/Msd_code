import React, { useState } from 'react';
import { X, Layers, AlertCircle, Check, Loader2 } from 'lucide-react';

export default function BulkCreateModal({ onBulkCreate, onClose, showToast }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      showToast('Please enter at least one URL', 'error');
      return;
    }

    if (lines.length > 50) {
      showToast('Maximum 50 URLs allowed at once', 'error');
      return;
    }

    try {
      setLoading(true);
      await onBulkCreate(text);
      showToast(`Created ${lines.length} short links successfully!`, 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to bulk create URLs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Layers size={20} className="modal-title-icon text-indigo" />
            <h2 className="modal-title">Bulk Shorten URLs</h2>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          <div className="bulk-instruction-card">
            <AlertCircle size={16} className="text-cyan" />
            <span>
              Enter one URL per line (up to 50). To add an optional title, use the format:{' '}
              <code>Title | https://example.com</code>
            </span>
          </div>

          <div className="modal-field">
            <textarea
              className="styled-modal-textarea"
              rows={8}
              placeholder={`Example:\nGoogle | https://google.com\nGitHub | https://github.com\nhttps://openai.com`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Create All Links</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
