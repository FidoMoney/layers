import './Settings.css';
import { useTheme } from '../../contexts/ThemeContext';

const Settings = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value as 'light' | 'dark' | 'system');
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <div className="settings-content">
        <section className="settings-section">
          <h2>General Settings</h2>
          <div className="settings-group">
            <label>
              <span>Theme</span>
              <select value={theme} onChange={handleThemeChange}>
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