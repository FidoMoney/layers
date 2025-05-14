import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideNav from './components/layout/SideNav';
import Home from './pages/Home';
import Settings from './pages/Settings';
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
