import { useState, useEffect } from 'react'
import { checkServerStatus } from './services/api'
import type { ServerStatus } from './services/api'
import './App.css'

function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await checkServerStatus()
        setServerStatus(status)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    // Set up polling every 5 seconds
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app-container">
      <h1>Welcome to Layers</h1>
      <div className="status-container">
        <h2>Server Status</h2>
        {loading ? (
          <p>Checking server status...</p>
        ) : error ? (
          <p className="error">Error: {error}</p>
        ) : (
          <div className="status-success">
            <p>✅ Server is running</p>
            <p className="message">{serverStatus?.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
