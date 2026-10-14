import { LOSCategory } from '../models';

/**
 * Parser for patient lists pasted from the secondary HTML tool.
 *
 * Each line is expected to contain LOS, Location and Initials. The parser accepts:
 *  - Tab-separated rows (what you get when copying an HTML table)
 *  - Comma, semicolon or pipe separated rows
 *  - Columns separated by two or more spaces
 *  - Single-space rows in the order "LOS Location Initials" (e.g. "13:40 Majors 3 AB")
 *
 * LOS can be HH:MM ("13:40"), hours/minutes ("13h 20m", "45m"), decimal hours ("13.5")
 * or a category ("> 12h", "4 - 12h", "<2h"). Header lines are skipped.
 */

export interface ParsedPatientRow {
  lineNumber: number;
  raw: string;
  initials: string;
  location: string;
  losHours: number;
  losCategory: LOSCategory;
  error?: string;
}

export interface PatientListParseResult {
  rows: ParsedPatientRow[];
  validRows: ParsedPatientRow[];
  headerLinesSkipped: number;
}

type LineParse =
  | { ok: true; initials: string; location: string; hours: number; category: LOSCategory }
  | { ok: false; error: string };

export function categoriseLos(hours: number): LOSCategory {
  if (hours < 2) return '< 2h';
  if (hours < 3) return '2 - 3h';
  if (hours < 4) return '3 - 4h';
  if (hours <= 12) return '4 - 12h';
  return '> 12h';
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const fromHours = (h: number): { hours: number; category: LOSCategory } | null =>
  Number.isFinite(h) && h >= 0 && h <= 168 ? { hours: round2(h), category: categoriseLos(h) } : null;

export function parseLos(input: string): { hours: number; category: LOSCategory } | null {
  const t = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t) return null;

  let m = t.match(/^(?:>|over|more than)\s*(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)?$/);
  if (m) return fromHours(parseFloat(m[1]) + 0.5);

  m = t.match(/^(?:<|under|less than)\s*(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)?$/);
  if (m) return fromHours(Math.max(0, parseFloat(m[1]) - 0.5));

  m = t.match(/^(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)?$/);
  if (m) return fromHours((parseFloat(m[1]) + parseFloat(m[2])) / 2);

  m = t.match(/^(\d{1,3}):([0-5]\d)$/);
  if (m) return fromHours(parseInt(m[1], 10) + parseInt(m[2], 10) / 60);

  m = t.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(?:(\d{1,2})\s*(?:m|min|mins|minutes)?)?$/);
  if (m) return fromHours(parseFloat(m[1]) + (m[2] ? parseInt(m[2], 10) / 60 : 0));

  m = t.match(/^(\d+)\s*(?:m|min|mins|minutes)$/);
  if (m) return fromHours(parseInt(m[1], 10) / 60);

  if (/^\d+(?:\.\d+)?$/.test(t)) return fromHours(parseFloat(t));

  return null;
}

const normaliseInitials = (cell: string): string => cell.replace(/[.\s]/g, '').toUpperCase();

export const isInitials = (cell: string): boolean => /^[A-Z]{1,3}$/.test(normaliseInitials(cell));

/** Key used to match a pasted patient to an existing row in the same huddle. */
export const matchKey = (initials: string, location: string): string =>
  `${initials.trim().toUpperCase()}|${location.trim().toLowerCase().replace(/\s+/g, ' ')}`;

function build(initialsCell: string, locationCell: string, los: { hours: number; category: LOSCategory }): LineParse {
  const location = locationCell.trim().replace(/\s+/g, ' ');
  if (!location) return { ok: false, error: 'Missing location' };
  if (location.length > 40) return { ok: false, error: 'Location is too long' };
  return { ok: true, initials: normaliseInitials(initialsCell), location, hours: los.hours, category: los.category };
}

function splitCells(line: string): string[] {
  const clean = (parts: string[]) => parts.map(p => p.trim()).filter(p => p.length > 0);
  if (line.includes('\t')) return clean(line.split('\t'));
  for (const d of [',', ';', '|']) {
    if (line.includes(d)) return clean(line.split(d));
  }
  if (/\S\s{2,}\S/.test(line)) return clean(line.split(/\s{2,}/));
  return [];
}

function parseCells(cells: string[]): LineParse {
  if (cells.length < 3) return { ok: false, error: 'Expected three columns: LOS, location, initials' };

  // Default column order from the HTML tool: LOS, Location, Initials
  const defaultLos = parseLos(cells[0]);
  if (defaultLos && isInitials(cells[2])) return build(cells[2], cells[1], defaultLos);

  // Otherwise detect columns by content
  const losIdx = cells.findIndex(c => parseLos(c) !== null);
  if (losIdx === -1) return { ok: false, error: 'No readable LOS value' };

  const candidates = cells
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => i !== losIdx && isInitials(c));
  if (candidates.length === 0) return { ok: false, error: 'No valid initials (1–3 letters)' };
  const initialsPick = candidates.find(({ c }) => normaliseInitials(c).length === 2) ?? candidates[candidates.length - 1];

  const locIdx = cells.findIndex((_, i) => i !== losIdx && i !== initialsPick.i);
  if (locIdx === -1) return { ok: false, error: 'Missing location' };

  const los = parseLos(cells[losIdx]);
  if (!los) return { ok: false, error: 'No readable LOS value' };
  return build(initialsPick.c, cells[locIdx], los);
}

function parseSpaceSeparated(line: string): LineParse {
  const tokens = line.split(/\s+/);
  if (tokens.length < 3) return { ok: false, error: 'Expected LOS, location and initials' };
  const last = tokens[tokens.length - 1];
  if (!isInitials(last)) return { ok: false, error: 'Last value should be initials (1–3 letters)' };

  // Longest LOS prefix first so "4 - 12h" or "13h 20m" are read as one value
  for (let n = Math.min(4, tokens.length - 2); n >= 1; n--) {
    const los = parseLos(tokens.slice(0, n).join(' '));
    if (los) return build(last, tokens.slice(n, -1).join(' '), los);
  }
  return { ok: false, error: 'No readable LOS value at start of line' };
}

function parseLine(line: string): LineParse {
  const cells = splitCells(line);
  return cells.length > 0 ? parseCells(cells) : parseSpaceSeparated(line);
}

const HEADER_PATTERN = /\b(los|initials)\b/i;

export function parsePatientList(text: string): PatientListParseResult {
  const rows: ParsedPatientRow[] = [];
  const seen = new Map<string, number>();
  let headerLinesSkipped = 0;

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;
    const lineNumber = i + 1;
    const parsed = parseLine(line);

    if (!parsed.ok) {
      if (HEADER_PATTERN.test(line)) {
        headerLinesSkipped++;
        return;
      }
      rows.push({ lineNumber, raw: line, initials: '', location: '', losHours: 0, losCategory: '< 2h', error: parsed.error });
      return;
    }

    const key = matchKey(parsed.initials, parsed.location);
    const duplicateOf = seen.get(key);
    rows.push({
      lineNumber,
      raw: line,
      initials: parsed.initials,
      location: parsed.location,
      losHours: parsed.hours,
      losCategory: parsed.category,
      error: duplicateOf !== undefined ? `Duplicate of line ${duplicateOf}` : undefined,
    });
    if (duplicateOf === undefined) seen.set(key, lineNumber);
  });

  return { rows, validRows: rows.filter(r => !r.error), headerLinesSkipped };
}
