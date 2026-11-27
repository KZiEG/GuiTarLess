import React, { useMemo, useState } from 'react';
import Fretboard from '../components/Fretboard.jsx';
import { Chips, KeyPicker, Section, Callout, Pill, Segmented } from '../components/ui.jsx';
import {
  INTERVALS, KEYS, STRING_NAMES, MAX_FRET, mod12, midiAt, pcAt, intervalClass,
  intervalShapes, describeMove, crossesGB, labelForSemis, spellInterval, stringNumber,
} from '../theory.js';
import { arpeggio, pluck } from '../audio.js';

export default function Intervals() {
  return (
    <div className="page">
      <header className="page-head">
        <div className="kicker">Learn · Lesson 1</div>
        <h1>Intervals</h1>
        <p className="lede">
          An interval is the distance between two notes, counted in <b>semitones</b>. On a guitar that is easy to see:{' '}
          <b>one fret = one semitone</b>. Every chord in Lesson 2 is just a root plus a few of these distances.
        </p>
      </header>
      <OneString />
      <AcrossStrings />
    </div>
  );
}

// ---- Part 1: root to octave on one string ------------------------------

function OneString() {
  const [rootPc, setRootPc] = useState(9); // A
  const [sel, setSel] = useState(7);
  const s = 0;
  const rootFret = mod12(rootPc - pcAt(s, 0));
  const rootName = KEYS[rootPc].name;

  const choose = (n) => {
    setSel(n);
    arpeggio([midiAt(s, rootFret), midiAt(s, rootFret + n)], 0.45);
  };

  const markers = INTERVALS.map((iv) => ({
    s,
    f: rootFret + iv.semis,
    label: iv.label === '8' ? '8' : iv.label,
    cls: intervalClass(iv.semis),
    dim: iv.semis !== sel && iv.semis !== 0,
    pulse: iv.semis === sel,
  }));
  const iv = INTERVALS[sel];

  return (
    <Section kicker="Part 1" title="Root to octave on one string">
      <p>
        Pick a root. Each fret up the low E string adds one semitone, and each distance has a name. Twelve frets later you
        reach the octave: the same note again.
      </p>
      <KeyPicker value={rootPc} onChange={setRootPc} />
      <Fretboard
        fromFret={Math.max(0, rootFret - 1)}
        toFret={rootFret + 12}
        markers={markers}
        shadeStrings={[s]}
        onTap={(ss, f) => ss === s && f >= rootFret && f <= rootFret + 12 && choose(f - rootFret)}
      />

      <div className={`iv-card ${intervalClass(sel)}`}>
        <div className="iv-card-top">
          <Pill semis={sel}>{iv.label}</Pill>
          <div>
            <div className="iv-card-name">{iv.name}</div>
            <div className="muted">
              {sel} semitone{sel === 1 ? '' : 's'} · {sel} fret{sel === 1 ? '' : 's'} up · {rootName} →{' '}
              {spellInterval(rootName, sel)}
            </div>
          </div>
          <button className="btn icon" onClick={() => choose(sel)} aria-label="Play">▶</button>
        </div>
        <p>{iv.sound}</p>
        <p className="muted">{iv.role}</p>
        <div className="step-row">
          <button className="btn ghost" disabled={sel === 0} onClick={() => choose(sel - 1)}>◀ Down</button>
          <button className="btn ghost" disabled={sel === 12} onClick={() => choose(sel + 1)}>Up ▶</button>
        </div>
      </div>

      <div className="iv-table">
        {INTERVALS.map((x) => (
          <button key={x.semis} className={`iv-row ${x.semis === sel ? 'on' : ''}`} onClick={() => choose(x.semis)}>
            <span className="iv-row-semis">{x.semis}</span>
            <Pill semis={x.semis}>{x.label}</Pill>
            <span className="iv-row-name">{x.name}</span>
            <span className="iv-row-note">{spellInterval(rootName, x.semis)}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

// ---- Part 2: the same intervals across strings ---------------------------

const SHAPE_CHOICES = [2, 3, 4, 5, 7, 10, 11, 12];

function AcrossStrings() {
  const [root, setRoot] = useState({ s: 1, f: 5 }); // D on the A string
  const [semis, setSemis] = useState(7);
  const [view, setView] = useState('shape');

  const rootPc = pcAt(root.s, root.f);
  const rootName = KEYS[rootPc].name;
  const shapes = useMemo(() => intervalShapes(root.s, root.f, semis), [root, semis]);

  // The "map" view: every interval around the root, in a hand-sized window.
  const mapMarkers = useMemo(() => {
    const out = [];
    for (let s = 0; s < 6; s++) {
      for (let f = Math.max(0, root.f - 3); f <= Math.min(MAX_FRET, root.f + 4); f++) {
        const n = mod12(pcAt(s, f) - rootPc);
        out.push({ s, f, label: INTERVALS[n].label, cls: intervalClass(n), dim: n !== 0 && n !== mod12(semis) });
      }
    }
    return out;
  }, [root, rootPc, semis]);

  const shapeMarkers = [
    { s: root.s, f: root.f, label: '1', cls: 'iv-root', key: 'root' },
    ...shapes.filter((p) => !(p.s === root.s && p.f === root.f)).map((p) => ({
      s: p.s, f: p.f, label: labelForSemis(semis), cls: intervalClass(semis), key: `t${p.s}`,
    })),
  ];
  const lines = shapes
    .filter((p) => !(p.s === root.s && p.f === root.f))
    .map((p) => ({ from: root, to: p, cls: crossesGB(root.s, p.s) && p.s !== root.s ? 'gb' : '' }));

  const near = shapes.filter((p) => Math.abs(p.stringsUp) <= 3 && Math.abs(p.fretMove) <= 6);
  const iv = INTERVALS[semis];

  return (
    <Section kicker="Part 2" title="Intervals across strings">
      <p>
        You rarely play intervals on one string. Each interval also has a <b>shape</b> across strings, and the shape stays
        the same wherever the root is. Tap the fretboard to move the root.
      </p>
      <Chips
        small
        value={semis}
        onChange={setSemis}
        options={SHAPE_CHOICES.map((n) => ({ value: n, label: INTERVALS[n].label, sub: INTERVALS[n].short, cls: intervalClass(n) }))}
      />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'shape', label: 'Shape' },
          { value: 'map', label: 'All intervals' },
        ]}
      />
      <Fretboard
        fromFret={0}
        toFret={MAX_FRET}
        markers={view === 'shape' ? shapeMarkers : mapMarkers}
        lines={view === 'shape' ? lines : []}
        onTap={(s, f) => {
          setRoot({ s, f });
          pluck(midiAt(s, f));
        }}
      />
      <div className="muted center small-text">
        Root: {rootName} on the {STRING_NAMES[root.s]} string (string {stringNumber(root.s)}), fret {root.f}
      </div>

      <h3>
        {iv.name} ({iv.label}) above {rootName} = {spellInterval(rootName, semis)}
      </h3>
      <div className="shape-list">
        {near
          .sort((a, b) => a.stringsUp - b.stringsUp)
          .map((p) => {
            const gb = p.stringsUp !== 0 && crossesGB(root.s, p.s);
            return (
              <button
                key={p.s}
                className="shape-item"
                onClick={() => arpeggio([midiAt(root.s, root.f), midiAt(p.s, p.f)], 0.45)}
              >
                <span className="shape-str">{STRING_NAMES[p.s]}</span>
                <span className="shape-desc">
                  {describeMove(p.stringsUp, p.fretMove)}
                  {gb && <span className="gb-tag">crosses G→B</span>}
                </span>
                <span className="shape-play">▶</span>
              </button>
            );
          })}
      </div>

      <Callout>
        <b>Why the shapes change at the B string.</b> Neighbouring strings are tuned 5 semitones apart (a perfect 4th),
        except G to B, which is only 4 (a major 3rd). So any shape that crosses from the G string to the B string moves{' '}
        <b>one fret higher</b> to make up the missing semitone. Those links are drawn dashed.
      </Callout>
      <Callout tone="tip">
        <b>Shapes worth memorising</b> (root on the low E or A string; from the D or G string, any shape reaching the B string moves one fret higher):
        <ul>
          <li><b>4th</b>: same fret, next string up.</li>
          <li><b>5th</b>: next string up, 2 frets higher. With the root, that is a power chord.</li>
          <li><b>3</b>: next string up, 1 fret back. <b>♭3</b>: next string up, 2 frets back.</li>
          <li><b>Octave</b>: two strings up, 2 frets higher.</li>
          <li><b>♭7</b>: two strings up, same fret. <b>7</b>: two strings up, 1 fret higher.</li>
        </ul>
      </Callout>
    </Section>
  );
}
