import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  X,
  BarChart3,
  MousePointerClick,
  Calendar,
  Clock,
  Layers,
  Zap,
  ExternalLink,
  Loader2,
  TrendingUp
} from 'lucide-react';

export default function AnalyticsModal({ shortId, baseUrl, onClose, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.urls.getAnalytics(shortId);
        setData(res);
      } catch (err) {
        showToast(err.message || 'Failed to load analytics', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [shortId]);

  const fullUrl = `${baseUrl || window.location.origin}/url/${shortId}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content analytics-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <BarChart3 size={20} className="modal-title-icon text-cyan" />
            <h2 className="modal-title">Link Analytics</h2>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading-box">
            <Loader2 size={32} className="spinner text-cyan" />
            <p>Loading analytics from MongoDB...</p>
          </div>
        ) : data ? (
          <div className="analytics-content-body">
            {/* Header info */}
            <div className="analytics-header-card glass-panel">
              <div className="analytics-link-name">
                {data.url?.title || `/url/${shortId}`}
              </div>
              <div className="analytics-link-sub">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="analytics-short-url"
                >
                  <span>{fullUrl}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="analytics-target-url" title={data.url?.redirectURL}>
                Target: {data.url?.redirectURL}
              </div>
            </div>

            {/* Metrics row */}
            <div className="analytics-stats-row">
              <div className="analytics-stat-tile glass-panel">
                <div className="tile-label">
                  <MousePointerClick size={16} className="text-cyan" />
                  <span>Total Clicks</span>
                </div>
                <div className="tile-number">{data.totalClicks || 0}</div>
              </div>

              <div className="analytics-stat-tile glass-panel">
                <div className="tile-label">
                  <Zap size={16} className="text-amber" />
                  <span>Multiplier</span>
                </div>
                <div className="tile-number">{data.analyticsMultiplier || 1}x</div>
              </div>

              <div className="analytics-stat-tile glass-panel">
                <div className="tile-label">
                  <TrendingUp size={16} className="text-emerald" />
                  <span>Weighted</span>
                </div>
                <div className="tile-number">
                  {Math.round(data.weightedClicks || 0)}
                </div>
              </div>
            </div>

            {/* Visit Log */}
            <div className="visit-history-section">
              <h4 className="section-heading">
                <Clock size={16} /> Visit History Logs ({data.analytics?.length || 0})
              </h4>

              {data.analytics && data.analytics.length > 0 ? (
                <div className="history-list-box">
                  {data.analytics
                    .slice()
                    .reverse()
                    .map((item, index) => {
                      const dateObj = new Date(item.timestamp);
                      return (
                        <div key={index} className="history-row-item">
                          <div className="history-index">#{data.analytics.length - index}</div>
                          <div className="history-date">
                            <Calendar size={13} />
                            <span>{dateObj.toLocaleDateString()}</span>
                          </div>
                          <div className="history-time">
                            <Clock size={13} />
                            <span>{dateObj.toLocaleTimeString()}</span>
                          </div>
                          <div className="history-status-badge">
                            <span className="badge badge-active">Recorded</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="empty-history-notice">
                  No clicks recorded yet. Share your short link to start tracking!
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
