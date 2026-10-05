import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './dashboard.css'
import ErrorBoundary from './components/ErrorBoundary'
import { installErrorLogging } from './logging'
import App from './App.jsx'

installErrorLogging()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
