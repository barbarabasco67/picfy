// Cuentas: contraseñas con PBKDF2 y sesiones con cookie (solo se guarda el hash del token).

import { randomHex, sha256Hex, timingSafeEqual, getCookie } from './util.js';

const enc = new TextEncoder();
const ITER = 100000; // máximo que admite Workers
const COOKIE = 'picfy_s';
const DAYS = 30;

const fromHex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

export async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: ITER }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const validEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e) && e.length <= 254;

export function sessionCookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function startSession(db, userId) {
  const token = randomHex(32);
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256Hex(token), userId, Date.now() + DAYS * 86400000).run();
  return sessionCookie(token, DAYS * 86400);
}

export async function endSession(db, request) {
  const t = getCookie(request, COOKIE);
  if (/^[0-9a-f]{64}$/.test(t)) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(t)).run();
  return sessionCookie('', 0);
}

// Usuario de la sesión actual, o null.
export async function currentUser(c) {
  const t = getCookie(c.req.raw, COOKIE);
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  ).bind(await sha256Hex(t), Date.now()).first();
  return row || null;
}

export async function checkPassword(user, password) {
  const hash = await hashPassword(password, user.pass_salt);
  return timingSafeEqual(hash, user.pass_hash);
}
