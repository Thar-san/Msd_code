import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { api } from './api';
import Navbar from './components/Navbar';
import UrlShortenerHero from './components/UrlShortenerHero';
import StatsCards from './components/StatsCards';
import UrlTable from './components/UrlTable';
import QrCodeModal from './components/QrCodeModal';
import AnalyticsModal from './components/AnalyticsModal';
import EditUrlModal from './components/EditUrlModal';
import BulkCreateModal from './components/BulkCreateModal';
import MultiplyModal from './components/MultiplyModal';
import AuthModal from './components/AuthModal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [urls, setUrls] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, archived: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalPages: 1, totalResults: 0 });
  const [filters, setFilters] = useState({ q: '', status: '', sort: 'createdAt', order: 'desc', page: 1 });
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  // Modals state
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null
  const [qrModal, setQrModal] = useState(null); // link object | null
  const [analyticsModal, setAnalyticsModal] = useState(null); // shortId | null
  const [editModal, setEditModal] = useState(null); // link object | null
  const [bulkModal, setBulkModal] = useState(false);
  const [multiplyModal, setMultiplyModal] = useState(null); // link object | null

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Check current auth status on initial load
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoadingUser(true);
        const data = await api.auth.me();
        if (data?.user) {
          setUser(data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch URLs whenever user or filters change
  const fetchUrls = useCallback(async () => {
    if (!user) {
      setUrls([]);
      setStats({ total: 0, active: 0, expired: 0, archived: 0 });
      return;
    }
    try {
      setLoadingUrls(true);
      const data = await api.urls.list(filters);
      if (data) {
        setUrls(data.urls || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
        if (data.admin !== undefined) setIsAdmin(data.admin);
        if (data.baseUrl) setBaseUrl(data.baseUrl);
      }
    } catch (err) {
      if (err.status !== 401) {
        showToast(err.message || 'Failed to fetch URLs', 'error');
      }
    } finally {
      setLoadingUrls(false);
    }
  }, [user, filters, showToast]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // Auth actions
  const handleLogin = async (credentials) => {
    const data = await api.auth.login(credentials);
    setUser(data.user);
    showToast(`Welcome back, ${data.user.name || 'User'}!`, 'success');
  };

  const handleSignup = async (details) => {
    const data = await api.auth.signup(details);
    setUser(data.user);
    showToast(`Account created! Welcome, ${data.user.name}!`, 'success');
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setUrls([]);
    setLastCreated(null);
    showToast('Signed out successfully', 'success');
  };

  // URL shortening action
  const handleShorten = async (payload) => {
    if (!user) {
      setAuthModal('login');
      showToast('Please sign in or create a demo account to shorten links', 'error');
      return;
    }
    const res = await api.urls.create(payload);
    if (res?.url) {
      setLastCreated(res.url);
      showToast('Short URL generated successfully!', 'success');
      fetchUrls();
    }
  };

  // Bulk URL creation
  const handleBulkCreate = async (rawText) => {
    if (!user) {
      setAuthModal('login');
      return;
    }
    await api.urls.bulkCreate(rawText);
    fetchUrls();
  };

  // Update URL
  const handleUpdate = async (id, data) => {
    await api.urls.update(id, data);
    fetchUrls();
  };

  // Delete URL
  const handleDelete = async (id) => {
    try {
      await api.urls.delete(id);
      showToast('Link deleted successfully', 'success');
      fetchUrls();
    } catch (err) {
      showToast(err.message || 'Failed to delete link', 'error');
    }
  };

  // Bulk status update
  const handleBulkStatus = async (ids, status) => {
    try {
      await api.urls.bulkStatus(ids, status);
      showToast(`Updated status to "${status}" for ${ids.length} link(s)`, 'success');
      fetchUrls();
    } catch (err) {
      showToast(err.message || 'Bulk status update failed', 'error');
    }
  };

  // Bulk delete
  const handleBulkDelete = async (ids) => {
    try {
      await api.urls.bulkDelete(ids);
      showToast(`Deleted ${ids.length} link(s) successfully`, 'success');
      fetchUrls();
    } catch (err) {
      showToast(err.message || 'Bulk delete failed', 'error');
    }
  };

  // Admin multiplier
  const handleMultiply = async (shortId, factor) => {
    await api.urls.multiplyAnalytics(shortId, factor);
    fetchUrls();
  };

  // Compute total clicks for stats
  const totalClicks = urls.reduce((acc, u) => acc + (u.clickCount || 0), 0);

  return (
    <div className="app-wrapper">
      {/* Navbar */}
      <Navbar
        user={user}
        onOpenAuth={(mode) => setAuthModal(mode)}
        onLogout={handleLogout}
        onOpenBulk={() => {
          if (!user) {
            setAuthModal('login');
            showToast('Sign in to use bulk shortener', 'error');
          } else {
            setBulkModal(true);
          }
        }}
      />

      <main className="main-container">
        {/* Hero Shortener */}
        <UrlShortenerHero
          onShorten={handleShorten}
          onOpenQr={(link) => setQrModal(link)}
          lastCreated={lastCreated}
          showToast={showToast}
          baseUrl={baseUrl}
        />

        {/* Dashboard Section */}
        {user ? (
          <>
            <StatsCards stats={stats} totalClicksCount={totalClicks} />

            <UrlTable
              urls={urls}
              pagination={pagination}
              filters={filters}
              onFilterChange={(newFilters) =>
                setFilters((prev) => ({ ...prev, ...newFilters }))
              }
              onCopyUrl={(url) => showToast('Copied to clipboard!', 'success')}
              onOpenQr={(link) => setQrModal(link)}
              onOpenAnalytics={(shortId) => setAnalyticsModal(shortId)}
              onOpenEdit={(link) => setEditModal(link)}
              onDeleteUrl={handleDelete}
              onBulkStatus={handleBulkStatus}
              onBulkDelete={handleBulkDelete}
              onOpenMultiply={(link) => setMultiplyModal(link)}
              isAdmin={isAdmin}
              baseUrl={baseUrl}
              loading={loadingUrls}
            />
          </>
        ) : (
          <div className="guest-welcome-card glass-panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '12px', color: '#fff' }}>
              Sign In to Access Your Analytics & Full Dashboard
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Track click analytics, inspect visit history logs, customize your aliases, download high-res QR codes, and manage bulk campaigns with our MongoDB database.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setAuthModal('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAuthModal('signup')}
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          onLogin={handleLogin}
          onSignup={handleSignup}
          onClose={() => setAuthModal(null)}
          showToast={showToast}
        />
      )}

      {qrModal && (
        <QrCodeModal
          link={qrModal}
          baseUrl={baseUrl}
          onClose={() => setQrModal(null)}
          showToast={showToast}
        />
      )}

      {analyticsModal && (
        <AnalyticsModal
          shortId={analyticsModal}
          baseUrl={baseUrl}
          onClose={() => setAnalyticsModal(null)}
          showToast={showToast}
        />
      )}

      {editModal && (
        <EditUrlModal
          link={editModal}
          onUpdate={handleUpdate}
          onClose={() => setEditModal(null)}
          showToast={showToast}
        />
      )}

      {bulkModal && (
        <BulkCreateModal
          onBulkCreate={handleBulkCreate}
          onClose={() => setBulkModal(false)}
          showToast={showToast}
        />
      )}

      {multiplyModal && (
        <MultiplyModal
          link={multiplyModal}
          onMultiply={handleMultiply}
          onClose={() => setMultiplyModal(null)}
          showToast={showToast}
        />
      )}

      {/* Floating Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? (
              <CheckCircle2 size={18} className="toast-icon" />
            ) : (
              <AlertCircle size={18} className="toast-icon" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
