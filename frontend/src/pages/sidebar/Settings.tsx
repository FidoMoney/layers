import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <div className="settings-content">
        <section className="settings-section">
          <h2>General Settings</h2>
          <div className="settings-group">
            <label>
              <span>Theme</span>
              <select>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings; 