import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThunderIDProvider } from '@thunderid/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThunderIDProvider
      clientId="1FLcy_SAgu-HiU5G5BHlGw"
      baseUrl="http://localhost:5173"
      scopes={['openid', 'profile', 'email', 'system']}
    >
      <App />
    </ThunderIDProvider>
  </StrictMode>,
)
