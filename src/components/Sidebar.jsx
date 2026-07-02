const NAV = [
  { id: 'landing',    icon: '+',  label: 'Home'       },
  { id: 'setup',      icon: '⚡',  label: 'Setup'      },
  { id: 'candidates', icon: '●', label: 'Candidates'  },
  { id: 'analytics',  icon: '▪', label: 'Analytics'   },
  { id: 'copilot',    icon: '◆', label: 'Copilot'     },
  { id: 'compare',    icon: '≈', label: 'Compare'     },
];

export default function Sidebar({ activePage, setActivePage, candidateCount, analyzed, mobileOpen, setMobileOpen }) {
  return (
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">RecruitIQ</div>
        <div className="sidebar-tagline">AI Recruitment Intelligence</div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const locked = !analyzed && !['landing','setup'].includes(item.id);
          return (
            <button
              key={item.id}
              className={`nav-item${activePage === item.id ? ' active' : ''}`}
              onClick={() => {
                if (!locked) {
                  setActivePage(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }
              }}
              title={locked ? 'Run an analysis first' : item.label}
              style={{ opacity: locked ? 0.35 : 1, cursor: locked ? 'default' : 'pointer' }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'candidates' && candidateCount > 0 && (
                <span className="nav-badge">{candidateCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        Powered by{' '}
        <span style={{ color: 'var(--indigo)', fontWeight: 700 }}>AI</span>
        {' '}+{' '}
        <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>Groq</span>
      </div>
    </aside>
  );
}
