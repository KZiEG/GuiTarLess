// Core music theory: notes, intervals, chord formulas, fretboard maths.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// The 12 root choices, spelled the way guitarists usually write them.
export const KEYS = [
  { pc: 0, name: 'C' },
  { pc: 1, name: 'D♭' },
  { pc: 2, name: 'D' },
  { pc: 3, name: 'E♭' },
  { pc: 4, name: 'E' },
  { pc: 5, name: 'F' },
  { pc: 6, name: 'F♯' },
  { pc: 7, name: 'G' },
  { pc: 8, name: 'A♭' },
  { pc: 9, name: 'A' },
  { pc: 10, name: 'B♭' },
  { pc: 11, name: 'B' },
];

// Standard tuning, low E (index 0) to high e (index 5), as MIDI numbers.
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
export const MAX_FRET = 15;
// Guitar string numbers: string 6 is low E, string 1 is high e.
export const stringNumber = (s) => 6 - s;

export const mod12 = (n) => ((n % 12) + 12) % 12;
export const pcAt = (s, f) => mod12(OPEN_MIDI[s] + f);
export const midiAt = (s, f) => OPEN_MIDI[s] + f;

// The intervals from root to octave.
// degree = the letter step used to spell the note (1 = same letter as root).
export const INTERVALS = [
  { semis: 0, label: '1', name: 'Root', short: 'R', degree: 1,
    sound: 'Home. Every other interval is measured from here.',
    role: 'The note the chord is named after.' },
  { semis: 1, label: '♭2', name: 'Minor 2nd', short: 'm2', degree: 2,
    sound: 'Very tense and crunchy. The two notes rub against each other.',
    role: 'Rare in basic chords; used for tension and colour.' },
  { semis: 2, label: '2', name: 'Major 2nd', short: 'M2', degree: 2,
    sound: 'A whole step. Open and a little unresolved.',
    role: 'Replaces the 3rd in a sus2 chord.' },
  { semis: 3, label: '♭3', name: 'Minor 3rd', short: 'm3', degree: 3,
    sound: 'Darker, sadder colour.',
    role: 'Makes a chord minor.' },
  { semis: 4, label: '3', name: 'Major 3rd', short: 'M3', degree: 3,
    sound: 'Bright and happy colour.',
    role: 'Makes a chord major.' },
  { semis: 5, label: '4', name: 'Perfect 4th', short: 'P4', degree: 4,
    sound: 'Strong and open, wants to fall back to the 3rd.',
    role: 'Replaces the 3rd in a sus4 chord.' },
  { semis: 6, label: '♭5', name: 'Tritone', short: 'TT', degree: 5,
    sound: 'Exactly half an octave. Unstable and restless.',
    role: 'Found between the 3rd and ♭7 of a dominant 7 chord.' },
  { semis: 7, label: '5', name: 'Perfect 5th', short: 'P5', degree: 5,
    sound: 'Solid and stable, almost like the root again.',
    role: 'In every chord here. Root + 5th alone is a power chord.' },
  { semis: 8, label: '♭6', name: 'Minor 6th', short: 'm6', degree: 6,
    sound: 'Bittersweet and dramatic.',
    role: 'Colour note; not in the chords in this lesson.' },
  { semis: 9, label: '6', name: 'Major 6th', short: 'M6', degree: 6,
    sound: 'Sweet and warm.',
    role: 'Colour note; adds to make 6 chords.' },
  { semis: 10, label: '♭7', name: 'Minor 7th', short: 'm7', degree: 7,
    sound: 'Bluesy, wants to move somewhere.',
    role: 'Added to major for dominant 7, to minor for minor 7.' },
  { semis: 11, label: '7', name: 'Major 7th', short: 'M7', degree: 7,
    sound: 'Dreamy and smooth, one fret below the octave.',
    role: 'Added to a major triad for major 7.' },
  { semis: 12, label: '8', name: 'Octave', short: 'P8', degree: 8,
    sound: 'The root again, one octave higher.',
    role: 'Same note name as the root, so it is “1” in a chord.' },
];

export const intervalBySemis = (n) => INTERVALS[n];
export const labelForSemis = (n) => (n % 12 === 0 && n !== 0 ? '1' : INTERVALS[mod12(n)].label);

// Chord formulas, as semitones from the root.
export const CHORDS = [
  { id: 'power', name: 'Power chord', suffix: '5', semis: [0, 7], practice: false },
  { id: 'major', name: 'Major', suffix: '', semis: [0, 4, 7] },
  { id: 'minor', name: 'Minor', suffix: 'm', semis: [0, 3, 7] },
  { id: 'sus2', name: 'Sus2', suffix: 'sus2', semis: [0, 2, 7] },
  { id: 'sus4', name: 'Sus4', suffix: 'sus4', semis: [0, 5, 7] },
  { id: 'maj7', name: 'Major 7', suffix: 'maj7', semis: [0, 4, 7, 11] },
  { id: 'dom7', name: 'Dominant 7', suffix: '7', semis: [0, 4, 7, 10] },
  { id: 'm7', name: 'Minor 7', suffix: 'm7', semis: [0, 3, 7, 10] },
];
export const PRACTICE_CHORDS = CHORDS.filter((c) => c.practice !== false);
export const chordById = (id) => CHORDS.find((c) => c.id === id);
export const formula = (chord) => chord.semis.map((n) => INTERVALS[n].label);

// ---- Spelling ----------------------------------------------------------

const ACC = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };

function parseName(name) {
  const letter = name[0];
  const rest = name.slice(1);
  let acc = 0;
  for (const ch of rest) {
    if (ch === '♭' || ch === 'b') acc -= 1;
    if (ch === '♯' || ch === '#') acc += 1;
  }
  return { letter, acc };
}

// Spell the note `semis` above `rootName`, using the interval's letter step.
export function spellInterval(rootName, semis) {
  const { letter } = parseName(rootName);
  const rootPc = nameToPc(rootName);
  const iv = INTERVALS[semis % 12 === 0 && semis ? 12 : semis];
  const li = (LETTERS.indexOf(letter) + (iv.degree - 1)) % 7;
  const newLetter = LETTERS[li];
  const targetPc = mod12(rootPc + semis);
  let acc = targetPc - LETTER_PC[newLetter];
  if (acc > 6) acc -= 12;
  if (acc < -6) acc += 12;
  return newLetter + (ACC[acc] ?? '?');
}

export function nameToPc(name) {
  const { letter, acc } = parseName(name);
  return mod12(LETTER_PC[letter] + acc);
}

const ENHARMONIC = { 1: ['D♭', 'C♯'], 3: ['E♭', 'D♯'], 6: ['F♯', 'G♭'], 8: ['A♭', 'G♯'], 10: ['B♭', 'A♯'] };

function spellingScore(notes) {
  let score = 0;
  for (const n of notes) {
    if (n.includes('𝄫') || n.includes('𝄪')) score += 10;
    else if (['F♭', 'C♭', 'E♯', 'B♯'].includes(n)) score += 3;
    else if (n.length > 1) score += 1;
  }
  return score;
}

// Pick the most readable spelling of a chord's root and return its note names.
// e.g. D♭ minor is shown as C♯ minor (C♯ E G♯) rather than D♭ F♭ A♭.
export function spellChord(rootPc, chord) {
  const preferred = KEYS[rootPc].name;
  const options = ENHARMONIC[rootPc] ? [preferred, ...ENHARMONIC[rootPc].filter((n) => n !== preferred)] : [preferred];
  let best = null;
  for (const rootName of options) {
    const notes = chord.semis.map((n) => spellInterval(rootName, n));
    const score = spellingScore(notes);
    if (!best || score + 0 < best.score - 2) best = { rootName, notes, score };
  }
  return best;
}

export function chordSymbol(rootName, chord) {
  return rootName + chord.suffix;
}
export function chordLongName(rootName, chord) {
  return `${rootName} ${chord.name.toLowerCase()}`;
}

// ---- Fretboard ---------------------------------------------------------

// Every position of a set of pitch classes inside a fret window.
// Returns [{ s, f, semis }] where semis = interval above the root (0-11).
export function chordPositions(rootPc, chord, { fromFret = 0, toFret = MAX_FRET, strings = [0, 1, 2, 3, 4, 5] } = {}) {
  const out = [];
  for (const s of strings) {
    for (let f = fromFret; f <= toFret; f++) {
      const iv = mod12(pcAt(s, f) - rootPc);
      if (chord.semis.includes(iv)) out.push({ s, f, semis: iv });
    }
  }
  return out;
}

// Where does the note `semis` above (s, f) sit on each string?
// Returns one exact-pitch position per string (if on the neck).
export function intervalShapes(s, f, semis) {
  const target = midiAt(s, f) + semis;
  const out = [];
  for (let t = 0; t < 6; t++) {
    const fret = target - OPEN_MIDI[t];
    if (fret >= 0 && fret <= MAX_FRET) out.push({ s: t, f: fret, stringsUp: t - s, fretMove: fret - f });
  }
  return out;
}

// Does moving from string a to string b (upwards) cross the G→B pair?
export const crossesGB = (a, b) => Math.min(a, b) <= 3 && Math.max(a, b) >= 4;

export function describeMove(stringsUp, fretMove) {
  const fm =
    fretMove === 0 ? 'same fret' : fretMove > 0 ? `${fretMove} fret${fretMove > 1 ? 's' : ''} up` : `${-fretMove} fret${fretMove < -1 ? 's' : ''} back`;
  if (stringsUp === 0) return `Same string, ${fm}`;
  const sw = Math.abs(stringsUp);
  const dir = stringsUp > 0 ? 'higher' : 'lower';
  return `${sw} string${sw > 1 ? 's' : ''} ${dir}, ${fm}`;
}

// Colour family for an interval label.
export function intervalClass(semis) {
  switch (mod12(semis)) {
    case 0: return 'iv-root';
    case 1: case 2: return 'iv-2';
    case 3: return 'iv-m3';
    case 4: return 'iv-3';
    case 5: return 'iv-4';
    case 6: return 'iv-tt';
    case 7: return 'iv-5';
    case 8: case 9: return 'iv-6';
    case 10: return 'iv-b7';
    case 11: return 'iv-7';
    default: return '';
  }
}

// Name a set of intervals (e.g. from the free chord builder).
export function identifyChord(semisSet) {
  const sorted = [...semisSet].sort((a, b) => a - b).join(',');
  return CHORDS.find((c) => [...c.semis].sort((a, b) => a - b).join(',') === sorted) || null;
}
