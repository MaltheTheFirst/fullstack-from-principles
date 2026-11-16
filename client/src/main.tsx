import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './context/AuthProvider.tsx'
import { CatchProvider } from './context/CatchProvider.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CatchProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </CatchProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
