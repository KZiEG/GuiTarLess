import React, { useEffect, useMemo, useState } from 'react';
import Fretboard from '../components/Fretboard.jsx';
import IntervalRuler from '../components/IntervalRuler.jsx';
import { Chips, KeyPicker, Section, Callout, Formula, Segmented, Pill } from '../components/ui.jsx';
import {
  INTERVALS, KEYS, MAX_FRET, chordById, chordPositions, intervalClass, spellChord, chordSymbol,
  identifyChord, midiAt, mod12, pcAt, spellInterval,
} from '../theory.js';
import { arpeggio, strum } from '../audio.js';

// The lesson path: each step changes or adds ONE interval.
export const STEPS = [
  {
    chord: 'power', from: null, title: 'Start: root + 5th',
    text: 'Two notes: the root and the perfect 5th (7 semitones up). This is a power chord. It has no 3rd, so it is neither major nor minor yet.',
  },
  {
    chord: 'major', from: 'power', title: 'Add the major 3rd',
    text: 'Put a major 3rd (4 semitones) between them. Root, 3, 5 is a major triad: bright and settled.',
  },
  {
    chord: 'minor', from: 'major', title: 'Lower the 3rd',
    text: 'Move the 3rd down one fret, to a minor 3rd (3 semitones). One note changes and the chord turns minor: darker.',
  },
  {
    chord: 'sus2', from: 'major', title: 'Replace the 3rd with a 2nd',
    text: 'Take the 3rd out and use the major 2nd instead. Without a 3rd the chord is “suspended”: open and unresolved.',
  },
  {
    chord: 'sus4', from: 'major', title: 'Replace the 3rd with a 4th',
    text: 'Now push the 3rd up one fret to the perfect 4th. Sus4 pulls strongly back toward the major chord.',
  },
  {
    chord: 'maj7', from: 'major', title: 'Add the major 7th',
    text: 'Back to major and add the major 7th, one fret below the octave. Soft and dreamy.',
  },
  {
    chord: 'dom7', from: 'maj7', title: 'Lower the 7th',
    text: 'Drop that 7th one fret to the ♭7 (10 semitones). Major triad + ♭7 is the dominant 7: bluesy, wants to move.',
  },
  {
    chord: 'm7', from: 'dom7', title: 'Lower the 3rd as well',
    text: 'Lower the 3rd of the dominant 7 to ♭3. Minor triad + ♭7 is minor 7: mellow and smooth.',
  },
  { chord: 'build', from: null, title: 'Build your own', text: '' },
];

const WINDOWS = [
  { value: 'neck', label: 'Whole neck' },
  { value: '0', label: 'Frets 0–4' },
  { value: '2', label: '2–6' },
  { value: '5', label: '5–9' },
  { value: '7', label: '7–11' },
  { value: '10', label: '10–14' },
];
const BUILD_CHOICES = [2, 3, 4, 5, 7, 10, 11];

function diff(from, to) {
  if (!from) return { added: to.semis.filter((n) => n !== 0), removed: [] };
  return {
    added: to.semis.filter((n) => !from.semis.includes(n)),
    removed: from.semis.filter((n) => !to.semis.includes(n)),
  };
}

export function changeText(fromChord, toChord) {
  const { added, removed } = diff(fromChord, toChord);
  if (added.length === 1 && removed.length === 1) {
    const d = added[0] - removed[0];
    const dir = d > 0 ? 'up' : 'down';
    return `${INTERVALS[removed[0]].label} → ${INTERVALS[added[0]].label}: that note moves ${Math.abs(d)} fret${Math.abs(d) > 1 ? 's' : ''} ${dir}.`;
  }
  if (added.length && !removed.length) return `Adds the ${added.map((n) => INTERVALS[n].label).join(' and ')}.`;
  return '';
}

export default function Chords({ focus }) {
  const [rootPc, setRootPc] = useState(7); // G
  const [step, setStep] = useState(1);
  const [win, setWin] = useState('neck');
  const [labels, setLabels] = useState('iv');
  const [built, setBuilt] = useState([4, 7]);

  // Arriving from a Practice card ("Learn this")
  useEffect(() => {
    if (!focus) return;
    setRootPc(focus.rootPc);
    const i = STEPS.findIndex((s) => s.chord === focus.chordId);
    if (i >= 0) setStep(i);
    window.scrollTo(0, 0);
  }, [focus]);

  const st = STEPS[step];
  const isBuild = st.chord === 'build';
  const builtChord = useMemo(() => ({ id: 'custom', name: 'Custom', suffix: '', semis: [0, ...[...built].sort((a, b) => a - b)] }), [built]);
  const chord = isBuild ? builtChord : chordById(st.chord);
  const fromChord = st.from ? chordById(st.from) : null;
  const { added, removed } = diff(fromChord, chord);
  const named = isBuild ? identifyChord(chord.semis) : chord;

  const spelled = spellChord(rootPc, named || chord);
  const rootName = spelled.rootName;

  const range = win === 'neck' ? [0, MAX_FRET] : [Number(win), Number(win) + 4];
  const positions = chordPositions(rootPc, chord, { fromFret: range[0], toFret: range[1] });
  const markers = positions.map((p) => ({
    s: p.s,
    f: p.f,
    cls: intervalClass(p.semis),
    label: labels === 'iv' ? INTERVALS[p.semis].label : spellInterval(rootName, p.semis),
    pulse: !isBuild && added.includes(p.semis) && step > 0,
  }));
  // Ghosts: where the removed note used to be.
  if (!isBuild) {
    for (const n of removed) {
      const ghostChord = { semis: [n] };
      for (const p of chordPositions(rootPc, ghostChord, { fromFret: range[0], toFret: range[1] })) {
        markers.push({ s: p.s, f: p.f, label: INTERVALS[n].label, cls: intervalClass(n), ghost: true, key: `g${p.s}-${p.f}` });
      }
    }
  }

  const play = () => {
    const rootMidi = midiAt(0, mod12(rootPc - pcAt(0, 0)));
    const notes = [...chord.semis.map((n) => rootMidi + n), rootMidi + 12];
    arpeggio(notes, 0.3);
    strum(chord.semis.map((n) => rootMidi + n), notes.length * 0.3 + 0.2);
  };

  const symbol = named ? chordSymbol(rootName, named) : '?';

  return (
    <div className="page">
      <header className="page-head">
        <div className="kicker">Learn · Lesson 2</div>
        <h1>Building chords from intervals</h1>
        <p className="lede">
          A chord is a root plus a few intervals. Start with a power chord, then change <b>one interval at a time</b> and
          watch what moves on the fretboard.
        </p>
      </header>

      <Section>
        <div className="label">Root</div>
        <KeyPicker value={rootPc} onChange={setRootPc} />
        <IntervalRuler
          rootName={rootName}
          highlight={chord.semis}
          changed={isBuild ? [] : added}
          caption={`${rootName} to ${rootName}, one column per semitone (one fret). Lit columns are the notes of ${symbol}. Tap a column to hear it with the root.`}
        />

        <div className="steps">
          {STEPS.map((s, i) => (
            <button key={s.chord} className={`step ${i === step ? 'on' : ''}`} onClick={() => setStep(i)}>
              <span className="step-n">{i + 1}</span>
              {s.chord === 'build' ? 'Build' : chordById(s.chord).name}
            </button>
          ))}
        </div>

        <div className="chord-card">
          <div className="chord-card-head">
            <div>
              <div className="kicker">Step {step + 1} · {st.title}</div>
              <div className="chord-symbol">{symbol}</div>
              <div className="muted">{named ? `${rootName} ${named.name.toLowerCase()}` : 'Not one of the chords in this lesson'}</div>
              {named && rootName !== KEYS[rootPc].name && (
                <div className="respell">
                  Same notes as {KEYS[rootPc].name}{named.suffix}, but usually written {symbol} because it reads more easily.
                </div>
              )}
            </div>
            <button className="btn icon big" onClick={play} aria-label="Play chord">▶</button>
          </div>

          {isBuild ? (
            <>
              <p>Turn intervals on and off. The root is always there. When your set matches a chord, its name appears.</p>
              <Chips
                multi
                small
                value={built}
                onChange={setBuilt}
                options={BUILD_CHOICES.map((n) => ({ value: n, label: INTERVALS[n].label, sub: INTERVALS[n].short, cls: intervalClass(n) }))}
              />
            </>
          ) : (
            <p>{st.text}</p>
          )}

          <div className="formula-row">
            <Formula semis={chord.semis} changed={isBuild ? [] : added} showSemis />
            {!isBuild && removed.length > 0 && (
              <div className="removed">
                replaces {removed.map((n) => <Pill key={n} semis={n} ghost />)}
              </div>
            )}
          </div>
          <div className="notes-line">
            {chord.semis.map((n) => spellInterval(rootName, n)).join(' · ')}
            <span className="muted"> &nbsp;({chord.semis.join(' – ')} semitones)</span>
          </div>
          {!isBuild && fromChord && <div className="change-line">{changeText(fromChord, chord)}</div>}
        </div>

        <div className="toolbar">
          <Segmented
            value={labels}
            onChange={setLabels}
            options={[
              { value: 'iv', label: 'Intervals' },
              { value: 'notes', label: 'Notes' },
            ]}
          />
        </div>
        <Chips small value={win} onChange={setWin} options={WINDOWS} />
        <Fretboard fromFret={range[0] === 0 ? 0 : range[0] - 1} toFret={range[1]} markers={markers} fit={win !== 'neck'} />
        {!isBuild && removed.length > 0 && (
          <div className="muted small-text center">Dashed circles show where the note it replaces used to be.</div>
        )}

        <div className="step-row">
          <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>◀ Back</button>
          <button className="btn" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Next step ▶</button>
        </div>
      </Section>

      <Section title="Every chord in one table">
        <div className="chord-table">
          {STEPS.filter((s) => s.chord !== 'build').map((s, i) => {
            const c = chordById(s.chord);
            return (
              <button key={c.id} className="chord-table-row" onClick={() => { setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <span className="chord-table-name">{c.name}</span>
                <Formula semis={c.semis} />
              </button>
            );
          })}
        </div>
        <Callout tone="tip">
          Notice the pattern: the <b>3rd</b> decides major or minor, the <b>5th</b> is in every chord, sus chords swap the
          3rd for a 2 or 4, and the <b>7th</b> adds a fourth note on top.
        </Callout>
      </Section>
    </div>
  );
}
