// ZIP en streaming, sin compresión (las fotos ya están comprimidas).
// El CRC de cada foto se calcula en el navegador al subirla y se guarda, así el servidor
// solo "pasa" los bytes de R2 al navegador y casi no gasta CPU.

const enc = new TextEncoder();
const SIG_LOCAL = 0x04034b50, SIG_CENTRAL = 0x02014b50, SIG_END = 0x06054b50, SIG_DESC = 0x08074b50;

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crcUpdate(crc, buf) {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(ms) {
  const d = new Date(ms);
  const time = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
  const date = ((Math.max(1980, d.getUTCFullYear()) - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  return { time, date };
}

function localHeader(e, descriptor) {
  const name = enc.encode(e.name);
  const b = new Uint8Array(30 + name.length); const v = new DataView(b.buffer);
  v.setUint32(0, SIG_LOCAL, true); v.setUint16(4, 20, true);
  v.setUint16(6, 0x0800 | (descriptor ? 0x0008 : 0), true); // UTF-8 (+ descriptor si no hay CRC)
  v.setUint16(8, 0, true); v.setUint16(10, e.time, true); v.setUint16(12, e.date, true);
  v.setUint32(14, descriptor ? 0 : e.crc, true);
  v.setUint32(18, descriptor ? 0 : e.size, true); v.setUint32(22, descriptor ? 0 : e.size, true);
  v.setUint16(26, name.length, true); v.setUint16(28, 0, true);
  b.set(name, 30);
  return b;
}

function centralEntry(e, crc, offset) {
  const name = enc.encode(e.name);
  const b = new Uint8Array(46 + name.length); const v = new DataView(b.buffer);
  v.setUint32(0, SIG_CENTRAL, true); v.setUint16(4, 20, true); v.setUint16(6, 20, true);
  v.setUint16(8, 0x0800 | (e.descriptor ? 0x0008 : 0), true); v.setUint16(10, 0, true);
  v.setUint16(12, e.time, true); v.setUint16(14, e.date, true);
  v.setUint32(16, crc, true); v.setUint32(20, e.size, true); v.setUint32(24, e.size, true);
  v.setUint16(28, name.length, true); v.setUint32(42, offset, true);
  b.set(name, 46);
  return b;
}

function endRecord(count, cdSize, cdOffset) {
  const b = new Uint8Array(22); const v = new DataView(b.buffer);
  v.setUint32(0, SIG_END, true); v.setUint16(8, count, true); v.setUint16(10, count, true);
  v.setUint32(12, cdSize, true); v.setUint32(16, cdOffset, true);
  return b;
}

// Calcula el CRC de los archivos que no lo tienen guardado (el Mac no abre ZIPs sin CRC en la cabecera).
// Lo guarda con save(entry, crc) cuando se puede, para que solo se haga una vez.
export async function fillCrc(bucket, entries, save, budget = 16 * 1024 * 1024) {
  // Tope de bytes por petición: calcular el CRC gasta CPU y Cloudflare corta el Worker (error 1102).
  for (const e of entries) {
    if (e.crc != null) continue;
    if (e.size > budget) continue;
    budget -= e.size;
    const obj = await bucket.get(e.key);
    if (!obj) continue;
    const r = obj.body.getReader(); let c = 0xffffffff;
    for (;;) {
      const { done, value } = await r.read(); if (done) break;
      for (let i = 0; i < value.length; i++) c = crcTable[(c ^ value[i]) & 0xff] ^ (c >>> 8);
    }
    e.crc = (c ^ 0xffffffff) >>> 0;
    if (save) { try { await save(e, e.crc); } catch { /* sin guardar */ } }
  }
}

// entries: [{ key, name, size, crc|null, ms }]. Devuelve { stream, length }.
// Los bytes de R2 pasan por pipeTo (sin JavaScript por trozo) hacia un FixedLengthStream: así el
// navegador conoce la longitud exacta y detecta cortes, y el Worker casi no gasta CPU.
export function buildZip(bucket, entries, ctx) {
  const list = entries.map((e) => {
    const { time, date } = dosTime(e.ms || Date.now());
    return { ...e, time, date, descriptor: e.crc == null };
  });
  let length = 0;
  for (const e of list) length += 30 + enc.encode(e.name).length + e.size + (e.descriptor ? 16 : 0);
  for (const e of list) length += 46 + enc.encode(e.name).length;
  length += 22;

  const { readable, writable } = new FixedLengthStream(length);
  const put = async (bytes) => { const w = writable.getWriter(); try { await w.write(bytes); } finally { w.releaseLock(); } };
  const run = (async () => {
    try {
      let offset = 0; const central = [];
      for (const cur of list) {
        const head = localHeader(cur, cur.descriptor);
        cur.offset = offset;
        await put(head); offset += head.length;
        const obj = cur.size > 0 ? await bucket.get(cur.key, { range: { offset: 0, length: cur.size } }) : null;
        let got = 0;
        if (obj) { got = Math.min(cur.size, obj.size); await obj.body.pipeTo(writable, { preventClose: true, preventAbort: true }); }
        if (got < cur.size) await put(new Uint8Array(cur.size - got)); // falta el objeto: se rellena con ceros
        offset += cur.size;
        if (cur.descriptor) {
          const d = new Uint8Array(16); const v = new DataView(d.buffer);
          v.setUint32(0, SIG_DESC, true); v.setUint32(4, 0, true); v.setUint32(8, cur.size, true); v.setUint32(12, cur.size, true);
          await put(d); offset += 16;
        }
        central.push(centralEntry(cur, cur.descriptor ? 0 : cur.crc, cur.offset));
      }
      let cdSize = 0;
      for (const c of central) { await put(c); cdSize += c.length; }
      await put(endRecord(list.length, cdSize, offset));
      await writable.close();
    } catch (err) {
      try { await writable.abort(err); } catch { /* ya cerrado */ }
    }
  })();
  if (ctx && ctx.waitUntil) ctx.waitUntil(run);
  return { stream: readable, length };
}

// Reparte las fotos en partes (por número y por tamaño) para respetar los límites de Cloudflare.
export function splitParts(rows, maxCount, maxBytes = 3.2 * 1024 ** 3) {
  const parts = []; let cur = [], bytes = 0;
  for (const r of rows) {
    if (cur.length && (cur.length >= maxCount || bytes + r.size > maxBytes)) { parts.push(cur); cur = []; bytes = 0; }
    cur.push(r); bytes += r.size;
  }
  if (cur.length) parts.push(cur);
  return parts;
}

// Fotos y vídeos por separado
const isVidMime = (m) => /^video\//.test(m || '');
export const kindSql = (tipo, a = 'p') => tipo === 'videos' ? ` AND ${a}.mime LIKE 'video/%'` : tipo === 'fotos' ? ` AND (${a}.mime IS NULL OR ${a}.mime NOT LIKE 'video/%')` : '';
export const zipTipo = (v) => (v === 'fotos' || v === 'videos' ? v : '');
// Partes de ZIP por tipo (todo / fotos / vídeos) a partir de {size, mime}
export function zipPlan(rows, partSize) {
  const mk = (f) => splitParts(rows.filter(f), partSize).map((p) => ({ count: p.length }));
  return { all: mk(() => true), fotos: mk((r) => !isVidMime(r.mime)), videos: mk((r) => isVidMime(r.mime)) };
}
// Bloque HTML con los botones de descarga (la parte de «todo de una vez» la hace el navegador)
export function zipGroups(plan, href, esc = (x) => x) {
  const group = (key, title, parts) => {
    if (!parts.length) return '';
    const n = parts.reduce((s, p) => s + p.count, 0);
    const q = key === 'all' ? '' : `tipo=${key}&`;
    const links = parts.map((p, i) => `<a class="btn" href="${esc(href)}?${q}part=${i + 1}" data-zipa>${parts.length > 1 ? `Parte ${i + 1} de ${parts.length} · ${p.count} archivos` : `Descargar · ${p.count} ${p.count === 1 ? 'archivo' : 'archivos'}`}</a>`).join('');
    return `<section class="zipgrp"><h3>${title} <span class="muted">${n}</span></h3>${parts.length > 1 ? `<button class="btn primary" type="button" data-zipall>Descargar todo de una vez</button>` : ''}<div class="zips">${links}</div></section>`;
  };
  const both = plan.fotos.length && plan.videos.length;
  return group('all', both ? 'Todo' : plan.videos.length ? 'Vídeos' : 'Fotos', plan.all) + (both ? group('fotos', 'Solo fotos', plan.fotos) + group('videos', 'Solo vídeos', plan.videos) : '');
}
