// Utilidades pequeñas: tokens, hashes, HTML seguro y cookies firmadas.

const enc = new TextEncoder();

export function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Cookie de sesión del administrador: "<expira>.<firma>"
export async function makeSession(secret, hours = 12) {
  const exp = String(Date.now() + hours * 3600 * 1000);
  return `${exp}.${await hmac(secret, 'admin:' + exp)}`;
}

export async function checkSession(secret, value) {
  if (!value || !secret) return false;
  const [exp, sig] = String(value).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return timingSafeEqual(sig, await hmac(secret, 'admin:' + exp));
}

export function getCookie(request, name) {
  const h = request.headers.get('cookie') || '';
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

export const isHex = (s, n) => typeof s === 'string' && new RegExp(`^[0-9a-f]{${n}}$`).test(s);

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

// Variables CSS de color para una galería personalizada ("#rrggbb"). Vacío si no hay color válido.
export function themeStyle(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return '';
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const ink = lum > 0.62 ? '#2a1d08' : '#ffffff';
  const d = (v) => Math.round(v * 0.9);
  return `--accent:${hex};--accent-strong:rgb(${d(r)},${d(g)},${d(b)});--accent-ink:${ink};--accent-rgb:${r},${g},${b};`;
}

// Enlace público de una galería: el nombre elegido si lo tiene, si no el de letras y números.
export const glink = (e) => (e && e.slug ? `/g/${e.slug}` : `/e/${e.guest_token}`);
