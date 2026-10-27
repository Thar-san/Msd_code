import React, { useState } from 'react';
import { X, Zap, Check, Loader2, AlertTriangle } from 'lucide-react';

export default function MultiplyModal({ link, onMultiply, onClose, showToast }) {
  const [factor, setFactor] = useState(link.analyticsMultiplier || 1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(factor);
    if (!Number.isFinite(num) || num < 0.1 || num > 10) {
      showToast('Factor must be between 0.1 and 10', 'error');
      return;
    }

    try {
      setLoading(true);
      await onMultiply(link.shortId, num);
      showToast('Analytics multiplier updated!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update multiplier', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Zap size={20} className="modal-title-icon text-amber" />
            <h2 className="modal-title">Admin Analytics Multiplier</h2>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          <div className="admin-notice-card">
            <AlertTriangle size={16} className="text-amber" />
            <span>
              Adjust the weight multiplier for short link <code>/url/{link.shortId}</code>. Raw clicks in MongoDB remain unaltered; this controls derived reporting analytics.
            </span>
          </div>

          <div className="modal-field">
            <label className="field-label">Multiplier Factor (0.1 - 10)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              className="styled-modal-input"
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Apply Multiplier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
