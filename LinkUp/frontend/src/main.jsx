import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TestApp from './TestApp.jsx'

const root = createRoot(document.getElementById('root'))
const useTest = typeof window !== 'undefined' && window.location.search.includes('test=1')

root.render(
  <StrictMode>
    {useTest ? <TestApp /> : <App />}
  </StrictMode>,
)

// Global error logging to assist debugging in dev
window.addEventListener('error', (event) => {
  console.error('Global error captured:', event.error || event.message, event);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
