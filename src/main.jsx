import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { TemplateProvider } from './context/TemplateContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <TemplateProvider>
        <App />
      </TemplateProvider>
    </AppProvider>
  </StrictMode>,
)
