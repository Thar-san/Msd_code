import React, { useState } from 'react';
import {
  Link2,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Calendar,
  Tag,
  AtSign,
  Loader2,
  Clock
} from 'lucide-react';

export default function UrlShortenerHero({ onShorten, onOpenQr, lastCreated, showToast, baseUrl }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      showToast('Please enter a destination URL', 'error');
      return;
    }

    try {
      setLoading(true);
      await onShorten({
        url: url.trim(),
        title: title.trim(),
        customAlias: customAlias.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      setUrl('');
      setTitle('');
      setCustomAlias('');
      setExpiresAt('');
      setShowAdvanced(false);
    } catch (err) {
      showToast(err.message || 'Failed to shorten URL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // Clipboard permissions denied
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied short link to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const fullShortUrl = lastCreated
    ? `${baseUrl || window.location.origin}/url/${lastCreated.shortId}`
    : '';

  return (
    <section className="hero-section">
      <div className="hero-glow-sphere"></div>
      
      <div className="hero-header">
        <div className="hero-pill">
          <Sparkles size={14} className="hero-pill-icon" />
          <span>Next-Gen URL Management</span>
        </div>
        <h1 className="hero-title">
          Shorten, Share & Track with <span className="text-gradient">Linklet</span>
        </h1>
        <p className="hero-description">
          Create branded links, track real-time click analytics, generate instant QR codes, and manage campaigns with lightning-fast MERN stack performance.
        </p>
      </div>

      <div className="shortener-card glass-panel">
        <form onSubmit={handleSubmit} className="shortener-form">
          <div className="input-group-main">
            <div className="input-icon-wrapper">
              <Link2 size={20} className="input-icon" />
            </div>
            <input
              type="url"
              className="main-url-input"
              placeholder="Paste your long destination URL here (e.g. https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            {url ? (
              <button
                type="button"
                className="btn-ghost paste-btn"
                onClick={() => setUrl('')}
              >
                Clear
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost paste-btn"
                onClick={handlePaste}
              >
                Paste
              </button>
            )}
            <button
              type="submit"
              className="btn-primary shorten-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Shortening...</span>
                </>
              ) : (
                <>
                  <span>Shorten URL</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          <div className="advanced-toggle-bar">
            <button
              type="button"
              className={`advanced-toggle-btn ${showAdvanced ? 'active' : ''}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SlidersHorizontal size={15} />
              <span>Advanced Options (Custom Alias, Expiry, Title)</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-options-grid">
              <div className="advanced-field">
                <label className="field-label">
                  <AtSign size={14} /> Custom Alias (optional)
                </label>
                <div className="field-input-wrapper">
                  <span className="field-prefix">/url/</span>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="my-custom-name"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="advanced-field">
                <label className="field-label">
                  <Tag size={14} /> Title / Description (optional)
                </label>
                <input
                  type="text"
                  className="field-input simple-input"
                  placeholder="e.g. Portfolio Project Link"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
              </div>

              <div className="advanced-field">
                <label className="field-label">
                  <Calendar size={14} /> Expiration Date (optional)
                </label>
                <input
                  type="date"
                  className="field-input simple-input date-picker"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}
        </form>

        {/* Live Result Card */}
        {lastCreated && (
          <div className="created-result-banner">
            <div className="result-header">
              <div className="result-status-tag">
                <Check size={14} />
                <span>Link Created & Ready!</span>
              </div>
              <div className="result-destination-text" title={lastCreated.redirectURL}>
                Target: {lastCreated.redirectURL}
              </div>
            </div>

            <div className="result-action-row">
              <div className="result-link-box">
                <span className="result-link-text">{fullShortUrl}</span>
              </div>

              <div className="result-buttons">
                <button
                  type="button"
                  className="btn-primary copy-result-btn"
                  onClick={() => handleCopy(fullShortUrl)}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onOpenQr(lastCreated)}
                  title="View QR Code"
                >
                  <QrCode size={16} />
                  <span>QR Code</span>
                </button>

                <a
                  href={fullShortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn"
                  title="Test short URL redirect"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
