import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('error', (event) => {
  console.error("Captured error:", event.error);
  let errDiv = document.getElementById('vvc-error-display');
  if (!errDiv) {
    errDiv = document.createElement('div');
    errDiv.id = 'vvc-error-display';
    errDiv.style.cssText = "position: fixed; bottom: 20px; left: 20px; right: 20px; padding: 20px; color: red; font-family: monospace; background: #fee2e2; border: 2px solid #ef4444; z-index: 99999; border-radius: 8px; max-height: 50vh; overflow-y: auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);";
    document.body.appendChild(errDiv);
  }
  errDiv.innerHTML = `<h3>Runtime Error Captured:</h3><pre>${event.error?.stack || event.message}</pre>`;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("Captured promise rejection:", event.reason);
  let errDiv = document.getElementById('vvc-error-display');
  if (!errDiv) {
    errDiv = document.createElement('div');
    errDiv.id = 'vvc-error-display';
    errDiv.style.cssText = "position: fixed; bottom: 20px; left: 20px; right: 20px; padding: 20px; color: red; font-family: monospace; background: #fee2e2; border: 2px solid #ef4444; z-index: 99999; border-radius: 8px; max-height: 50vh; overflow-y: auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);";
    document.body.appendChild(errDiv);
  }
  errDiv.innerHTML = `<h3>Unhandled Promise Rejection:</h3><pre>${event.reason?.stack || event.reason}</pre>`;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
