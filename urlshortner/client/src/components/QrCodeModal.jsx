import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, ExternalLink, QrCode as QrIcon } from 'lucide-react';

export default function QrCodeModal({ link, baseUrl, onClose, showToast }) {
  const canvasRef = useRef(null);
  const fullUrl = `${baseUrl || window.location.origin}/url/${link.shortId}`;

  useEffect(() => {
    if (canvasRef.current && fullUrl) {
      QRCode.toCanvas(canvasRef.current, fullUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0a0d17',
          light: '#ffffff',
        },
      });
    }
  }, [fullUrl]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const pngUrl = canvasRef.current.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode-${link.shortId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast('QR Code downloaded as PNG!', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    showToast('Copied short link to clipboard!', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content qr-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <QrIcon size={20} className="modal-title-icon" />
            <h2 className="modal-title">QR Code</h2>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="qr-preview-area">
          <div className="qr-canvas-card">
            <canvas ref={canvasRef} className="qr-canvas-element" />
          </div>

          <div className="qr-link-details">
            {link.title && <div className="qr-link-title">{link.title}</div>}
            <div className="qr-short-url-box">{fullUrl}</div>
          </div>
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            <Copy size={16} />
            <span>Copy Link</span>
          </button>
          <button type="button" className="btn-primary" onClick={handleDownload}>
            <Download size={16} />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
