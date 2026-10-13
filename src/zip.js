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

// entries: [{ key, name, size, crc|null, ms }]. Devuelve { stream, length }.
export function buildZip(bucket, entries) {
  const list = entries.map((e) => {
    const { time, date } = dosTime(e.ms || Date.now());
    return { ...e, time, date, descriptor: e.crc == null };
  });
  // Longitud total conocida de antemano.
  let length = 0;
  for (const e of list) length += 30 + enc.encode(e.name).length + e.size + (e.descriptor ? 16 : 0);
  for (const e of list) length += 46 + enc.encode(e.name).length;
  length += 22;

  let i = 0, offset = 0, reader = null, cur = null, crc = 0, sent = 0;
  const central = [];
  let finished = false;

  const stream = new ReadableStream({
    async pull(ctrl) {
      if (finished) return;
      try {
        if (!reader) {
          if (i >= list.length) {
            let cdSize = 0;
            for (const c of central) { ctrl.enqueue(c); cdSize += c.length; }
            ctrl.enqueue(endRecord(list.length, cdSize, offset));
            finished = true; ctrl.close(); return;
          }
          cur = list[i];
          const obj = await bucket.get(cur.key);
          const head = localHeader(cur, cur.descriptor);
          cur.offset = offset;
          ctrl.enqueue(head); offset += head.length;
          crc = 0; sent = 0;
          if (!obj) { reader = { missing: true, left: cur.size }; return; }
          reader = obj.body.getReader();
          return;
        }
        if (reader.missing) { // objeto que falta: se rellena con ceros para no romper la estructura
          const n = Math.min(65536, reader.left);
          if (n > 0) { ctrl.enqueue(new Uint8Array(n)); offset += n; sent += n; reader.left -= n; if (cur.descriptor) crc = crcUpdate(crc, new Uint8Array(n)); }
          if (reader.left <= 0) finishEntry(ctrl);
          return;
        }
        const { done, value } = await reader.read();
        if (done) { finishEntry(ctrl); return; }
        ctrl.enqueue(value); offset += value.length; sent += value.length;
        if (cur.descriptor) crc = crcUpdate(crc, value);
      } catch (err) {
        ctrl.error(err);
      }
    },
    cancel() { try { reader && reader.cancel && reader.cancel(); } catch { /* nada */ } },
  });

  function finishEntry(ctrl) {
    const crcFinal = cur.descriptor ? crc : cur.crc;
    if (cur.descriptor) {
      const d = new Uint8Array(16); const v = new DataView(d.buffer);
      v.setUint32(0, SIG_DESC, true); v.setUint32(4, crcFinal, true); v.setUint32(8, sent, true); v.setUint32(12, sent, true);
      ctrl.enqueue(d); offset += 16;
      cur.size = sent;
    }
    central.push(centralEntry(cur, crcFinal, cur.offset));
    reader = null; i++;
  }

  return { stream, length };
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
