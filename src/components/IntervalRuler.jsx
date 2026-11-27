import React from 'react';
import { INTERVALS, KEYS, intervalClass, spellInterval, nameToPc, mod12 } from '../theory.js';

const ODD = ['F♭', 'C♭', 'E♯', 'B♯'];
// Columns that aren't in the chord use their everyday name (C rather than B♯).
function columnName(rootName, semis, inChord) {
  const n = spellInterval(rootName, semis);
  if (inChord) return n;
  if (n.includes('𝄫') || n.includes('𝄪') || ODD.includes(n)) {
    const pc = mod12(nameToPc(rootName) + semis);
    return KEYS[pc].name;
  }
  return n;
}
import { arpeggio } from '../audio.js';

/**
 * Root-to-octave ruler for one key: semitones, symbol, interval name and the
 * actual note in that key. Columns are like frets on one string.
 *
 * highlight: semitone numbers to light up (e.g. a chord's tones); others dim.
 * changed:   semitone numbers to ring (the note that just changed).
 */
export default function IntervalRuler({ rootName, highlight, changed = [], caption }) {
  const rootMidi = 57 + ((nameToPc(rootName) - 9 + 12) % 12); // root between A3 and G#4
  const lit = (n) => !highlight || highlight.includes(n % 12) || (n === 12 && highlight.includes(0));

  return (
    <div className="ruler-block">
      <div className="ruler-scroll">
        <div className="ruler">
          <div className="ruler-rowlabel">Semitones</div>
          <div className="ruler-rowlabel">Symbol</div>
          <div className="ruler-rowlabel">Interval</div>
          <div className="ruler-rowlabel">Note</div>
          {INTERVALS.map((iv) => (
            <button
              key={iv.semis}
              className={`ruler-col ${lit(iv.semis) ? '' : 'dim'} ${changed.includes(iv.semis) ? 'changed' : ''}`}
              onClick={() => arpeggio(iv.semis === 0 ? [rootMidi] : [rootMidi, rootMidi + iv.semis], 0.4)}
              aria-label={`${iv.name}: ${columnName(rootName, iv.semis, lit(iv.semis))}`}
            >
              <span className="ruler-semis">{iv.semis}</span>
              <span className={`pill ${intervalClass(iv.semis)}`}>{iv.label}</span>
              <span className="ruler-short">{iv.short}</span>
              <span className="ruler-note">{columnName(rootName, iv.semis, highlight ? lit(iv.semis) : false)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="ruler-caption muted small-text">
        {caption || `${rootName} to ${rootName}: one column = one semitone = one fret. Tap a column to hear it with the root.`}
      </div>
    </div>
  );
}

