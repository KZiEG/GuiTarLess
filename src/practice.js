// Practice session engine: turns the settings into a stream of prompt cards.
import { CHORDS, PRACTICE_CHORDS, INTERVALS, chordById, spellChord, spellInterval, chordSymbol } from './theory.js';

export const AREAS = [
  { value: 'neck', label: 'Whole neck', lo: [0, 11] },
  { value: 'low', label: 'Frets 0–5', lo: [0, 1] },
  { value: 'mid', label: 'Frets 4–10', lo: [4, 6] },
  { value: 'high', label: 'Frets 8–15', lo: [8, 11] },
];

export const STRING_SETS = [
  { value: 'all', label: 'All strings', strings: [0, 1, 2, 3, 4, 5], name: 'all strings' },
  { value: '654', label: '6–4', strings: [0, 1, 2], name: 'strings 6–4' },
  { value: '543', label: '5–3', strings: [1, 2, 3], name: 'strings 5–3' },
  { value: '432', label: '4–2', strings: [2, 3, 4], name: 'strings 4–2' },
  { value: '321', label: '3–1', strings: [3, 4, 5], name: 'strings 3–1' },
];

export const MODES = [
  { value: 'tones', label: 'Chord tones', desc: 'Play the chord in an area of the neck, or find one interval inside it.' },
  { value: 'change', label: 'Change one note', desc: 'Play one chord, then move a single note to turn it into another.' },
  { value: 'move', label: 'Move it around', desc: 'The same chord in four places up the neck.' },
];

export const DEFAULT_SETTINGS = {
  root: 9,
  chords: ['major', 'minor'],
  mode: 'tones',
  area: 'neck',
  strings: '432',
  pace: 0,
  labels: 'iv',
  hint: false,
};

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const WIN = 4; // window = lo..lo+4 (five frets, one hand position)

// Pairs of chords that differ by exactly one note (changed or added).
export function onePairs(ids) {
  const out = [];
  for (const a of ids) {
    for (const b of ids) {
      if (a === b) continue;
      const A = chordById(a).semis;
      const B = chordById(b).semis;
      const added = B.filter((n) => !A.includes(n)).length;
      const removed = A.filter((n) => !B.includes(n)).length;
      if ((added === 1 && removed <= 1) || (added === 0 && removed === 1)) out.push([a, b]);
    }
  }
  return out;
}

export function canRun(settings) {
  if (!settings.chords.length) return 'Pick at least one chord.';
  if (settings.mode === 'change' && onePairs(settings.chords).length === 0)
    return 'Change one note needs two chords that differ by one note, e.g. major + minor, or major + sus4.';
  return null;
}

export function createSession(settings) {
  const area = AREAS.find((a) => a.value === settings.area) || AREAS[0];
  const set = STRING_SETS.find((s) => s.value === settings.strings) || STRING_SETS[0];
  let count = 0;
  let last = null;
  let moveQueue = [];

  const chooseRoot = () => (settings.root === 'random' ? rand(12) : settings.root);
  const randomLo = () => area.lo[0] + rand(area.lo[1] - area.lo[0] + 1);

  function base(rootPc, chord, lo) {
    const spelled = spellChord(rootPc, chord);
    return {
      id: ++count,
      rootPc,
      rootName: spelled.rootName,
      notes: spelled.notes,
      chord,
      symbol: chordSymbol(spelled.rootName, chord),
      lo,
      hi: lo + WIN,
      strings: set.strings,
      stringsName: set.name,
    };
  }

  function tones() {
    let chord, rootPc, lo, tries = 0;
    do {
      chord = chordById(pick(settings.chords));
      rootPc = chooseRoot();
      lo = randomLo();
      tries++;
    } while (last && last.chord.id === chord.id && last.rootPc === rootPc && last.lo === lo && tries < 10);
    const c = base(rootPc, chord, lo);
    if (Math.random() < 0.45) {
      const t = pick(chord.semis);
      c.kind = 'target';
      c.target = t;
      c.instruction = `Find every ${INTERVALS[t].label} (${t === 0 ? 'root' : INTERVALS[t].name.toLowerCase()}): ${spellInterval(c.rootName, t)}`;
    } else {
      c.kind = 'tones';
      c.instruction = 'Play every chord tone in the area';
    }
    return c;
  }

  function change() {
    const pairs = onePairs(settings.chords);
    const [a, b] = pick(pairs);
    const rootPc = chooseRoot();
    const from = chordById(a);
    const c = base(rootPc, chordById(b), randomLo());
    // Use one spelling of the root for both chords (e.g. C♯m → C♯, not C♯m → D♭).
    const rootName = spellChord(rootPc, from).rootName;
    c.rootName = rootName;
    c.notes = c.chord.semis.map((n) => spellInterval(rootName, n));
    c.symbol = chordSymbol(rootName, c.chord);
    c.kind = 'change';
    c.from = from;
    c.fromSymbol = chordSymbol(rootName, from);
    c.added = c.chord.semis.filter((n) => !from.semis.includes(n));
    c.removed = from.semis.filter((n) => !c.chord.semis.includes(n));
    c.instruction = `Play ${c.fromSymbol}, then change one note to make ${c.symbol}`;
    return c;
  }

  function move() {
    if (!moveQueue.length) {
      const chord = chordById(pick(settings.chords));
      const rootPc = chooseRoot();
      const [a, b] = area.lo;
      const n = Math.min(4, b - a + 1);
      const los = [];
      for (let i = 0; i < n; i++) los.push(Math.round(a + ((b - a) * i) / Math.max(1, n - 1)));
      moveQueue = [...new Set(los)].map((lo, i, arr) => ({ chord, rootPc, lo, i, n: arr.length }));
    }
    const m = moveQueue.shift();
    const c = base(m.rootPc, m.chord, m.lo);
    c.kind = 'move';
    c.seq = `${m.i + 1} of ${m.n}`;
    c.instruction = m.i === 0 ? 'Play it here first' : 'Same chord, move up the neck';
    return c;
  }

  return {
    next() {
      const c = settings.mode === 'change' ? change() : settings.mode === 'move' ? move() : tones();
      last = c;
      return c;
    },
  };
}

export const ALL_PRACTICE_CHORDS = PRACTICE_CHORDS;
export { CHORDS };
