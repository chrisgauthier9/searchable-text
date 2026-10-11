// pdf2text.js – turns a hospital report PDF into clean, searchable text.
// Runs entirely on the Mac (PDFKit, built into macOS). Never rewrites a word: it only
// reorders lines, drops repeated page headers and rejoins lines the PDF wrapped.
//
// Test from Terminal:   osascript -l JavaScript pdf2text.js report.pdf
// In Shortcuts:         "Run JavaScript for Automation" with this file's contents.

ObjC.import('PDFKit');

const VERSION = '1.2.1';
const UPDATE_URL = 'https://raw.githubusercontent.com/chrisgauthier9/searchable-text/main/';

const CFG = {
  segGap: 1.4,        // horizontal gap (in line heights) that splits a row into separate cells
  bandTop: 0.10,      // top/bottom share of the page where repeated headers/footers live
  bandBottom: 0.08,
  minRunShare: 0.40,  // a column gutter must stay clear for this share of the page content
  minColRows: 4,      // ...with at least this many rows on each side
  paraGap: 1.5,       // vertical gap (in normal line pitches) that means a new paragraph
};

// ---------------------------------------------------------------- reading the PDF
function readPages(path) {
  const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(path));
  if (!doc || doc.isNil()) throw new Error('Could not open PDF');
  const pages = [];
  for (let p = 0; p < doc.pageCount; p++) {
    const page = doc.pageAtIndex(p);
    const box = page.boundsForBox(0);
    const W = box.size.width, H = box.size.height;
    const s = page.string.js || '';
    const n = s.length;
    // PDFKit's own text lines (split on newlines) keep each line's characters together.
    // characterBoundsAtIndex drifts from the string at synthesized newlines; a one-character
    // selection does not, so positions come from selections.
    const lines = [];
    let cur = [];
    for (let i = 0; i <= n; i++) {
      const c = i < n ? s[i] : '\n';
      if (c === '\n' || c === '\r' || c === undefined) { if (cur.length) lines.push(cur); cur = []; continue; }
      const r = page.selectionForRange($.NSMakeRange(i, 1)).boundsForPage(page);
      cur.push({ c, x0: r.origin.x, x1: r.origin.x + r.size.width,
                 top: H - (r.origin.y + r.size.height), bot: H - r.origin.y });
    }
    pages.push({ W, H, rows: buildRows(lines.flatMap(splitByBaseline)), rawInk: s.replace(/\s/g, '').length });
  }
  return pages;
}

const median = a => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
const isSpace = c => /\s/.test(c);
const DESC = /[gjpqy,;()\[\]{}|\/]/;

// PDFKit sometimes puts two nearby rows in one "line"; pull them apart by vertical position.
function splitByBaseline(chars) {
  const groups = [];
  for (const ch of chars) {
    const g = groups.find(gr => Math.abs(gr.bot - ch.bot) < 1.5);
    if (g) g.chars.push(ch); else groups.push({ bot: ch.bot, chars: [ch] });
  }
  return groups.map(g => g.chars);
}

// Split each PDFKit line into cells at wide gaps, then group cells sharing a baseline into rows.
function buildRows(lines) {
  const segs = [];
  for (const chars of lines) {
    const ink = chars.filter(ch => !isSpace(ch.c) && ch.bot > ch.top);
    if (!ink.length) continue;
    const base = median(ink.filter(ch => !DESC.test(ch.c)).map(ch => ch.bot)) || median(ink.map(ch => ch.bot));
    const h = Math.max(...ink.map(ch => base - ch.top)) || 8;
    const cs = [...chars].sort((a, b) => a.x0 - b.x0);
    let seg = null, lastInk = null, pendingSpace = false;
    for (const ch of cs) {
      if (isSpace(ch.c) || !(ch.bot > ch.top)) { pendingSpace = true; continue; }
      const gap = lastInk ? ch.x0 - lastInk.x1 : 0;
      if (!seg || gap > h * CFG.segGap) {
        seg = { text: '', x0: ch.x0, x1: ch.x1, firstWordX1: null, base, h, words: [{ at: 0, x0: ch.x0 }] };
        segs.push(seg);
      } else if (pendingSpace || gap > h * 0.3) {
        seg.text += ' ';
        if (seg.firstWordX1 === null) seg.firstWordX1 = lastInk.x1;
        seg.words.push({ at: seg.text.length, x0: ch.x0 });
      }
      pendingSpace = false;
      seg.text += ch.c; seg.x1 = ch.x1; lastInk = ch;
    }
  }
  segs.forEach(sg => { if (sg.firstWordX1 === null) sg.firstWordX1 = sg.x1; });
  segs.sort((a, b) => a.base - b.base);
  const rows = [];
  for (const sg of segs) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row.base - sg.base) < Math.max(2, Math.min(row.h, sg.h) * 0.35)) {
      row.segs.push(sg); row.h = Math.max(row.h, sg.h);
    } else rows.push({ base: sg.base, h: sg.h, segs: [sg] });
  }
  return rows.map(r => ({ top: r.base - r.h, bot: r.base, h: r.h, segs: r.segs.sort((a, b) => a.x0 - b.x0) }));
}

const rowText = r => r.segs.map(s => s.text).join(' ');
const normKey = t => t.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().toLowerCase();

// ---------------------------------------------------------------- repeated headers and footers
// A row at the top or bottom edge whose text (digits ignored) shows up on another page is page
// furniture. Page 1's copy is kept, outside the columns (pg.headRows / pg.footRows); later copies go.
// Rows on later pages that repeat anything from earlier pages at the top edge go too (title boxes).
function dropRepeatedHeaders(pages) {
  const band = (pg, r) => r.top < pg.H * CFG.bandTop ? 'top' : r.bot > pg.H * (1 - CFG.bandBottom) ? 'bottom' : null;
  const bandKeys = pages.map(pg => new Set(pg.rows.filter(r => band(pg, r)).map(r => normKey(rowText(r)))));
  // Only rows with real words count as headers; a bare date or time repeats in tables all the time.
  const headerLike = k => /[a-z]{3}/.test(k) && k.replace(/[^a-z]/g, '').length >= 5;
  const repeats = k => headerLike(k) && bandKeys.filter(s => s.has(k)).length >= 2;
  const seen = new Set();
  pages.forEach((pg, p) => {
    pg.headRows = []; pg.footRows = []; pg.droppedInk = 0;
    const keys = pg.rows.map(r => normKey(rowText(r)));
    const ink = r => r.segs.reduce((n, sg) => n + sg.text.replace(/\s/g, '').length, 0);
    pg.rows = pg.rows.filter((r, i) => {
      const keep = keepRow(r, i);
      if (!keep && !pg.headRows.includes(r) && !pg.footRows.includes(r)) pg.droppedInk += ink(r);
      return keep;
    });
    keys.forEach(k => seen.add(k));
    function keepRow(r, i) {
      const k = keys[i], b = band(pg, r);
      if (/\(continued\)$/.test(k)) return false;
      if (b && repeats(k)) {
        if (p === 0) (b === 'top' ? pg.headRows : pg.footRows).push(r);
        return false;
      }
      if (p > 0 && b === 'top' && headerLike(k) && seen.has(k)) return false;
      return true;
    }
  });
}

// ---------------------------------------------------------------- columns
const crosses = (row, g) => row.segs.some(s => s.x0 < g - 2 && s.x1 > g + 2);

// Longest vertical stretch of rows that never cross x = g, with text on both sides.
function runAt(rows, g) {
  let best = null, start = 0;
  const close = end => {
    const run = rows.slice(start, end);
    const left = run.filter(r => r.segs.some(s => s.x1 <= g)).length;
    const right = run.filter(r => r.segs.some(s => s.x0 >= g)).length;
    if (run.length && left >= CFG.minColRows && right >= CFG.minColRows) {
      const height = run[run.length - 1].bot - run[0].top;
      if (!best || height > best.height) best = { start, end, height };
    }
  };
  rows.forEach((r, i) => { if (crosses(r, g)) { close(i); start = i + 1; } });
  close(rows.length);
  return best;
}

function findGutter(pg) {
  const rows = pg.rows;
  if (rows.length < CFG.minColRows * 2) return null;
  const content = rows[rows.length - 1].bot - rows[0].top;
  const scores = [];
  for (let g = pg.W * 0.25; g <= pg.W * 0.75; g += 2) scores.push({ g, run: runAt(rows, g) });
  const bestH = Math.max(0, ...scores.map(s => (s.run ? s.run.height : 0)));
  if (bestH < content * CFG.minRunShare) return null;
  // Every x where the clear stretch is nearly as tall: one band = text columns, several bands = a table.
  const bands = [];
  for (const s of scores) {
    if (!(s.run && s.run.height >= bestH * 0.8)) continue;
    const last = bands[bands.length - 1];
    if (last && s.g - last.g1 <= 2.01) last.g1 = s.g; else bands.push({ g0: s.g, g1: s.g });
  }
  if (bands.length !== 1) {
    const lens = rows.flatMap(r => r.segs.map(sg => sg.text.length));
    if (bands.length > 1 && median(lens) >= 25) pg.suspect = 'more than two columns';
    return null;
  }
  const top = scores.filter(s => s.run && s.run.height === bestH);
  const g = top[top.length >> 1].g;
  return { g, run: runAt(rows, g) };
}

// A two-column report keeps the same gutter on every page. Take it from the page with the clearest
// columns and apply it everywhere, so a table inside one column is never mistaken for the gutter,
// and a page whose left column is nearly empty still splits correctly.
function documentLayout(pages) {
  const found = pages.map(pg => { const l = findGutter(pg); return l && sidesWideEnough(pg, l.g) ? l : null; });
  const best = found.filter(Boolean).sort((a, b) => b.run.height - a.run.height)[0];
  if (!best) return pages.map(() => null);
  const g = best.g;
  return pages.map(pg => {
    const run = longestClearRun(pg.rows, g);
    if (!run || run.end - run.start < pg.rows.length * 0.3) return null;   // a full-width page
    return { g, run };
  });
}

// Real text columns are wide; the label column of a lab table is not.
function sidesWideEnough(pg, g) {
  const L = pg.rows.flatMap(r => r.segs.filter(s => s.x1 <= g)), R = pg.rows.flatMap(r => r.segs.filter(s => s.x0 >= g));
  const span = ss => ss.length ? Math.max(...ss.map(s => s.x1)) - Math.min(...ss.map(s => s.x0)) : 0;
  return span(L) >= pg.W * 0.25 && span(R) >= pg.W * 0.25;
}

function longestClearRun(rows, g) {
  let best = null, start = 0;
  const close = end => {
    if (end > start) { const h = rows[end - 1].bot - rows[start].top; if (!best || h > best.height) best = { start, end, height: h }; }
  };
  rows.forEach((r, i) => { if (crosses(r, g)) { close(i); start = i + 1; } });
  close(rows.length);
  return best;
}

// ---------------------------------------------------------------- turning rows into lines

// Table cells that wrap (a lab name over two lines, a date split as 08/10/ 26 13:50) arrive as
// extra short rows sitting tighter than the table's normal row spacing, each piece lined up under
// a cell of the row above. Fold them back into that row's cells.
// A long label can run into the next cell with only a normal space between them. Where at least
// three other rows start a cell at the same x, split there.
function splitAtCellStarts(rows) {
  const tableRow = r => r.segs.length >= 3;
  return rows.map((r, i) => {
    if (!tableRow(r)) return r;
    const counts = {};
    rows.slice(Math.max(0, i - 12), i + 13).forEach(o => {
      if (o === r || !tableRow(o)) return;
      new Set(o.segs.slice(1).map(sg => Math.round(sg.x0 / 3))).forEach(k => { counts[k] = (counts[k] || 0) + 1; });
    });
    const isStart = x => [-1, 0, 1].some(d => (counts[Math.round(x / 3) + d] || 0) >= 3);
    const segs = [];
    for (const s of r.segs) {
      const cuts = (s.words || []).slice(1).filter(w => isStart(w.x0));
      if (!cuts.length) { segs.push(s); continue; }
      let from = 0, x0 = s.x0;
      for (const c of cuts) {
        segs.push({ ...s, text: s.text.slice(from, c.at).trim(), x0, x1: c.x0 - 1, words: [] });
        from = c.at; x0 = c.x0;
      }
      segs.push({ ...s, text: s.text.slice(from).trim(), x0, words: [] });
    }
    return { ...r, segs };
  });
}

function mergeWrappedCells(rows, pitch) {
  rows = splitAtCellStarts(rows);
  const gaps = [];
  for (let i = 1; i < rows.length; i++) if (rows[i].segs.length > 1 || rows[i - 1].segs.length > 1) gaps.push(rows[i].top - rows[i - 1].top);
  const sorted = gaps.filter(g => g > 0).sort((a, b) => a - b);
  // The tightest spacing is the wrap spacing; the first clear step up is where real rows start.
  let limit = 0;
  for (let i = 0; i + 1 < sorted.length; i++) if (sorted[i + 1] / sorted[i] >= 1.2) { limit = (sorted[i] + sorted[i + 1]) / 2; break; }
  limit = Math.min(limit, pitch * 0.92);    // a wrapped fragment sits tighter than ordinary lines
  if (!limit) return rows;
  const out = [];
  let anchor = null;
  for (const r of rows) {
    const prev = out[out.length - 1];
    const gap = prev ? r.top - prev.lastTop : Infinity;
    const cells = anchor ? r.segs.map(s => anchor.segs.findIndex(c => Math.abs(c.x0 - s.x0) <= 6)) : [];
    const fitsCell = (sg, j) => j >= 0 && (j + 1 >= anchor.segs.length || sg.x1 < anchor.segs[j + 1].x0 - 2);
    if (anchor && gap > 0 && gap < limit && r.segs.length < anchor.segs.length && r.segs.every((sg, k) => fitsCell(sg, cells[k]))) {
      r.segs.forEach((s, k) => { const c = anchor.segs[cells[k]]; c.text += (/\/$/.test(c.text) ? '' : ' ') + s.text; });
      anchor.lastTop = r.top;
      continue;
    }
    const copy = { ...r, segs: r.segs.map(s => ({ ...s })), lastTop: r.top };
    out.push(copy);
    anchor = copy.segs.length > 1 ? copy : null;
  }
  return out;
}
const BULLET = /^([-–•*▪●○]|\d{1,2}[.)]\s|[A-Za-z][.)]\s)/;

// Rejoining wrapped lines is the risky step: a wrong join merges two medications. So a line is only
// joined to the one above when the next word could not have fit there, and then only when:
//   - it is indented under it (hanging indent, like a medication's second line), or
//   - it sits at the same indent, the block uses no hanging indents, and it starts lowercase /
//     with a digit or punctuation (or the block is running prose, where every line is full).
// When unsure it leaves the line break in place: the words are all still there and searchable.
function rowsToLines(rows) {
  if (!rows.length) return [];
  const pitches = [];
  for (let i = 1; i < rows.length; i++) { const d = rows[i].top - rows[i - 1].top; if (d > 0) pitches.push(d); }
  const pitch = median(pitches) || rows[0].h * 1.2;
  rows = mergeWrappedCells(rows, pitch);
  const singles = rows.filter(r => r.segs.length === 1).map(r => r.segs[0]);
  const right = Math.max(0, ...singles.map(s => s.x1));
  const leftMost = Math.min(Infinity, ...singles.map(s => s.x0));
  const fits = (a, b, h) => a.x1 + h * 0.3 + (b.firstWordX1 - b.x0) > right - 1;
  const hanging = (a, b, h) => b.x0 > a.x0 + 2 && b.x0 <= a.x0 + h * 3;
  const sameIndent = (a, b) => Math.abs(b.x0 - a.x0) <= 2;

  // Split into blocks at paragraph gaps and table rows, then read each block's style.
  const blocks = [];
  let blk = null, prev = null;
  for (const r of rows) {
    const gap = prev ? r.top - (prev.lastTop || prev.top) : 0;
    const brk = !prev || gap > pitch * CFG.paraGap || gap < 0;
    if (brk || r.segs.length > 1 || (prev && prev.segs.length > 1)) { blk = { rows: [], gapBefore: prev && brk }; blocks.push(blk); }
    blk.rows.push(r); prev = r;
  }
  const out = [];
  for (const b of blocks) {
    if (b.gapBefore && out.length) out.push('');
    if (b.rows[0].segs.length > 1) { b.rows.forEach(r => out.push(...cellsToLines(r.segs))); continue; }
    const segs = b.rows.map(r => r.segs[0]);
    let hasHang = false, full = 0;
    for (let i = 1; i < segs.length; i++) if (hanging(segs[i - 1], segs[i], b.rows[i].h) && fits(segs[i - 1], segs[i], b.rows[i].h)) hasHang = true;
    segs.forEach(s => { if (s.x1 > right - (right - leftMost) * 0.2) full++; });
    const prose = segs.length >= 3 && full / segs.length >= 0.6;
    let cont = false;
    segs.forEach((s, i) => {
      const a = segs[i - 1], h = b.rows[i].h;
      let join = false;
      if (a && !BULLET.test(s.text) && !/:$/.test(a.text) && fits(a, s, h)) {
        if (hanging(a, s, h)) join = true;
        else if (sameIndent(a, s) && cont) join = true;                    // third line of a hanging item
        else if (sameIndent(a, s) && !hasHang && (/^[a-z0-9(\[,.;%]/.test(s.text) || prose)) join = true;
      }
      if (join) out[out.length - 1] += ' ' + s.text; else out.push(s.text);
      cont = join && (cont || hanging(a, s, h));
    });
  }
  return out;
}

// Cells on one row: "Label:" + value stay together, 3+ cells read as a table row, 2 cells become 2 lines.
function cellsToLines(segs) {
  const merged = [];
  for (const s of segs) {
    const last = merged[merged.length - 1];
    if (last && /:$/.test(last) && !/:$/.test(s.text)) merged[merged.length - 1] = last + ' ' + s.text;
    else merged.push(s.text);
  }
  return merged.length >= 3 ? [merged.join(' | ')] : merged;
}

// ---------------------------------------------------------------- assembly
const SIGNED = /^electronically signed/i;

function convert(path) { return convertChecked(path).text; }

// Same conversion, plus reasons to double-check the result:
//   - a page with no text (a scanned page inside a text report)
//   - a layout that looks like more than two columns
//   - the character count does not balance: every non-space character in the PDF must be in the
//     output, except the repeated headers that were removed on purpose
function convertChecked(path) {
  const pages = readPages(path);
  const warnings = [];
  dropRepeatedHeaders(pages);
  const head = [], left = [], rightCol = [], tail = [];
  const streams = [];               // [{rows}] in reading order when there are no columns
  let anyCols = false;
  const layouts = documentLayout(pages);
  anyCols = layouts.some(Boolean);

  const pageHead = pages[0].headRows, pageFoot = pages[0].footRows;
  if (!anyCols) {
    streams.push(pageHead, pages.flatMap((pg, p) => pg.rows.map(r => ({ ...r, top: r.top + p * 100000, bot: r.bot + p * 100000 }))), pageFoot);
  } else {
    head.push(...pageHead);
    pages.forEach((pg, p) => {
      const off = p * 100000;     // keeps rows from different pages apart when measuring gaps
      const shift = r => ({ ...r, top: r.top + off, bot: r.bot + off });
      const lay = layouts[p];
      if (!lay) { (p === 0 ? head : tail).push(...pg.rows.map(shift)); return; }
      const { g, run } = lay;
      const before = pg.rows.slice(0, run.start), inside = pg.rows.slice(run.start, run.end), after = pg.rows.slice(run.end);
      (p === 0 ? head : left).push(...before.map(shift));
      for (const r of inside) {
        const L = r.segs.filter(s => s.x1 <= g), R = r.segs.filter(s => s.x0 >= g);
        if (L.length) left.push(shift({ ...r, segs: L }));
        if (R.length) rightCol.push(shift({ ...r, segs: R }));
      }
      tail.push(...after.map(shift));
    });
    streams.push(head, left, rightCol, tail, pageFoot);
  }

  // Electronically Signed and everything after it in its stream goes last.
  let blocks = streams.map(rowsToLines);
  let signature = [];
  blocks = blocks.map(lines => {
    const i = lines.findIndex(l => SIGNED.test(l.trim()));
    if (i < 0) return lines;
    signature.push(...lines.slice(i));
    return lines.slice(0, i);
  });
  blocks.push(signature);

  const joined = blocks.map(b => b.join('\n').replace(/^\n+|\n+$/g, '')).filter(Boolean).join('\n\n');
  const text = joined.replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';

  const hasText = pages.some(pg => pg.rawInk > 20);
  const scanned = pages.map((pg, i) => (hasText && pg.rawInk <= 20 ? i + 1 : 0)).filter(Boolean);
  if (scanned.length) warnings.push(`page ${scanned.join(', ')} has no text (scanned)`);
  if (pages.some(pg => pg.suspect)) warnings.push('the layout looks like more than two columns');
  const expected = pages.reduce((n, pg) => n + pg.rawInk - pg.droppedInk, 0);
  const actual = text.split(' | ').join('').replace(/\s/g, '').length;
  if (actual !== expected) warnings.push('some text may be missing');
  return { text, warnings };
}

// With no file given (the Dock app), ask the PDF viewer which report is open in its front window.
// This uses Automation (a one-click "Allow" box the first time), not Accessibility.
// Only viewers already running are asked, so nothing gets launched.
const VIEWERS = ['Adobe Acrobat', 'Adobe Acrobat Reader', 'Adobe Acrobat Reader DC', 'Adobe Acrobat DC', 'Preview'];

function openPdfPath() {
  let denied = null;
  for (const name of VIEWERS) {
    let app;
    try { app = Application(name); if (!app.running()) continue; } catch (e) { continue; }
    try {
      const path = name === 'Preview' ? previewFront(app) : acrobatFront(app);
      if (path && /\.pdf$/i.test(path)) return path;
    } catch (e) { if (isPermissionError(e)) denied = e; }
  }
  if (denied) throw denied;
  return null;
}

function previewFront(app) {
  for (const w of app.windows()) {              // front window first
    try { const d = w.document(); if (d) return d.path(); } catch (e) { if (isPermissionError(e)) throw e; }
  }
  return null;
}

function acrobatFront(app) {
  const doc = app.activeDoc();
  const f = doc.fileAlias();
  return f ? f.toString() : null;
}

// Three ways in:
//   osascript -l JavaScript pdf2text.js file.pdf   -> prints the text (testing)
//   osascript -l JavaScript pdf2text.js --front    -> same, for the PDF open on screen (testing)
//   Dock app (no arguments)                        -> copies the text and says "paste it"
function run(argv) {
  // A double-clicked app is handed a launch object, not a path; keep only real paths.
  let args = (Array.isArray(argv) ? argv : [argv]).filter(Boolean).map(a => {
    try { const s = typeof a === 'string' ? a : a.toString(); return /^(\/|--front$|--check$)/.test(s) ? s : null; } catch (e) { return null; }
  }).filter(Boolean);
  if (args.length) {
    if (args[0] === '--front') { const p = openPdfPath(); args = p ? [p] : []; }
    if (args[0] === '--check') return args.slice(1).map(a => a + ': ' + (convertChecked(a).warnings.join('; ') || 'ok')).join('\n');
    return args.length ? args.map(convert).join('\n\n') : 'No PDF found.';
  }
  bootstrap();
}

// The Dock app. Success is a quiet notification; a failure is a plain-language box, never a raw error.
// The clipboard is emptied first, so a failed run can never paste the previous patient's report.
const MSG = {
  done:      'Done. The text is copied.\n\nClick in the chart note and press Command-V to paste.',
  noPdf:     'No report is open.\n\nOpen the report from the chart first, then click Searchable Text again.',
  noAccess:  'Searchable Text needs permission to see the open report.\n\nOpen System Settings > Privacy & Security > Automation, find Searchable Text and switch on your PDF viewer. Then try again. Nothing was copied.',
  noText:    'This report is a scanned image, so there is no text to copy.\n\nNothing was copied.',
  badPdf:    'This report could not be read.\n\nNothing was copied. Please tell whoever set this up.',
  protected: 'This PDF is in a protected folder (for example, it was opened from Messages or Mail), so Searchable Text cannot open it.\n\nReports opened from the chart work normally. Nothing was copied.',
  unknown:   'Something went wrong. Nothing was copied.\n\nPlease tell whoever set this up.',
};

function runApp() {
  const me = Application.currentApplication();
  me.includeStandardAdditions = true;
  const say = (msg, icon) => {
    try { me.displayDialog(msg, { buttons: ['OK'], defaultButton: 'OK', withTitle: 'Searchable Text', withIcon: icon || 'note', givingUpAfter: icon === 'stop' ? 30 : 8 }); } catch (e) {}
  };
  try { me.setTheClipboardTo(''); } catch (e) {}

  let path;
  try { path = openPdfPath(); }
  catch (e) { logError('find-pdf', e); say(isPermissionError(e) ? MSG.noAccess : MSG.unknown, 'stop'); return; }
  if (!path) { say(MSG.noPdf, 'caution'); return; }

  if (!$.NSFileManager.defaultManager.isReadableFileAtPath(path) || !$.NSData.dataWithContentsOfFile(path) || $.NSData.dataWithContentsOfFile(path).isNil()) {
    say(MSG.protected, 'caution'); return;
  }
  let text, warnings = [];
  try { ({ text, warnings } = convertChecked(path)); }
  catch (e) { logError('convert', e); say(/Could not open PDF/.test(e.message) ? MSG.badPdf : MSG.unknown, 'stop'); return; }
  if (!text.trim()) { say(MSG.noText, 'caution'); return; }

  try { me.setTheClipboardTo(text); }
  catch (e) { logError('clipboard', e); say(MSG.unknown, 'stop'); return; }
  try {
    if (warnings.length) {
      logError('check', new Error(warnings.join('; ')));
      me.displayNotification(`Unusual report: ${warnings[0]}. Read it over before saving.`, { withTitle: 'Text copied – please check it', soundName: 'Funk' });
    } else {
      me.displayNotification('Click in the chart note and press Command-V.', { withTitle: 'Report text copied' });
    }
  } catch (e) {}
}

const isPermissionError = e => /-1719|-25211|-1743|-10004|assistive|not allowed|not authori[sz]ed|not permitted/i.test(String(e && (e.message || e)) + ' ' + (e && e.errorNumber));

// Errors go to ~/Library/Logs/Searchable Text.log for whoever supports it. Only the error itself
// is written: never the file path (it can hold a patient's name) and never report text.
function logError(step, e) {
  try {
    const msg = String((e && e.message) || e).replace(/\/[^\n]*/g, '<path>');
    const line = `${new Date().toISOString()}  ${step}  ${(e && e.errorNumber) || ''}  ${msg}\n`;
    const logPath = $(`${$.NSHomeDirectory().js}/Library/Logs/Searchable Text.log`).stringByStandardizingPath;
    const fm = $.NSFileManager.defaultManager;
    if (!fm.fileExistsAtPath(logPath)) fm.createFileAtPathContentsAttributes(logPath, $(), $());
    const fh = $.NSFileHandle.fileHandleForWritingAtPath(logPath);
    fh.seekToEndOfFile; fh.writeData($(line).dataUsingEncoding($.NSUTF8StringEncoding)); fh.closeFile;
  } catch (_) {}
}

// ---------------------------------------------------------------- updates
// The app runs the newest script it has: its own, or a newer one downloaded earlier into
// ~/Library/Application Support/Searchable Text/. After each run it checks GitHub for a newer
// version (one small request, no patient data) and stores it for the next click.
//
// Every update must carry a signature made with Chris's private key, which never leaves his Mac.
// The app checks it against the public key below, both when downloading and every time before
// running it, so code pushed by anyone else (even with access to the GitHub repo) is ignored.
// Any update problem is silent and leaves the working version in place.
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE39jNfohWGt+J6kLL4B8Tl9Q6UVbe
ZrpkpzLEd5wLcHxKKc9GFqKy0mkud/VPye3/CM+h43kNA8OeSJoZz/A1RA==
-----END PUBLIC KEY-----
`;
const supportDir = () => $.NSHomeDirectory().js + '/Library/Application Support/Searchable Text';
const versionOf = code => (String(code).match(/^const VERSION = '(\d+\.\d+\.\d+)';/m) || [])[1];
function newer(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}
function readText(path) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
  return !s || s.isNil() ? null : s.js;
}
const writeText = (path, text) => $(text).writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null);
const q = s => "'" + String(s).replace(/'/g, "'\\''") + "'";

// True only if sigPath (base64 ECDSA P-256 / SHA-256) is a valid signature of codePath by our key.
function signedByChris(codePath, sigPath) {
  const tmp = $.NSTemporaryDirectory().js + 'searchable-text-' + Date.now();
  try {
    $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(tmp, true, $(), null);
    writeText(tmp + '/pub.pem', PUBLIC_KEY);
    const out = shell(`/usr/bin/base64 -D -i ${q(sigPath)} -o ${q(tmp + '/sig.der')} && ` +
      `/usr/bin/openssl dgst -sha256 -verify ${q(tmp + '/pub.pem')} -signature ${q(tmp + '/sig.der')} ${q(codePath)}`);
    return /Verified OK/.test(out);
  } catch (e) { return false; }
  finally { $.NSFileManager.defaultManager.removeItemAtPathError(tmp, null); }
}

const loadScript = code => new Function(code + '\nreturn { VERSION, runApp, checkForUpdate, convertChecked };')();

function bootstrap() {
  let impl = { VERSION, runApp, checkForUpdate };
  const cached = supportDir() + '/pdf2text.js';
  const code = readText(cached);
  const v = code && versionOf(code);
  if (v && newer(v, VERSION)) {
    if (signedByChris(cached, cached + '.sig')) {
      try { impl = loadScript(code); } catch (e) { logError('load-update', e); }
    } else logError('load-update', new Error('stored update failed the signature check'));
  }
  try { impl.runApp(); }
  finally { try { impl.checkForUpdate(); } catch (e) { logError('update', e); } }
}

function shell(cmd) {
  const me = Application.currentApplication();
  me.includeStandardAdditions = true;
  return me.doShellScript(cmd, { alteringLineEndings: false });
}
const fetchText = (url, seconds) => { try { return shell(`/usr/bin/curl -fsSL --max-time ${seconds} ${q(url)}`); } catch (e) { return null; } };
const fetchFile = (url, path, seconds) => { try { shell(`/usr/bin/curl -fsSL --max-time ${seconds} -o ${q(path)} ${q(url)}`); return true; } catch (e) { return false; } };

function checkForUpdate() {
  const latest = (fetchText(UPDATE_URL + 'version.txt', 4) || '').trim();
  if (!/^\d+\.\d+\.\d+$/.test(latest) || !newer(latest, VERSION)) return;
  const fm = $.NSFileManager.defaultManager;
  const dir = supportDir(), code = dir + '/download.js', sig = dir + '/download.js.sig';
  fm.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(dir, true, $(), null);
  const clean = () => { fm.removeItemAtPathError(code, null); fm.removeItemAtPathError(sig, null); };
  if (!fetchFile(UPDATE_URL + 'pdf2text.js', code, 15) || !fetchFile(UPDATE_URL + 'pdf2text.js.sig', sig, 4)) return clean();
  if (versionOf(readText(code)) !== latest) return clean();
  if (!signedByChris(code, sig)) { logError('update', new Error('download failed the signature check')); return clean(); }
  fm.removeItemAtPathError(dir + '/pdf2text.js', null); fm.removeItemAtPathError(dir + '/pdf2text.js.sig', null);
  fm.moveItemAtPathToPathError(code, dir + '/pdf2text.js', null);
  fm.moveItemAtPathToPathError(sig, dir + '/pdf2text.js.sig', null);
}
