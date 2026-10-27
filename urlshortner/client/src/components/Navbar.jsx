import React from 'react';
import { Link2, Sparkles, LogOut, User, Layers, Plus } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout, onOpenBulk }) {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand">
          <div className="brand-logo">
            <Link2 className="logo-icon" size={24} />
          </div>
          <div className="brand-titles">
            <div className="brand-name">
              Linklet <span className="brand-badge">MERN</span>
            </div>
            <div className="brand-subtitle">Smart URL Shortener & Analytics</div>
          </div>
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={onOpenBulk}
                title="Create multiple short URLs at once"
              >
                <Layers size={16} />
                <span>Bulk Create</span>
              </button>

              <div className="user-profile-badge">
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name || 'User'}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div className="navbar-auth-buttons">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onOpenAuth('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onOpenAuth('signup')}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
