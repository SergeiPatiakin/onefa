// Code related to the Onefa API client
import Keycloak from 'keycloak-js'

type ReadyKeycloak = { keycloak: Keycloak, authenticated: boolean }
let readyKeycloak: ReadyKeycloak | null = null
const initApiCallbacks: Array<() => void> = []

const markApiComplete = (keycloak: ReadyKeycloak) => {
  readyKeycloak = keycloak
  initApiCallbacks.forEach(resolve => resolve())
}

export const awaitApiReady = () => new Promise<void>((resolve, _reject) => {
  if (readyKeycloak) {
    resolve()
  }
  initApiCallbacks.push(resolve as (() => void))
})

export const initApiClient = async () => {
  const keycloak = new Keycloak({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    url: (window as any).FE_ENV.AUTH_SERVER_URL,
    realm: "mimram",
    clientId: "1fa"
  })

  try {
    const authenticated = await keycloak.init({ onLoad: 'check-sso' })
    if (authenticated) {
      console.log('User is authenticated')
      markApiComplete({ keycloak , authenticated: true })
    } else {
      console.log('User is not authenticated')
      markApiComplete({ keycloak , authenticated: false })
    }
  } catch (error) {
    console.error('Failed to initialize Keycloak adapter:', error)
  }
}

const MIN_VALIDITY = 30

export const login = async () => {
  await awaitApiReady()
  readyKeycloak!.keycloak.login()
}

export const logout = async () => {
  await awaitApiReady()
  readyKeycloak!.keycloak.logout({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirectUri: (window as any).FE_ENV.APP_URL,
  })
}

export type TotpKey = {
  id: string,
  name: string,
  key: string,
}

export const getLoginState = async (): Promise<boolean> => {
  await awaitApiReady()
  return readyKeycloak!.authenticated
}

export const readTotpKeys = async (): Promise<TotpKey[]> => {
  await awaitApiReady()
  await readyKeycloak!.keycloak.updateToken(MIN_VALIDITY)
  const response = await fetch("/api/read-totp-keys", {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${readyKeycloak!.keycloak.token}`
    },
  })
  const j = await response.json() as {
    totp_keys: TotpKey[]
  }
  return j.totp_keys
}

export const updateTotpKey = async (totpKey: TotpKey): Promise<void> => {
  await awaitApiReady()
  await readyKeycloak!.keycloak.updateToken(MIN_VALIDITY)
  const response = await fetch("/api/update-totp-key", {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${readyKeycloak!.keycloak.token}`
    },
    body: JSON.stringify(totpKey)
  })
  await response.json()
}

export const createTotpKey = async (totpKey: TotpKey): Promise<void> => {
  await awaitApiReady()
  await readyKeycloak!.keycloak.updateToken(MIN_VALIDITY)
  const response = await fetch("/api/create-totp-key", {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${readyKeycloak!.keycloak.token}`
    },
    body: JSON.stringify(totpKey)
  })
  await response.json()
}

export const deleteTotpKey = async (totpKeyId: string): Promise<void> => {
  await awaitApiReady()
  await readyKeycloak!.keycloak.updateToken(MIN_VALIDITY)
  const response = await fetch("/api/delete-totp-key", {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${readyKeycloak!.keycloak.token}`
    },
    body: JSON.stringify({ id: totpKeyId })
  })
  await response.json()
}

initApiClient()
