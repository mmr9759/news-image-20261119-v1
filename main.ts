// THE WORLD TODAY — Thursday 19 November 2026
// A front-page newspaper image summing up the world's news of 19 November 2026.
// Node 22, standard library only. Draws a 1024x1024 PNG with a built-in 5x7
// bitmap font and a tiny PNG encoder (zlib deflate). Fully deterministic:
// no network, no clock, no randomness — the date is hard-coded.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- PNG writer
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(width: number, height: number, rgb: Buffer): Buffer {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    rgb.copy(raw, y * stride + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------- canvas
type RGB = [number, number, number];
const PAPER: RGB = [246, 241, 230];
const INK: RGB = [22, 22, 20];
const RED: RGB = [148, 28, 22];
const NAVY: RGB = [24, 44, 88];
const GREY: RGB = [96, 90, 78];
const RULE: RGB = [178, 168, 148];
const LIGHT: RGB = [232, 225, 210];

const W = 1024;
const H = 1024;

class Canvas {
  buf: Buffer;
  constructor() {
    this.buf = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = PAPER[0];
      this.buf[i * 3 + 1] = PAPER[1];
      this.buf[i * 3 + 2] = PAPER[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const o = (y * W + x) * 3;
    this.buf[o] = c[0];
    this.buf[o + 1] = c[1];
    this.buf[o + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  hline(x: number, y: number, w: number, t: number, c: RGB): void {
    this.rect(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, t: number, c: RGB): void {
    this.rect(x, y, t, h, c);
  }
}

// ------------------------------------------------------------- 5x7 bitmap font
// Each glyph is 7 rows of 5 bits, most significant bit = leftmost pixel.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x10, 0x17, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x0e, 0x10, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x01, 0x0e],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "-": [0, 0, 0, 0x1f, 0, 0, 0],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "%": [0x18, 0x19, 0x02, 0x04, 0x08, 0x13, 0x18],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  '"': [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  "•": [0, 0, 0x04, 0x0e, 0x0e, 0x04, 0],
  "—": [0, 0, 0, 0x1f, 0, 0, 0],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(cv: Canvas, s: string, x: number, y: number, scale: number, c: RGB): void {
  const up = s.toUpperCase();
  let cx = x;
  for (const ch of up) {
    const g = FONT[ch] ?? FONT[" "];
    for (let r = 0; r < 7; r++) {
      const row = g[r];
      for (let col = 0; col < 5; col++) {
        if (row & (0x10 >> col)) {
          cv.rect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawCentered(cv: Canvas, s: string, y: number, scale: number, c: RGB): void {
  drawText(cv, s, Math.round((W - textWidth(s, scale)) / 2), y, scale, c);
}

// Greedy word wrap: returns lines of at most maxChars characters.
function wrap(s: string, maxChars: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur === "") {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ------------------------------------------------------------ dotted world map
// Coarse land mask on a 64 x 32 equirectangular grid (lon -180..180,
// lat ~78N..-42S). Each entry is [startCol, endCol) land runs for one row.
const MAP: number[][][] = [
  [[2, 7], [9, 16], [20, 23], [29, 30], [40, 59]],
  [[2, 8], [9, 18], [20, 24], [36, 61]],
  [[3, 9], [8, 20], [21, 24], [29, 32], [33, 62]],
  [[4, 9], [8, 21], [26, 27], [29, 33], [33, 63]],
  [[4, 10], [9, 22], [26, 28], [28, 37], [37, 63]],
  [[9, 23], [26, 27], [28, 39], [40, 61]],
  [[9, 25], [27, 39], [40, 59]],
  [[10, 26], [27, 37], [40, 57], [59, 61]],
  [[10, 27], [28, 38], [44, 57], [59, 61]],
  [[11, 28], [28, 39], [39, 44], [45, 56]],
  [[12, 28], [29, 39], [40, 44], [45, 49], [49, 57]],
  [[12, 17], [20, 28], [29, 40], [40, 43], [45, 48], [50, 55]],
  [[13, 18], [22, 25], [30, 41], [45, 48], [51, 55]],
  [[14, 19], [30, 42], [45, 48], [51, 56]],
  [[15, 19], [31, 43], [52, 56]],
  [[16, 19], [20, 25], [32, 43], [53, 56]],
  [[17, 20], [19, 27], [33, 43]],
  [[17, 20], [19, 28], [34, 43], [51, 58]],
  [[20, 28], [35, 42], [52, 59]],
  [[20, 27], [35, 41], [53, 58], [58, 62]],
  [[21, 26], [35, 40], [55, 63]],
  [[21, 26], [35, 40], [41, 42], [54, 63]],
  [[21, 25], [35, 40], [54, 63]],
  [[21, 25], [35, 39], [55, 62]],
  [[21, 24], [35, 39], [56, 61]],
  [[21, 24], [35, 38], [57, 60], [62, 64]],
  [[21, 23], [62, 63]],
  [[21, 23]],
  [[21, 22]],
  [],
  [],
  [],
];

function drawMap(cv: Canvas, x0: number, y0: number, cellW: number, cellH: number): void {
  for (let r = 0; r < MAP.length; r++) {
    for (const [a, b] of MAP[r]) {
      for (let c = a; c < b; c++) {
        const dot = c < 20 ? NAVY : c < 40 ? RED : INK;
        cv.rect(x0 + c * cellW + 2, y0 + r * cellH + 1, cellW - 4, cellH - 2, dot);
      }
    }
  }
}

// -------------------------------------------------------------------- stories
// All headlines are real events first reported on Thursday 19 November 2026,
// gathered from wire reports that morning. 3 lead stories + 39 numbered
// briefs = 42 stories from six continents.
const LEADS = [
  {
    kicker: "GAMES  •  AFTER A 13-YEAR WAIT",
    head: ["GTA VI ARRIVES:", "VICE CITY OPENS", "WORLDWIDE TODAY"],
    deck: "ROCKSTAR'S LONG-AWAITED SEQUEL LAUNCHES ON PLAYSTATION 5 AND XBOX AS FANS QUEUE AROUND THE WORLD.",
  },
  {
    kicker: "DIPLOMACY  •  SHENZHEN",
    head: ["TRUMP, XI AND PUTIN", "SHAKE HANDS IN CHINA"],
    deck: "LEADERS OF THREE NUCLEAR POWERS GATHER FOR A TRILATERAL SUMMIT AS XI URGES OPEN TRADE AT APEC.",
  },
  {
    kicker: "BUSINESS  •  RECORD DEBUT",
    head: ["ANTHROPIC RAISES $81.3BN", "IN BIGGEST IPO EVER"],
    deck: "CLAUDE-MAKER'S STOCK MARKET DEBUT TOPS $1.4 TRILLION AS INVESTORS RUSH INTO AI.",
  },
];

// [region, headline] — 13 per column, 39 in all.
const BRIEFS: [string, string][] = [
  ["AMERICAS", "JEFFRIES TO BE FIRST BLACK SPEAKER"],
  ["AMERICAS", "PELTOLA WINS ALASKA; DEMOCRATS WIN SENATE"],
  ["AMERICAS", "AI CYBER THREATS OUTPACE DEFENCES"],
  ["AMERICAS", "VOYAGER 1 ONE LIGHT-DAY FROM EARTH"],
  ["AMERICAS", "DOW FALLS 670 AS FED TURNS HAWKISH"],
  ["AMERICAS", "SAN FRANCISCO STREETS FLOOD IN RAIN"],
  ["AMERICAS", "PEARL HARBOR SURVIVOR DIES AT 105"],
  ["AMERICAS", "HEGSETH INKS DEFENCE PACT IN VENEZUELA"],
  ["AMERICAS", "TRUMP APPEALS TO TOP COURT ON MIGRANTS"],
  ["AMERICAS", "WALMART EYES NFL STREAMING RIGHTS"],
  ["AMERICAS", "ICE: LAWMAKER'S WIFE IN US ILLEGALLY"],
  ["AMERICAS", "GOLD NEAR $3,731 AS DOLLAR STAYS FIRM"],
  ["AMERICAS", "WORLD COPD DAY: EARLY DIAGNOSIS IN FOCUS"],
  ["EUROPE", "VAN GOGH SELLS FOR RECORD $190.4M"],
  ["EUROPE", "EU PROPOSES 45BN EURO UKRAINE LOAN"],
  ["EUROPE", "MELENCHON COULD WIN FRENCH RACE"],
  ["EUROPE", "FRANCE: 4TH WEEKEND OF COST PROTESTS"],
  ["EUROPE", "GERMAN CLIMBER SURVIVES ALPS FALL"],
  ["EUROPE", "WOMAN CHARGED IN BERLIN OVER SPYING"],
  ["EUROPE", "CRIMEAN BRIDGE ATTACKED AGAIN"],
  ["EUROPE", "ENGLAND BEAT AUSTRALIA BY 97 RUNS"],
  ["EUROPE", "HULL BEAT DERBY 4-2 WITH LATE GOALS"],
  ["EUROPE", "RUSSIAN HELD FOR SPYING ON PALANTIR"],
  ["EUROPE", "AUSTRALIA SANCTIONS ISRAELI SETTLERS"],
  ["EUROPE", "UK, ALLIES URGE AID INTO FLOODED GAZA"],
  ["EUROPE", "ISRAEL LAUNCHES RARE GROUND RAID IN GAZA"],
  ["ASIA", "CYCLONE AKVAN NEARS ANDHRA COAST"],
  ["ASIA", "INDIA, JAPAN REVIEW DEFENCE TIES"],
  ["ASIA", "INDIA BEAT PAKISTAN 2-1 FOR SAFF TITLE"],
  ["ASIA", "AMAZON TO INVEST $7BN IN INDIA ENERGY"],
  ["ASIA", "BUMRAH STRIKES IN FIRST OVER"],
  ["ASIA", "BUMRAH NOW 10TH TOP INDIA WICKET-TAKER"],
  ["ASIA", "NORTH KOREA FIRES MISSILES AFTER DRILL"],
  ["ASIA", "SPICEJET TO RAISE 5,500 CRORE RUPEES"],
  ["ASIA", "SENSEX AT 82,032 AS MARKETS HOLD FIRM"],
  ["ASIA", "MYANMAR FACES GENOCIDE VERDICT AT UN COURT"],
  ["AFRICA", "SAUDI ARABIA: DANGER PASSED IN SOUTH"],
  ["AFRICA", "COCAINE, MILLIONS OF PILLS SEIZED IN LIBYA"],
  ["GLOBAL", "ISLAM SET TO BE LARGEST FAITH BY 2035"],
];

const COL_TITLES = ["THE AMERICAS", "EUROPE & THE MIDDLE EAST", "ASIA, AFRICA & OCEANIA"];

// ---------------------------------------------------------------------- layout
function main(): void {
  const cv = new Canvas();
  const MX = 28; // side margin
  const CW = W - 2 * MX; // 968 content width

  // Top rules + masthead
  cv.hline(MX, 12, CW, 3, INK);
  drawCentered(cv, "THE WORLD TODAY", 26, 5, INK);
  cv.hline(MX, 72, CW, 1, RULE);
  drawCentered(cv, "THURSDAY 19 NOVEMBER 2026", 80, 2, RED);
  drawText(cv, "42 STORIES", MX, 82, 1, GREY);
  const rightTag = "SIX CONTINENTS";
  drawText(cv, rightTag, W - MX - textWidth(rightTag, 1), 82, 1, GREY);
  cv.hline(MX, 100, CW, 3, INK);
  cv.hline(MX, 105, CW, 1, INK);

  // Lead story 1 — GTA VI (full width)
  let y = 118;
  drawText(cv, LEADS[0].kicker, MX, y, 1, RED);
  y += 16;
  for (const line of LEADS[0].head) {
    drawText(cv, line, MX, y, 3, INK);
    y += 25;
  }
  for (const line of wrap(LEADS[0].deck, 82)) {
    drawText(cv, line, MX, y, 2, INK);
    y += 17;
  }
  y += 4;
  cv.hline(MX, y, CW, 1, RULE);
  y += 12;

  // Leads 2 and 3 — two columns
  const colW = Math.floor((CW - 24) / 2);
  const leadY = y;
  for (let i = 1; i <= 2; i++) {
    const x = MX + (i - 1) * (colW + 24);
    let yy = leadY;
    drawText(cv, LEADS[i].kicker, x, yy, 1, RED);
    yy += 15;
    for (const line of LEADS[i].head) {
      drawText(cv, line, x, yy, 2, INK);
      yy += 18;
    }
    for (const line of wrap(LEADS[i].deck, 40)) {
      drawText(cv, line, x, yy, 1, GREY);
      yy += 10;
    }
  }
  y = leadY + 15 + 2 * 18 + 3 * 10 + 8;
  cv.hline(MX, y, CW, 1, RULE);
  y += 10;

  // World map strip
  drawCentered(cv, "THE DAY AROUND THE WORLD", y, 1, GREY);
  y += 13;
  const mapW = 64 * 14;
  const mapX = Math.round((W - mapW) / 2);
  drawMap(cv, mapX, y, 14, 4);
  y += 32 * 4 + 8;
  cv.hline(MX, y, CW, 3, INK);
  y += 12;

  // Numbered briefs — three columns of thirteen
  const bColW = Math.floor((CW - 2 * 20) / 3);
  for (let c = 0; c < 3; c++) {
    const x = MX + c * (bColW + 20);
    drawText(cv, COL_TITLES[c], x, y, 1, RED);
    cv.hline(x, y + 11, bColW, 1, RULE);
    let yy = y + 18;
    for (let r = 0; r < 13; r++) {
      const idx = c * 13 + r;
      const [, head] = BRIEFS[idx];
      const num = String(idx + 1).padStart(2, "0") + ".";
      drawText(cv, num, x, yy, 2, RED);
      const lines = wrap(head, 22);
      let ly = yy;
      for (const line of lines.slice(0, 2)) {
        drawText(cv, line, x + 3 * 12 + 4, ly, 2, INK);
        ly += 15;
      }
      yy += 2 * 15 + 5;
    }
  }
  y += 18 + 13 * (2 * 15 + 5) + 4;

  // Footer
  cv.hline(MX, y, CW, 1, RULE);
  drawCentered(cv, "COMPILED FROM WIRE REPORTS  •  THURSDAY 19 NOVEMBER 2026  •  THE WORLD TODAY", y + 8, 1, GREY);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePNG(W, H, cv.buf));
}

main();

