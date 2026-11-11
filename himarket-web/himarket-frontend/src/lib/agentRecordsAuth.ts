/**
 * 「调用记录」页的登录（HarnessDock）：这页读的是 ai-runtime 的调用记录，不是 HiMarket 的数据，
 * 所以单独用 Casdoor 登录（应用 ai-runtime-console，PKCE 公开客户端；用户已在 Casdoor 登录过时无感跳回）。
 * 配置不写在页面里：部署时生成 /agent-records.json（LPM-NEXT infra/k8s/himarket/deploy-portal.sh）。
 * 令牌只放在 sessionStorage，过期就重新跳一次登录。
 */
export interface RecordsConfig {
  /** ai-runtime 的接口地址，到 /v1 为止 */
  aiRuntimeUrl: string
  /** Casdoor 地址 */
  casdoorUrl: string
  /** Casdoor 应用 ai-runtime-console 的 client id */
  clientId: string
}

const TOKEN = 'harnessdock.agentRecords.token'
const VERIFIER = 'harnessdock.agentRecords.verifier'
const STATE = 'harnessdock.agentRecords.state'

export async function loadConfig(): Promise<RecordsConfig | undefined> {
  const r = await fetch('/agent-records.json', { cache: 'no-store' }).catch(() => undefined)
  if (!r?.ok) return undefined
  const c = (await r.json().catch(() => undefined)) as Partial<RecordsConfig> | undefined
  return c?.aiRuntimeUrl && c.casdoorUrl && c.clientId ? (c as RecordsConfig) : undefined
}

const b64url = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)))
const redirectUri = () => `${window.location.origin}/agent-records`

/** 令牌的过期时间（JWT exp），读不出来当作已过期 */
function expiresAt(token: string) {
  try { return (JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }).exp! * 1000 } catch { return 0 }
}

export function currentToken() {
  const t = sessionStorage.getItem(TOKEN)
  return t && expiresAt(t) > Date.now() + 30_000 ? t : undefined
}

export async function login(c: RecordsConfig) {
  const verifier = random(48)
  const state = random(16)
  sessionStorage.setItem(VERIFIER, verifier)
  sessionStorage.setItem(STATE, state)
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  const q = new URLSearchParams({ client_id: c.clientId, response_type: 'code', redirect_uri: redirectUri(), scope: 'openid profile', state, code_challenge: challenge, code_challenge_method: 'S256' })
  window.location.assign(`${c.casdoorUrl.replace(/\/+$/, '')}/login/oauth/authorize?${q}`)
}

/** 登录回来（地址上带 code）时换令牌；返回令牌，或 undefined（不是回调） */
export async function handleCallback(c: RecordsConfig): Promise<string | undefined> {
  const p = new URLSearchParams(window.location.search)
  const code = p.get('code')
  if (!code) return undefined
  if (p.get('state') !== sessionStorage.getItem(STATE)) throw new Error('登录状态不匹配，请重试')
  const r = await fetch(`${c.casdoorUrl.replace(/\/+$/, '')}/api/login/oauth/access_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: c.clientId, code_verifier: sessionStorage.getItem(VERIFIER) ?? '', redirect_uri: redirectUri() }),
  })
  const d = (await r.json().catch(() => ({}))) as { access_token?: string; error_description?: string; error?: string }
  if (!d.access_token) throw new Error(`登录失败：${d.error_description ?? d.error ?? r.status}`)
  sessionStorage.setItem(TOKEN, d.access_token)
  sessionStorage.removeItem(VERIFIER)
  sessionStorage.removeItem(STATE)
  window.history.replaceState(null, '', '/agent-records')
  return d.access_token
}

export function logout() { sessionStorage.removeItem(TOKEN) }
