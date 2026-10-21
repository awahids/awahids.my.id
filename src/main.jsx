import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initClarity } from './lib/clarity'

// Loads only after the visitor accepts analytics cookies; off without a project id.
initClarity(import.meta.env.VITE_CLARITY_PROJECT_ID)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
