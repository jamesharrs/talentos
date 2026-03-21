import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'
import ErrorBoundary, { setupGlobalErrorHandlers } from './ErrorBoundary.jsx'

setupGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
