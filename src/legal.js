// Política de privacidad y condiciones de uso (páginas públicas).
import { html } from './util.js';

const CONTACTO = 'barbarabasco7@gmail.com';
const ACTUALIZADO = '25 de octubre de 2026';

const CSS = `:root{--bg:#f6f4f0;--ink:#14213d;--acc:#edb265;--mut:#5b6478}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{padding:22px 20px}header a{display:inline-flex;align-items:center;gap:9px;font-weight:800;font-size:20px;color:var(--ink);text-decoration:none}header i{width:14px;height:14px;border-radius:50%;background:var(--acc)}
main{max-width:760px;margin:0 auto;padding:10px 20px 70px}h1{font-size:clamp(30px,5vw,42px);line-height:1.15;margin:.3em 0 .2em}h2{font-size:21px;margin:1.8em 0 .4em}p,li{color:#2a3550}ul{padding-left:22px}li{margin:.3em 0}.up{color:var(--mut);font-size:15px}a{color:var(--ink);text-decoration-color:var(--acc);text-underline-offset:3px}
footer{max-width:760px;margin:0 auto;padding:0 20px 50px;display:flex;gap:22px;flex-wrap:wrap;font-weight:600;font-size:15px}`;

const page = (title, body) => html(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Picfy</title><meta name="theme-color" content="#f6f4f0"><link rel="icon" href="/pwa/favicon.png"><style>${CSS}</style></head><body><header><a href="/"><i></i>Picfy</a></header><main>${body}</main><footer><a href="/privacidad">Política de privacidad</a><a href="/condiciones">Condiciones de uso</a><a href="/">Inicio</a></footer></body></html>`);

const PRIVACIDAD = `<h1>Política de privacidad</h1><p class="up">Última actualización: ${ACTUALIZADO}</p>
<p>Picfy (picfy.es) es una aplicación para crear álbumes de fotos compartidos, entregar galerías a clientes y organizar torneos. Aquí explicamos qué datos tratamos, para qué y qué derechos tienes.</p>
<h2>Quién es el responsable</h2>
<p>Pablo García Álvarez, Madrid (España). Contacto: <a href="mailto:${CONTACTO}">${CONTACTO}</a>.</p>
<h2>Qué datos tratamos</h2>
<ul>
<li><b>Cuenta:</b> nombre, correo electrónico y contraseña (guardada cifrada, nunca en claro). Si entras con Google, recibimos tu nombre y tu correo verificado.</li>
<li><b>Contenido:</b> las fotos, vídeos, galerías, torneos, tareas y textos que subes tú o las personas que invitas a un álbum, junto con los nombres que escriban al participar.</li>
<li><b>Pagos:</b> los cobros los gestiona Stripe. Picfy no ve ni guarda tu tarjeta; solo conserva el identificador de cliente y de suscripción, el plan contratado y las fechas.</li>
<li><b>Técnicos:</b> cookies necesarias para mantener tu sesión y el acceso a los álbumes, y registros básicos de seguridad del servidor.</li>
</ul>
<h2>Para qué los usamos</h2>
<ul>
<li>Prestar el servicio: crear tu cuenta, alojar y mostrar tus álbumes, gestionar tu plan y sus límites.</li>
<li>Cobrar y facturar los planes de pago.</li>
<li>Enviarte avisos del servicio (por ejemplo, de tu cuenta o de tus álbumes).</li>
<li>Mantener la seguridad y evitar abusos.</li>
</ul>
<p>La base legal es la ejecución del servicio que solicitas, el cumplimiento de obligaciones legales (fiscales) y nuestro interés legítimo en mantener la seguridad. No usamos tus datos para publicidad ni los vendemos.</p>
<h2>Datos de Google</h2>
<p>Si eliges «Continuar con Google», solo usamos tu nombre y tu correo para crear tu cuenta y reconocerte al volver. No accedemos a tus contactos, tu Drive ni a ningún otro dato de Google, y no los compartimos con nadie. El uso de la información recibida de las API de Google se ajusta a la Política de datos de usuario de los servicios API de Google, incluidos los requisitos de uso limitado.</p>
<h2>Con quién los compartimos</h2>
<p>Solo con los proveedores necesarios para prestar el servicio, que actúan por nuestra cuenta:</p>
<ul>
<li>Cloudflare: alojamiento, base de datos y almacenamiento de archivos.</li>
<li>Stripe: pagos y suscripciones.</li>
<li>Google: inicio de sesión, si lo eliges.</li>
<li>Resend: envío de correos del servicio.</li>
</ul>
<p>Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo con las garantías previstas por la normativa (cláusulas contractuales tipo o equivalentes).</p>
<h2>Fotos de otras personas y menores</h2>
<p>Si subes o compartes fotos en las que aparecen otras personas, eres responsable de contar con su permiso o el de sus tutores cuando haga falta, especialmente con menores. Picfy permite activar un aviso de consentimiento en los álbumes y proteger el acceso con contraseña o fecha de caducidad.</p>
<h2>Cuánto tiempo los conservamos</h2>
<p>Mientras mantengas la cuenta. Si eliminas un álbum o una foto, pasa a la papelera y se borra definitivamente pasado un tiempo. Si pides cerrar tu cuenta, borramos tus datos y tu contenido, salvo lo que la ley obligue a conservar (por ejemplo, datos de facturación).</p>
<h2>Tus derechos</h2>
<p>Puedes acceder a tus datos, rectificarlos, suprimirlos, oponerte a su tratamiento, limitarlo y pedir su portabilidad escribiendo a <a href="mailto:${CONTACTO}">${CONTACTO}</a>. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>
<h2>Cookies</h2>
<p>Usamos solo cookies técnicas, imprescindibles para iniciar sesión, acceder a álbumes protegidos y completar compras. No usamos cookies de publicidad ni de seguimiento.</p>
<h2>Cambios</h2>
<p>Si cambiamos esta política, actualizaremos la fecha de arriba y, si el cambio es importante, te lo avisaremos.</p>`;

const CONDICIONES = `<h1>Condiciones de uso</h1><p class="up">Última actualización: ${ACTUALIZADO}</p>
<p>Al crear una cuenta o usar Picfy (picfy.es) aceptas estas condiciones. Si no estás de acuerdo, no uses el servicio.</p>
<h2>El servicio</h2>
<p>Picfy permite crear álbumes de fotos compartidos, entregar galerías a clientes y organizar torneos. Algunas funciones dependen del plan contratado.</p>
<h2>Tu cuenta</h2>
<p>Debes dar datos verdaderos y mantener tu contraseña en secreto. Eres responsable de lo que ocurra desde tu cuenta.</p>
<h2>Tu contenido</h2>
<ul>
<li>Las fotos y demás contenido siguen siendo tuyos. Nos das permiso solo para alojarlos, mostrarlos y entregarlos como tú indiques.</li>
<li>Declaras que tienes derecho a subir ese contenido y, si aparecen otras personas, que cuentas con los permisos necesarios, en especial en el caso de menores.</li>
<li>No puedes subir contenido ilegal, que vulnere derechos de terceros, que sea violento, sexual con menores, ofensivo o engañoso, ni usar Picfy para spam o para atacar el servicio. Podemos retirar contenido o suspender cuentas que incumplan esto.</li>
</ul>
<h2>Planes y pagos</h2>
<ul>
<li>Los planes mensuales se renuevan cada mes hasta que los canceles. Puedes cancelar cuando quieras desde tu cuenta; el plan sigue activo hasta el final del periodo ya pagado.</li>
<li>El pase por evento es un pago único y dura el tiempo indicado en su descripción.</li>
<li>Los precios incluyen los impuestos aplicables salvo que se indique otra cosa. Los pagos los procesa Stripe.</li>
<li>Al tratarse de un servicio digital que empieza a prestarse al contratarlo, y salvo que la ley disponga lo contrario, los importes ya cobrados no se reembolsan. Si algo no funciona, escríbenos y lo resolvemos.</li>
<li>Si superas los límites de tu plan (galerías, espacio o torneos) no podrás crear más hasta que cambies de plan o liberes espacio.</li>
</ul>
<h2>Disponibilidad</h2>
<p>Hacemos lo posible por que el servicio funcione siempre, pero no garantizamos que esté libre de interrupciones o errores. Te recomendamos conservar copia de tus originales.</p>
<h2>Responsabilidad</h2>
<p>Picfy se ofrece «tal cual». En la medida que permita la ley, no respondemos de pérdidas indirectas ni de contenido subido por los usuarios.</p>
<h2>Cierre de cuenta</h2>
<p>Puedes dejar de usar Picfy y pedir el cierre de tu cuenta cuando quieras. Podemos suspender o cerrar cuentas que incumplan estas condiciones.</p>
<h2>Cambios y ley aplicable</h2>
<p>Podemos actualizar estas condiciones; los cambios importantes se avisarán. Se rigen por la ley española y, para cualquier disputa, serán competentes los juzgados de Madrid, sin perjuicio de los derechos que la ley reconozca a los consumidores.</p>
<h2>Contacto</h2>
<p><a href="mailto:${CONTACTO}">${CONTACTO}</a></p>`;

export function legalRoutes(app) {
  app.get('/privacidad', () => page('Política de privacidad', PRIVACIDAD));
  app.get('/condiciones', () => page('Condiciones de uso', CONDICIONES));
}
