import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onLogin, onSignup, onClose, showToast }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        if (!name.trim()) {
          showToast('Please enter your full name', 'error');
          return;
        }
        await onSignup({ name: name.trim(), email: email.trim(), password });
        showToast('Account created and signed in!', 'success');
      } else {
        await onLogin({ email: email.trim(), password });
        showToast('Signed in successfully!', 'success');
      }
      onClose();
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      // Attempt login with demo account, or sign up if it doesn't exist
      try {
        await onLogin({ email: 'demo@linklet.io', password: 'demoPassword123!' });
        showToast('Signed in as Demo User!', 'success');
        onClose();
      } catch {
        await onSignup({
          name: 'Demo Explorer',
          email: 'demo@linklet.io',
          password: 'demoPassword123!',
        });
        showToast('Created & signed in as Demo User!', 'success');
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="auth-brand-badge">
            <ShieldCheck size={16} />
            <span>MERN Authentication</span>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-body">
          {mode === 'signup' && (
            <div className="modal-field">
              <label className="field-label">
                <User size={14} /> Full Name
              </label>
              <input
                type="text"
                className="styled-modal-input"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="modal-field">
            <label className="field-label">
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              className="styled-modal-input"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="modal-field">
            <label className="field-label">
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="styled-modal-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Please wait...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create My Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or test instantly</span>
        </div>

        <button
          type="button"
          className="btn-secondary demo-login-btn"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          <Sparkles size={16} className="text-cyan" />
          <span>One-Click Demo Login</span>
        </button>
      </div>
    </div>
  );
}
