/**
 * QR code encoder (ISO/IEC 18004), byte mode, versions 1–40, written for this
 * library: no dependencies, no network. The structure follows the classic
 * reference algorithm (function patterns, Reed–Solomon over GF(256), zigzag
 * placement, eight masks); every code it makes is decoded back in the tests.
 */

export type Ecc = "L" | "M" | "Q" | "H";

const FORMAT_BITS: Record<Ecc, number> = { L: 1, M: 0, Q: 3, H: 2 };

// Index 0 unused. Rows: L, M, Q, H.
const ECC_PER_BLOCK: Record<Ecc, number[]> = {
  L: [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  M: [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  Q: [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  H: [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
};
const BLOCKS: Record<Ecc, number[]> = {
  L: [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19,
    19, 20, 21, 22, 24, 25,
  ],
  M: [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31,
    33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  Q: [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43,
    45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  H: [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48,
    51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
};

function rawModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

function dataCodewords(ver: number, ecc: Ecc): number {
  return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ecc][ver] * BLOCKS[ecc][ver];
}

// —— Reed–Solomon over GF(2^8), polynomial 0x11D ——
function mul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = mul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = mul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] ^= mul(coef, factor)));
  }
  return result;
}

function bit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

function utf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/**
 * Encodes `text` and returns the modules (`true` = dark), without the quiet zone.
 * Picks the smallest version that fits. Throws if the text does not fit in version 40.
 */
export function encodeQr(text: string, ecc: Ecc = "M"): boolean[][] {
  const bytes = utf8(text);
  let ver = 1;
  for (; ver <= 40; ver++) {
    const countBits = ver <= 9 ? 8 : 16;
    if (bytes.length < 1 << countBits && 4 + countBits + bytes.length * 8 <= dataCodewords(ver, ecc) * 8) break;
  }
  if (ver > 40) throw new RangeError("QR: text too long");

  // —— Data bits ——
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, ver <= 9 ? 8 : 16);
  bytes.forEach((b) => put(b, 8));
  const capacity = dataCodewords(ver, ecc) * 8;
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));

  // —— Error correction and interleaving ——
  const numBlocks = BLOCKS[ecc][ver];
  const eccLen = ECC_PER_BLOCK[ecc][ver];
  const raw = Math.floor(rawModules(ver) / 8);
  const numShort = numBlocks - (raw % numBlocks);
  const shortLen = Math.floor(raw / numBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecw = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0);
    blocks.push(dat.concat(ecw));
  }
  const codewords: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) codewords.push(block[i]);
    });
  }

  // —— Matrix ——
  const size = ver * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const setFixed = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    fixed[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    setFixed(6, i, i % 2 === 0);
    setFixed(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFixed(x, y, dist !== 2 && dist !== 4);
      }
  }
  if (ver > 1) {
    const num = Math.floor(ver / 7) + 2;
    const step = Math.floor((ver * 8 + num * 3 + 5) / (num * 4 - 4)) * 2;
    const pos = [6];
    for (let p = size - 7; pos.length < num; p -= step) pos.splice(1, 0, p);
    for (let i = 0; i < num; i++)
      for (let j = 0; j < num; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === num - 1) || (i === num - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            setFixed(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
  }
  const drawFormat = (mask: number) => {
    const value = (FORMAT_BITS[ecc] << 3) | mask;
    let rem = value;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((value << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setFixed(8, i, bit(f, i));
    setFixed(8, 7, bit(f, 6));
    setFixed(8, 8, bit(f, 7));
    setFixed(7, 8, bit(f, 8));
    for (let i = 9; i < 15; i++) setFixed(14 - i, 8, bit(f, i));
    for (let i = 0; i < 8; i++) setFixed(size - 1 - i, 8, bit(f, i));
    for (let i = 8; i < 15; i++) setFixed(8, size - 15 + i, bit(f, i));
    setFixed(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const v = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFixed(a, b, bit(v, i));
      setFixed(b, a, bit(v, i));
    }
  }

  // Zigzag placement of the codewords.
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fixed[y][x] && i < codewords.length * 8) {
          modules[y][x] = bit(codewords[i >>> 3], 7 - (i & 7));
          i++;
        }
      }
  }

  const masked = (mask: number, x: number, y: number) => {
    switch (mask) {
      case 0:
        return (x + y) % 2 === 0;
      case 1:
        return y % 2 === 0;
      case 2:
        return x % 3 === 0;
      case 3:
        return (x + y) % 3 === 0;
      case 4:
        return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5:
        return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6:
        return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      default:
        return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    }
  };
  const applyMask = (mask: number) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) if (!fixed[y][x] && masked(mask, x, y)) modules[y][x] = !modules[y][x];
  };
  // Simplified penalty (runs, 2×2 blocks, balance): every mask is valid; this only helps scanners.
  const penalty = () => {
    let score = 0;
    let dark = 0;
    for (let y = 0; y < size; y++) {
      let runX = 1;
      let runY = 1;
      for (let x = 0; x < size; x++) {
        if (modules[y][x]) dark++;
        if (x > 0) {
          runX = modules[y][x] === modules[y][x - 1] ? runX + 1 : 1;
          if (runX === 5) score += 3;
          else if (runX > 5) score++;
          runY = modules[x][y] === modules[x - 1][y] ? runY + 1 : 1;
          if (runY === 5) score += 3;
          else if (runY > 5) score++;
        }
        if (x > 0 && y > 0) {
          const c = modules[y][x];
          if (c === modules[y][x - 1] && c === modules[y - 1][x] && c === modules[y - 1][x - 1]) score += 3;
        }
      }
    }
    const total = size * size;
    score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  };
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask);
    drawFormat(mask);
    const score = penalty();
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    applyMask(mask);
  }
  applyMask(best);
  drawFormat(best);
  return modules;
}

/** One SVG path for every dark module, with the 4-module quiet zone the standard requires. */
export function qrPath(text: string, ecc: Ecc = "M"): { size: number; d: string } {
  const quiet = 4;
  const data = encodeQr(text, ecc);
  const parts: string[] = [];
  data.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x++;
      parts.push(`M${start + quiet} ${y + quiet}h${x - start}v1h-${x - start}z`);
    }
  });
  return { size: data.length + quiet * 2, d: parts.join("") };
}
