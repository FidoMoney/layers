import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideNav from './components/layout/SideNav';
import Home from './pages/sidebar/Home';
import Settings from './pages/settings/Settings';
import Events from './pages/sidebar/Events';
import CreateFunnel from './pages/modals/CreateFunnel';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <SideNav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/events" element={<Events />} />
            <Route path="/create/funnel" element={<CreateFunnel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
