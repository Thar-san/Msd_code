import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Copy,
  Check,
  QrCode,
  BarChart3,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  AlertCircle,
  Archive,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function UrlTable({
  urls,
  pagination,
  filters,
  onFilterChange,
  onCopyUrl,
  onOpenQr,
  onOpenAnalytics,
  onOpenEdit,
  onDeleteUrl,
  onBulkStatus,
  onBulkDelete,
  onOpenMultiply,
  isAdmin,
  baseUrl,
  loading,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(urls.map((u) => u._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopy = (shortId, id) => {
    const full = `${baseUrl || window.location.origin}/url/${shortId}`;
    navigator.clipboard.writeText(full);
    setCopiedId(id);
    onCopyUrl(full);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isAllSelected = urls.length > 0 && selectedIds.length === urls.length;

  return (
    <div className="table-container-section glass-panel">
      {/* Search & Filter Bar */}
      <div className="table-controls-bar">
        <div className="search-box-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, short URL, or target..."
            value={filters.q || ''}
            onChange={(e) => onFilterChange({ q: e.target.value, page: 1 })}
          />
          {filters.q && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onFilterChange({ q: '', page: 1 })}
            >
              ×
            </button>
          )}
        </div>

        <div className="status-tabs-row">
          {[
            { id: '', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'archived', label: 'Archived' },
            { id: 'expired', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`status-tab-btn ${(filters.status || '') === tab.id ? 'active' : ''}`}
              onClick={() => onFilterChange({ status: tab.id, page: 1 })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="sort-controls-group">
          <div className="select-wrapper">
            <select
              className="styled-select"
              value={filters.sort || 'createdAt'}
              onChange={(e) => onFilterChange({ sort: e.target.value, page: 1 })}
            >
              <option value="createdAt">Date Created</option>
              <option value="clickCount">Click Count</option>
              <option value="title">Title</option>
              <option value="expiresAt">Expiration</option>
            </select>
          </div>

          <button
            type="button"
            className="icon-btn order-toggle-btn"
            title={filters.order === 'asc' ? 'Ascending' : 'Descending'}
            onClick={() =>
              onFilterChange({
                order: filters.order === 'asc' ? 'desc' : 'asc',
                page: 1,
              })
            }
          >
            <ArrowUpDown size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-banner">
          <span className="selected-counter">
            {selectedIds.length} link{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="bulk-btn-group">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onBulkStatus(selectedIds, 'active');
                setSelectedIds([]);
              }}
            >
              <RefreshCw size={14} />
              <span>Set Active</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onBulkStatus(selectedIds, 'archived');
                setSelectedIds([]);
              }}
            >
              <Archive size={14} />
              <span>Archive</span>
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (window.confirm(`Delete ${selectedIds.length} selected links permanently?`)) {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }
              }}
            >
              <Trash2 size={14} />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="table-responsive-wrapper">
        <table className="urls-data-table">
          <thead>
            <tr>
              <th className="th-checkbox">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all links"
                />
              </th>
              <th>Short Link & Title</th>
              <th>Destination URL</th>
              <th>Status</th>
              <th>Clicks</th>
              <th>Created / Expires</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {urls.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state-cell">
                  <div className="empty-state-box">
                    <AlertCircle size={36} className="empty-state-icon" />
                    <h3 className="empty-state-title">No Short Links Found</h3>
                    <p className="empty-state-subtitle">
                      {filters.q || filters.status
                        ? 'Try clearing your search query or changing status filters.'
                        : 'Create your first short URL using the input above!'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              urls.map((link) => {
                const fullShort = `${baseUrl || window.location.origin}/url/${link.shortId}`;
                const isSelected = selectedIds.includes(link._id);
                const isExpired = link.expiresAt && new Date(link.expiresAt) <= new Date();
                const multiplier = link.analyticsMultiplier || 1;

                return (
                  <tr key={link._id} className={isSelected ? 'selected-row' : ''}>
                    <td className="td-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(link._id)}
                        aria-label={`Select ${link.title || link.shortId}`}
                      />
                    </td>

                    <td className="td-link-title">
                      <div className="title-and-short">
                        {link.title && (
                          <div className="link-title-text" title={link.title}>
                            {link.title}
                          </div>
                        )}
                        <div className="short-url-row">
                          <a
                            href={fullShort}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="short-link-anchor"
                          >
                            <span>/url/{link.shortId}</span>
                            <ExternalLink size={12} />
                          </a>
                          <button
                            type="button"
                            className="inline-copy-btn"
                            onClick={() => handleCopy(link.shortId, link._id)}
                            title="Copy link"
                          >
                            {copiedId === link._id ? (
                              <Check size={13} className="text-emerald" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="td-destination">
                      <a
                        href={link.redirectURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="destination-anchor"
                        title={link.redirectURL}
                      >
                        {link.redirectURL}
                      </a>
                    </td>

                    <td className="td-status">
                      {link.status === 'archived' ? (
                        <span className="badge badge-archived">Archived</span>
                      ) : isExpired ? (
                        <span className="badge badge-expired">Expired</span>
                      ) : (
                        <span className="badge badge-active">Active</span>
                      )}
                    </td>

                    <td className="td-clicks">
                      <div
                        className="click-count-pill"
                        onClick={() => onOpenAnalytics(link.shortId)}
                        title="Click to view detailed analytics"
                      >
                        <span className="clicks-number">{link.clickCount || 0}</span>
                        {multiplier !== 1 && (
                          <span className="multiplier-badge" title={`Analytics Multiplier: ${multiplier}x`}>
                            {multiplier}x
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="td-dates">
                      <div className="dates-col">
                        <span className="date-created">
                          {link.createdAt
                            ? new Date(link.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                        {link.expiresAt && (
                          <span className={`date-expires ${isExpired ? 'expired-text' : ''}`}>
                            Exp: {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="td-actions">
                      <div className="action-buttons-cell">
                        <button
                          type="button"
                          className="icon-btn action-icon"
                          onClick={() => onOpenQr(link)}
                          title="Generate QR Code"
                        >
                          <QrCode size={15} />
                        </button>

                        <button
                          type="button"
                          className="icon-btn action-icon"
                          onClick={() => onOpenAnalytics(link.shortId)}
                          title="View Analytics"
                        >
                          <BarChart3 size={15} />
                        </button>

                        <button
                          type="button"
                          className="icon-btn action-icon"
                          onClick={() => onOpenEdit(link)}
                          title="Edit Details"
                        >
                          <Edit3 size={15} />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            className="icon-btn action-icon admin-icon"
                            onClick={() => onOpenMultiply(link)}
                            title="Admin Analytics Multiplier"
                          >
                            <Zap size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="icon-btn action-icon danger-icon"
                          onClick={() => {
                            if (window.confirm(`Delete short link "/url/${link.shortId}" permanently?`)) {
                              onDeleteUrl(link._id);
                            }
                          }}
                          title="Delete Link"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-footer">
          <div className="pagination-info">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalResults} links)
          </div>

          <div className="pagination-nav-group">
            <button
              type="button"
              className="btn-secondary pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => onFilterChange({ page: pagination.page - 1 })}
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - pagination.page) <= 1
              )
              .map((pageNum, idx, arr) => (
                <React.Fragment key={pageNum}>
                  {idx > 0 && pageNum - arr[idx - 1] > 1 && (
                    <span className="pagination-ellipsis">...</span>
                  )}
                  <button
                    type="button"
                    className={`pagination-num-btn ${pagination.page === pageNum ? 'active' : ''}`}
                    onClick={() => onFilterChange({ page: pageNum })}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              ))}

            <button
              type="button"
              className="btn-secondary pagination-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onFilterChange({ page: pagination.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
