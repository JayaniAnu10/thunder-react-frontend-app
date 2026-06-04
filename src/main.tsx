import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThunderIDProvider } from '@thunderid/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThunderIDProvider
      clientId="aq3LXdAz4AnAUxmYISTp7w"
      baseUrl="http://endpoint-1-frontend-development-default-ec673672.openchoreoapis.localhost:19080"
      scopes={['openid', 'profile', 'email', 'system']}
    >
      <App />
    </ThunderIDProvider>
  </StrictMode>,
)
