// Code related to the main React component
import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CodesPage } from './codes-page.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import { NotFoundPage } from './not-found-page.tsx'
import { getLoginState, readTotpKeys } from './api-client.ts'
import { CssBaseline } from '@mui/material'
import { KeysPage } from './keys-page.tsx'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { LoadingPage } from './loading-page.tsx'
import { UnauthenticatedPage } from './unauthenticated-page.tsx'

const App = () => {
  const totpKeysQuery = useQuery({
    queryKey: ['totp-keys'],
    queryFn: () => readTotpKeys(),
    networkMode: 'always',
  })
  const [loginState, setLoginState] = useState<boolean | null>(null)
  useEffect(() => {
    getLoginState().then(x => setLoginState(x))
  }, [])
  return <StrictMode>
    <CssBaseline />
    <BrowserRouter>
      {loginState === null
        ? <LoadingPage />
        : loginState === true
        ? (totpKeysQuery.isSuccess ? <>
        <Routes>
          <Route path="/" element={<CodesPage totpKeys={totpKeysQuery.data} />} />
          <Route path="/keys" element={<KeysPage totpKeys={totpKeysQuery.data} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </> : <>
          <LoadingPage />
        </>) : <UnauthenticatedPage />
      }
  </BrowserRouter>
  </StrictMode>
}

const AppWrapper = () => {
  const queryClient = useMemo(() => new QueryClient(), [])
  return <QueryClientProvider client={queryClient}>
    <App/>
  </QueryClientProvider>
}

createRoot(document.getElementById('root')!).render(
  <AppWrapper />
)
