type SidebarSection =
  | 'dashboard'
  | 'compliance'
  | 'scheduler'
  | 'analytics'
  | 'integrations'
  | 'repository'
  | 'workflows'
  | 'settings'
  | 'support';

type AppSidebarProps = {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
};

const AppSidebar = ({ activeSection, onSectionChange }: AppSidebarProps) => {
  return (
    <aside className="panel app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-dot" />
        <div>
          <strong>CodeAuto</strong>
          <span>HR Automation Studio</span>
        </div>
      </div>

      <div className="sidebar-group">
        <p className="group-title">General</p>
        <button
          type="button"
          className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSectionChange('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'compliance' ? 'active' : ''}`}
          onClick={() => onSectionChange('compliance')}
        >
          Compliance
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'scheduler' ? 'active' : ''}`}
          onClick={() => onSectionChange('scheduler')}
        >
          Scheduler
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => onSectionChange('analytics')}
        >
          Analytics
        </button>
      </div>

      <div className="sidebar-group">
        <p className="group-title">Automation</p>
        <button
          type="button"
          className={`nav-item ${activeSection === 'integrations' ? 'active' : ''}`}
          onClick={() => onSectionChange('integrations')}
        >
          Integrations
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'repository' ? 'active' : ''}`}
          onClick={() => onSectionChange('repository')}
        >
          Repository
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'workflows' ? 'active' : ''}`}
          onClick={() => onSectionChange('workflows')}
        >
          Workflows
        </button>
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => onSectionChange('settings')}
        >
          Settings
        </button>
        <button
          type="button"
          className={`nav-item ${activeSection === 'support' ? 'active' : ''}`}
          onClick={() => onSectionChange('support')}
        >
          Help and Support
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
