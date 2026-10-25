// Entrar con Google (OpenID Connect, flujo de código con PKCE). Solo se activa si están puestas
// GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET; mientras no, el botón no aparece.
import { randomHex, sha256Hex, getCookie } from './util.js';
import { startSession, validEmail } from './auth.js';
import { createUser, signupOpen } from './accounts.js';

const COOKIE = 'picfy_g';
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
const cookie = (v, age) => `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;

export const googleOn = (env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

// Solo en local se pueden cambiar las direcciones de Google (para las pruebas con un Google de mentira).
function endpoints(c) {
  const u = new URL(c.req.url);
  const local = u.hostname === '127.0.0.1' || u.hostname === 'localhost';
  return {
    auth: (local && c.env.GOOGLE_AUTH_URL) || 'https://accounts.google.com/o/oauth2/v2/auth',
    token: (local && c.env.GOOGLE_TOKEN_URL) || 'https://oauth2.googleapis.com/token',
    redirect: u.origin + '/auth/google/callback',
  };
}

export function googleRoutes(app) {
  const back = (e, headers = {}) => new Response(null, { status: 303, headers: { location: '/entrar?e=' + e, 'set-cookie': cookie('', 0), ...headers } });

  app.get('/auth/google', async (c) => {
    if (!googleOn(c.env)) return back('google');
    const ep = endpoints(c);
    const state = randomHex(16), verifier = randomHex(32);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const q = new URLSearchParams({ client_id: c.env.GOOGLE_CLIENT_ID, redirect_uri: ep.redirect, response_type: 'code', scope: 'openid email profile', state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account' });
    return new Response(null, { status: 302, headers: { location: ep.auth + '?' + q, 'set-cookie': cookie(state + '.' + verifier, 600) } });
  });

  app.get('/auth/google/callback', async (c) => {
    if (!googleOn(c.env)) return back('google');
    const [state, verifier] = (getCookie(c.req.raw, COOKIE) || '').split('.');
    const q = new URL(c.req.url).searchParams;
    if (q.get('error') || !state || !verifier || q.get('state') !== state || !q.get('code')) return back('google');
    const ep = endpoints(c);
    let payload;
    try {
      const r = await fetch(ep.token, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: q.get('code'), client_id: c.env.GOOGLE_CLIENT_ID, client_secret: c.env.GOOGLE_CLIENT_SECRET, redirect_uri: ep.redirect, grant_type: 'authorization_code', code_verifier: verifier }) });
      if (!r.ok) return back('google');
      const tok = await r.json();
      // El token llega directo de Google por una conexión segura; aun así se comprueba a quién va dirigido y que no haya caducado.
      payload = JSON.parse(fromB64url(String(tok.id_token || '').split('.')[1] || ''));
    } catch { return back('google'); }
    const okIss = payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com';
    const email = String(payload.email || '').trim().toLowerCase();
    if (!okIss || payload.aud !== c.env.GOOGLE_CLIENT_ID || !(payload.exp * 1000 > Date.now()) || payload.email_verified !== true || !validEmail(email)) return back('google');

    let user = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      if (!(await signupOpen(c.env))) return back('cerrado');
      const name = String(payload.name || payload.given_name || email.split('@')[0]).trim().slice(0, 80);
      user = { id: await createUser(c.env.DB, { name, email }) };
    }
    const wp = /(?:^|; )picfy_plan=(fotografo|organizador|pase)/.exec(c.req.header('cookie') || '');
    return new Response(null, { status: 303, headers: [['location', wp ? '/comprar/' + wp[1] : '/inicio'], ['set-cookie', await startSession(c.env.DB, user.id)], ['set-cookie', cookie('', 0)]] });
  });
}
