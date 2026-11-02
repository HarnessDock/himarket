/**
 * 作为 dsh 子应用运行（dsh-app/1，见 HarnessDock/dsh-plugins docs/sub-app.md）：嵌在 dsh 的 iframe 里时，
 * 向宿主报 ready，收到 init / token 里的开发者令牌就写进 access_token（门户原有的登录态），不用再登录；
 * 令牌过期时门户会跳到 /login 重新加载，宿主随之换一个新令牌，这里再回到原来的页面。
 * 只接受来自父窗口、带 dsh: 'app/1' 的消息；直接在浏览器打开时什么也不做。
 */
const SPEC = 'app/1';
const TOKEN_KEY = 'access_token';

export const embeddedInDsh = window.parent !== window;

type Message = { dsh?: string; type?: string; token?: string; id?: string; theme?: string };

const post = (msg: Record<string, unknown>) => window.parent.postMessage({ dsh: SPEC, ...msg }, '*');

/** 收到令牌：写进登录态；还停在登录页就回到 returnUrl */
function acceptToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  if (window.location.pathname === '/login') {
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    window.history.replaceState(null, '', returnUrl && returnUrl.startsWith('/') ? returnUrl : '/');
  }
}

/**
 * 嵌在 dsh 里时等宿主的 init（最多 timeoutMs），拿到令牌后再渲染门户，免得先跳登录页；不在 dsh 里立即返回。
 * @param timeoutMs 宿主没响应时的等待上限
 */
export function connectDsh(timeoutMs = 4000): Promise<void> {
  if (!embeddedInDsh) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    window.addEventListener('message', (e: MessageEvent<Message>) => {
      if (e.source !== window.parent || e.data?.dsh !== SPEC) return;
      const m = e.data;
      if ((m.type === 'init' || m.type === 'token') && typeof m.token === 'string' && m.token) acceptToken(m.token);
      if (m.type === 'init') done();
      // 门户没有开放页面工具
      if (m.type === 'call' && m.id) post({ type: 'result', id: m.id, ok: false, text: '能力市场没有开放页面操作' });
    });
    const timer = setTimeout(done, timeoutMs);
    post({ type: 'ready' });
  });
}
