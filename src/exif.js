// Lee del principio de un JPEG la fecha de captura (EXIF) y las dimensiones.
function madridOffsetMin(utcMs) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs) / 60000;
}

export function parseJpeg(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out = { taken: null, w: null, h: null };
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return out;
  let o = 2;
  while (o + 4 < v.byteLength) {
    if (v.getUint8(o) !== 0xff) break;
    const m = v.getUint8(o + 1);
    if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) { o += 2; continue; }
    const len = v.getUint16(o + 2);
    if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      out.h = v.getUint16(o + 5); out.w = v.getUint16(o + 7);
      break;
    }
    if (m === 0xe1 && !out.taken && v.getUint32(o + 4) === 0x45786966) {
      try { out.taken = exifDate(v, o + 10, o + 2 + len); } catch { /* sin fecha */ }
    }
    o += 2 + len;
  }
  return out;
}

function exifDate(v, t, end) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = (p) => v.getUint16(p, le), u32 = (p) => v.getUint32(p, le);
  const str = (p, n) => { let s = ''; for (let i = 0; i < n && p + i < end; i++) { const c = v.getUint8(p + i); if (!c) break; s += String.fromCharCode(c); } return s; };
  const find = (ifd, tag) => {
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12;
      if (u16(e) === tag) return { type: u16(e + 2), count: u32(e + 4), at: e + 8 };
    }
    return null;
  };
  const text = (e) => (e.count > 4 ? str(t + u32(e.at), e.count) : str(e.at, e.count));
  const ifd0 = t + u32(t + 4);
  const ptr = find(ifd0, 0x8769);
  const exif = ptr ? t + u32(ptr.at) : null;
  let d = exif && find(exif, 0x9003);
  let s = d && text(d);
  if (!s) { d = find(ifd0, 0x0132); s = d && text(d); }
  const m = s && /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(s);
  if (!m) return null;
  const local = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const offTag = exif && find(exif, 0x9011);
  const off = offTag && /^([+-])(\d{2}):(\d{2})/.exec(text(offTag));
  if (off) return local - (off[1] === '-' ? -1 : 1) * (+off[2] * 60 + +off[3]) * 60000;
  const guess = local - madridOffsetMin(local) * 60000;
  return local - madridOffsetMin(guess) * 60000;
}

export async function readMeta(bucket, key) {
  const o = await bucket.get(key, { range: { offset: 0, length: 262144 } });
  if (!o) return { taken: null, w: null, h: null };
  return parseJpeg(new Uint8Array(await o.arrayBuffer()));
}
