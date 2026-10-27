import React from 'react';
import { Link2, MousePointerClick, CheckCircle2, Archive, TrendingUp } from 'lucide-react';

export default function StatsCards({ stats, totalClicksCount = 0 }) {
  const cards = [
    {
      label: 'Total Links',
      value: stats?.total ?? 0,
      icon: Link2,
      accent: 'var(--accent-indigo)',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)',
      glow: 'rgba(99, 102, 241, 0.3)',
    },
    {
      label: 'Total Clicks',
      value: totalClicksCount,
      icon: MousePointerClick,
      accent: 'var(--accent-cyan)',
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 100%)',
      glow: 'rgba(6, 182, 212, 0.3)',
    },
    {
      label: 'Active Links',
      value: stats?.active ?? 0,
      icon: CheckCircle2,
      accent: 'var(--accent-emerald)',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    {
      label: 'Expired & Archived',
      value: (stats?.expired ?? 0) + (stats?.archived ?? 0),
      icon: Archive,
      accent: 'var(--accent-amber)',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)',
      glow: 'rgba(245, 158, 11, 0.3)',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="stat-card glass-panel"
            style={{
              background: card.gradient,
              borderColor: `rgba(255, 255, 255, 0.08)`,
            }}
          >
            <div className="stat-card-header">
              <span className="stat-label">{card.label}</span>
              <div
                className="stat-icon-wrapper"
                style={{
                  color: card.accent,
                  backgroundColor: `rgba(255, 255, 255, 0.05)`,
                  boxShadow: `0 0 15px ${card.glow}`,
                }}
              >
                <Icon size={18} />
              </div>
            </div>
            <div className="stat-value">{card.value.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}
