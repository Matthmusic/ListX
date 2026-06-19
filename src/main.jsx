import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { TemplateProvider } from './context/TemplateContext.jsx'
import { NaturesProvider } from './context/NaturesContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <TemplateProvider>
          <NaturesProvider>
            <App />
          </NaturesProvider>
        </TemplateProvider>
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
