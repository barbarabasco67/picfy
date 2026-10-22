// Alta de cuentas: la comparten el registro con correo y el acceso con Google.
import { randomHex } from './util.js';
import { hashPassword } from './auth.js';

// El registro está abierto salvo que se ponga SIGNUP_CLOSED=1 en las variables de Cloudflare.
export async function signupOpen(env) {
  return env.SIGNUP_CLOSED !== '1' && env.SIGNUP_CLOSED !== 1;
}

// Crea la cuenta. Sin contraseña (acceso con Google) se guarda una al azar que nadie conoce.
export async function createUser(db, { name, email, password }) {
  const id = randomHex(8), salt = randomHex(16);
  const hash = await hashPassword(password || randomHex(32), salt);
  await db.prepare('INSERT INTO users (id, email, name, pass_salt, pass_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, email, name, salt, hash, Date.now()).run();
  return id;
}
