import React from 'react'
import ReactDOM from 'react-dom/client'
import AXReviewSystem from './ax-review-system.jsx'

// Storage API 폴리필 (로컬 스토리지 사용)
if (!window.storage) {
  window.storage = {
    async get(key, isLocal) {
      const value = isLocal ? localStorage.getItem(key) : sessionStorage.getItem(key);
      return value ? { value } : null;
    },
    async set(key, value, isLocal) {
      if (isLocal) {
        localStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
      }
    },
    async delete(key, isLocal) {
      if (isLocal) {
        localStorage.removeItem(key);
      } else {
        sessionStorage.removeItem(key);
      }
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AXReviewSystem />
  </React.StrictMode>
)
