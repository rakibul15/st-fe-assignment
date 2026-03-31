import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ErrorProvider } from './providers/ErrorProvider.tsx'
import './index.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LazyMotion features={domAnimation} strict>
        <ErrorProvider>
          <App />
        </ErrorProvider>
      </LazyMotion>
    </BrowserRouter>
  </StrictMode>,
)
