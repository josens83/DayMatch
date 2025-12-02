#!/usr/bin/env node
/**
 * Icon Generator Script for DayMatch App
 *
 * This script generates placeholder icons for development.
 * For production, replace with professionally designed icons.
 *
 * Requirements:
 * - icon.png: 1024x1024 (iOS App Store)
 * - adaptive-icon.png: 1024x1024 (Android foreground)
 * - splash.png: 1284x2778 (iPhone 13 Pro Max size)
 * - notification-icon.png: 96x96 (Android notification)
 * - favicon.png: 48x48 (Web)
 */

const fs = require('fs');
const path = require('path');

// Simple PNG creator (creates minimal valid PNG with solid color)
function createSimplePNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Create raw image data (uncompressed for simplicity)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Create a simple gradient/logo effect
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (dist < radius) {
        // Inside circle - white "D" hint
        rawData.push(255, 255, 255);
      } else {
        // Outside - brand color
        rawData.push(r, g, b);
      }
    }
  }

  // Use zlib to compress (deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation for PNG
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];

  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Brand color: #4F46E5 (Indigo-600)
const brandR = 79;
const brandG = 70;
const brandB = 229;

const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('Generating placeholder icons for DayMatch...\n');

// Generate icons
const icons = [
  { name: 'icon.png', width: 1024, height: 1024, desc: 'App Icon (iOS)' },
  { name: 'adaptive-icon.png', width: 1024, height: 1024, desc: 'Adaptive Icon (Android)' },
  { name: 'splash.png', width: 1284, height: 2778, desc: 'Splash Screen' },
  { name: 'notification-icon.png', width: 96, height: 96, desc: 'Notification Icon (Android)' },
  { name: 'favicon.png', width: 48, height: 48, desc: 'Web Favicon' },
];

icons.forEach(({ name, width, height, desc }) => {
  try {
    const png = createSimplePNG(width, height, brandR, brandG, brandB);
    const filePath = path.join(assetsDir, name);
    fs.writeFileSync(filePath, png);
    console.log(`✓ Created ${name} (${width}x${height}) - ${desc}`);
  } catch (error) {
    console.error(`✗ Failed to create ${name}: ${error.message}`);
  }
});

console.log('\n✅ Icon generation complete!');
console.log('\n⚠️  Note: These are placeholder icons for development.');
console.log('   For production, replace with professionally designed assets:');
console.log('   - icon.png: 1024x1024 main app icon');
console.log('   - adaptive-icon.png: 1024x1024 Android adaptive icon foreground');
console.log('   - splash.png: 1284x2778 splash screen with logo');
console.log('   - notification-icon.png: 96x96 white silhouette on transparent');
