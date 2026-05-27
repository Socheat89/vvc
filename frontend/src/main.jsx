import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace; background: #fee2e2; border: 1px solid #fca5a5; margin: 20px; border-radius: 8px;">
      <h3>Runtime Error Captured:</h3>
      <pre>${event.error?.stack || event.message}</pre>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace; background: #fee2e2; border: 1px solid #fca5a5; margin: 20px; border-radius: 8px;">
      <h3>Unhandled Promise Rejection:</h3>
      <pre>${event.reason?.stack || event.reason}</pre>
    </div>`;
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
