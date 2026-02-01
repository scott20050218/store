/**
 * Generate TabBar icons for WeChat Mini Program
 * Creates 81x81 PNG icons with transparent background and dark icon shapes
 */
const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xffffffff;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const chunk = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(chunk), 0);
  return Buffer.concat([len, chunk, crcBuf]);
}

function createPNG(size, pixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8);   // bit depth
  ihdrData.writeUInt8(6, 9);   // color type: RGBA
  ihdrData.writeUInt8(0, 10);  // compression
  ihdrData.writeUInt8(0, 11);  // filter
  ihdrData.writeUInt8(0, 12);  // interlace
  const IHDR = makeChunk('IHDR', ihdrData);
  
  // Raw pixel data: filter byte + RGBA per pixel
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      const i = y * (1 + size * 4) + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const IDAT = makeChunk('IDAT', compressed);
  
  const IEND = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, IHDR, IDAT, IEND]);
}

// Home icon: simple house (roof triangle + body rect)
function homePixel(x, y, size) {
  const cx = size / 2, pad = size * 0.18;
  const w = size - pad * 2, h = w * 0.9;
  const l = pad, r = size - pad, t = pad, b = t + h;
  const roofTop = t + h * 0.25;
  const bodyTop = t + h * 0.4;

  const inRoof = y >= t && y <= roofTop &&
    y >= t + (roofTop - t) * (1 - 2 * Math.abs(x - cx) / w);
  const inBody = x >= l + w * 0.2 && x <= r - w * 0.2 && y >= bodyTop && y <= b;
  const inDoor = x >= cx - w * 0.08 && x <= cx + w * 0.08 && y >= bodyTop + h * 0.25;

  return (inRoof || (inBody && !inDoor)) ? [0, 0, 0, 255] : [0, 0, 0, 0];
}

// Stats icon: 3 bar chart columns
function statsPixel(x, y, size) {
  const pad = size * 0.22;
  const chartW = size - pad * 2, chartH = chartW;
  const barGap = chartW / 12;
  const barW = (chartW - barGap * 4) / 3;
  const baseY = pad + chartH;

  const bars = [
    { left: pad + barGap, height: chartH * 0.45 },
    { left: pad + barGap * 2 + barW, height: chartH * 0.75 },
    { left: pad + barGap * 3 + barW * 2, height: chartH * 0.55 }
  ];

  for (const b of bars) {
    if (x >= b.left && x <= b.left + barW && y >= baseY - b.height && y <= baseY) {
      return [0, 0, 0, 255];
    }
  }
  return [0, 0, 0, 0];
}

// Profile icon: circle head + body
function profilePixel(x, y, size) {
  const cx = size / 2, pad = size * 0.18;
  const headR = (size - pad * 2) * 0.22;
  const headY = pad + headR + 4;
  const bodyTop = headY + headR;
  const bodyH = size - pad - bodyTop;
  const bodyWTop = (size - pad * 2) * 0.35;
  const bodyWBottom = bodyWTop * 0.6;

  const inHead = (x - cx) ** 2 + (y - headY) ** 2 <= headR ** 2;
  const bodyT = (y - bodyTop) / bodyH;
  const bodyW = bodyWTop * (1 - bodyT) + bodyWBottom * bodyT;
  const inBody = y >= bodyTop && y <= size - pad && Math.abs(x - cx) <= bodyW;

  return (inHead || inBody) ? [0, 0, 0, 255] : [0, 0, 0, 0];
}

const outDir = __dirname + '/../images';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outDir + '/home.png', createPNG(81, homePixel));
fs.writeFileSync(outDir + '/home-active.png', createPNG(81, homePixel));
fs.writeFileSync(outDir + '/stats.png', createPNG(81, statsPixel));
fs.writeFileSync(outDir + '/stats-active.png', createPNG(81, statsPixel));
fs.writeFileSync(outDir + '/profile.png', createPNG(81, profilePixel));
fs.writeFileSync(outDir + '/profile-active.png', createPNG(81, profilePixel));

console.log('TabBar icons generated successfully at ' + outDir);
