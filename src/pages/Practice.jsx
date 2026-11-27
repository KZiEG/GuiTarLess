import React, { useCallback, useEffect, useRef, useState } from 'react';
import Fretboard from '../components/Fretboard.jsx';
import IntervalRuler from '../components/IntervalRuler.jsx';
import { Chips, KeyPicker, Section, Formula, Segmented, Callout, Pill } from '../components/ui.jsx';
import { INTERVALS, KEYS, PRACTICE_CHORDS, chordById, spellChord, chordSymbol, chordPositions, intervalClass, spellInterval, midiAt, mod12, pcAt } from '../theory.js';
import { AREAS, STRING_SETS, MODES, DEFAULT_SETTINGS, canRun, createSession } from '../practice.js';
import { changeText } from './Chords.jsx';
import { arpeggio, strum, unlockAudio } from '../audio.js';

const STORE = 'guitarless.practice.v1';
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) { /* storage unavailable */ }
  return DEFAULT_SETTINGS;
}
function saveSettings(s) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

export default function Practice({ onLearn }) {
  const [settings, setSettings] = useState(loadSettings);
  const [running, setRunning] = useState(false);
  const set = (patch) => setSettings((s) => {
    const n = { ...s, ...patch };
    saveSettings(n);
    return n;
  });
  const problem = canRun(settings);

  if (running) {
    return <Session settings={settings} onEnd={() => setRunning(false)} onLearn={(f) => { setRunning(false); onLearn(f); }} />;
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="kicker">Practice</div>
        <h1>Set up a session</h1>
        <p className="lede">
          The app shows what to play; you play it on your guitar, then check yourself against the answer. Prop your
          phone up and tap anywhere to move on, or let it run on a timer.
        </p>
      </header>

      <Section title="Key">
        <KeyPicker label="Root" value={settings.root} onChange={(root) => set({ root })} withRandom />
        <KeyOverview settings={settings} />
      </Section>

      <Section title="Chords to focus on">
        <Chips
          multi
          value={settings.chords}
          onChange={(chords) => set({ chords })}
          options={PRACTICE_CHORDS.map((c) => ({ value: c.id, label: c.name, sub: c.semis.map((n) => INTERVALS[n].label).join(' ') }))}
        />
      </Section>

      <Section title="Exercise">
        <div className="mode-list">
          {MODES.map((m) => (
            <button key={m.value} className={`mode ${settings.mode === m.value ? 'on' : ''}`} onClick={() => set({ mode: m.value })}>
              <div className="mode-name">{m.label}</div>
              <div className="mode-desc">{m.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Where on the neck">
        <div className="label">Frets</div>
        <Chips small value={settings.area} onChange={(area) => set({ area })} options={AREAS.map((a) => ({ value: a.value, label: a.label }))} />
        <div className="label">Strings</div>
        <Chips small value={settings.strings} onChange={(strings) => set({ strings })} options={STRING_SETS.map((s) => ({ value: s.value, label: s.label }))} />
      </Section>

      <Section title="Pace and display">
        <div className="label">Time to play before the answer shows</div>
        <Chips
          small
          value={settings.pace}
          onChange={(pace) => set({ pace })}
          options={[
            { value: 0, label: 'Tap to reveal' },
            { value: 5, label: '5 s' },
            { value: 8, label: '8 s' },
            { value: 12, label: '12 s' },
            { value: 20, label: '20 s' },
          ]}
        />
        <div className="label">Answer labels</div>
        <Segmented
          value={settings.labels}
          onChange={(labels) => set({ labels })}
          options={[
            { value: 'iv', label: 'Intervals' },
            { value: 'notes', label: 'Notes' },
          ]}
        />
        <label className="toggle">
          <input type="checkbox" checked={settings.hint} onChange={(e) => set({ hint: e.target.checked })} />
          <span>Show the roots as a hint before the answer</span>
        </label>
      </Section>

      <div className="start-bar">
        {problem && <div className="warn">{problem}</div>}
        <button className="btn big wide" disabled={!!problem} onClick={() => { unlockAudio(); setRunning(true); }}>
          Start practising
        </button>
      </div>
    </div>
  );
}

// Root-to-octave ruler for the chosen key, plus the chosen chords spelled out.
function KeyOverview({ settings }) {
  const random = settings.root === 'random';
  const rootPc = random ? 0 : settings.root;
  const rootName = KEYS[rootPc].name;
  const chords = settings.chords.map(chordById).filter(Boolean);
  const lit = [...new Set(chords.flatMap((c) => c.semis))];
  return (
    <>
      <IntervalRuler
        rootName={rootName}
        highlight={chords.length ? lit : undefined}
        caption={
          random
            ? 'Random root: shown here with C as an example. The intervals are the same in every key; only the note names change.'
            : `${rootName} to ${rootName}, one column per semitone (one fret). Lit columns are the notes used by the chords you picked.`
        }
      />
      {chords.length > 0 && (
        <div className="key-chords">
          {chords.map((c) => {
            const sp = spellChord(rootPc, c);
            return (
              <div key={c.id} className="key-chord">
                <span className="key-chord-sym">{chordSymbol(sp.rootName, c)}</span>
                <Formula semis={c.semis} />
                <span className="key-chord-notes">{sp.notes.join(' ')}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---- Running session --------------------------------------------------

function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock = null;
    let cancelled = false;
    const req = () => navigator.wakeLock.request('screen').then((l) => { if (cancelled) l.release(); else lock = l; }).catch(() => {});
    req();
    const onVis = () => document.visibilityState === 'visible' && req();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}

function Session({ settings, onEnd, onLearn }) {
  const session = useRef(null);
  if (!session.current) session.current = createSession(settings);
  const [card, setCard] = useState(() => session.current.next());
  const [phase, setPhase] = useState('prompt');
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(0);
  useWakeLock(true);

  const timed = settings.pace > 0;
  const revealHold = Math.max(4, Math.round(settings.pace * 0.75));

  const advance = useCallback(() => {
    if (phase === 'prompt') {
      setPhase('reveal');
    } else {
      setCard(session.current.next());
      setDone((d) => d + 1);
      setPhase('prompt');
    }
  }, [phase]);

  useEffect(() => {
    if (!timed || paused) return;
    const ms = (phase === 'prompt' ? settings.pace : revealHold) * 1000;
    const t = setTimeout(advance, ms);
    return () => clearTimeout(t);
  }, [phase, card, paused, timed, settings.pace, revealHold, advance]);

  const stop = (e) => e.stopPropagation();

  const playIt = (e) => {
    stop(e);
    const low = card.strings[0];
    let f = mod12(card.rootPc - pcAt(low, 0));
    while (f < card.lo && f + 12 <= 15) f += 12;
    const root = midiAt(low, f);
    const notes = card.chord.semis.map((n) => root + n);
    arpeggio([...notes, root + 12], 0.28);
    strum(notes, (notes.length + 1) * 0.28 + 0.2);
  };

  return (
    <div className="session" onClick={advance}>
      <div className="session-top" onClick={stop}>
        <button className="btn ghost small" onClick={onEnd}>✕ End</button>
        <div className="session-count">{done} done</div>
        {timed ? (
          <button className="btn ghost small" onClick={() => setPaused((p) => !p)}>{paused ? '▶ Resume' : '❚❚ Pause'}</button>
        ) : <span style={{ width: 70 }} />}
      </div>

      <div className="session-body">
        <PromptHead card={card} />
        {phase === 'prompt' ? (
          <PromptView card={card} settings={settings} />
        ) : (
          <RevealView card={card} settings={settings} />
        )}
      </div>

      <div className="session-foot" onClick={stop}>
        {timed && !paused && (
          <div className="timer">
            <div
              key={`${card.id}-${phase}`}
              className="timer-bar"
              style={{ animationDuration: `${phase === 'prompt' ? settings.pace : revealHold}s` }}
            />
          </div>
        )}
        <div className="session-actions">
          <button className="btn ghost" onClick={playIt}>▶ Hear it</button>
          {phase === 'reveal' && (
            <button className="btn ghost" onClick={(e) => { stop(e); onLearn({ rootPc: card.rootPc, chordId: card.chord.id }); }}>
              Why? Learn this
            </button>
          )}
          <button className="btn" onClick={(e) => { stop(e); advance(); }}>
            {phase === 'prompt' ? 'Show answer' : 'Next ▶'}
          </button>
        </div>
        <div className="tap-hint">Tap anywhere to {phase === 'prompt' ? 'show the answer' : 'go to the next one'}</div>
      </div>
    </div>
  );
}

function PromptHead({ card }) {
  return (
    <div className="prompt-head">
      {card.kind === 'change' ? (
        <div className="prompt-symbol change">
          <span>{card.fromSymbol}</span>
          <span className="arrow">→</span>
          <span>{card.symbol}</span>
        </div>
      ) : (
        <div className="prompt-symbol">{card.symbol}</div>
      )}
      <div className="prompt-formula">
        <Formula semis={card.chord.semis} changed={card.kind === 'change' ? card.added : card.kind === 'target' ? [card.target] : []} />
      </div>
      <div className="prompt-instruction">{card.instruction}</div>
      <div className="prompt-where">
        {card.stringsName === 'all strings' ? 'All strings' : `Strings ${card.stringsName.replace('strings ', '')}`} · Frets {card.lo}–{card.hi}
        {card.seq && <> · {card.seq}</>}
      </div>
    </div>
  );
}

function label(settings, rootName, semis) {
  const iv = INTERVALS[semis].label;
  const note = spellInterval(rootName, semis);
  return settings.labels === 'notes' ? note : iv;
}

function boardRange(card) {
  return [Math.max(0, card.lo - 1), Math.min(15, card.hi + 1)];
}

function PromptView({ card, settings }) {
  const [from, to] = boardRange(card);
  const markers = settings.hint
    ? chordPositions(card.rootPc, { semis: [0] }, { fromFret: card.lo, toFret: card.hi, strings: card.strings }).map((p) => ({
        s: p.s, f: p.f, label: '1', cls: 'iv-root',
      }))
    : [];
  return (
    <div className="prompt-board">
      <Fretboard fromFret={from} toFret={to} fit big markers={markers} shadeStrings={card.strings} shadeFrets={[card.lo, card.hi]} />
      <div className="muted center small-text">Play it on your guitar in the highlighted area</div>
    </div>
  );
}

function RevealView({ card, settings }) {
  const [from, to] = boardRange(card);
  const inSet = (s) => card.strings.includes(s);
  const markers = chordPositions(card.rootPc, card.chord, { fromFret: card.lo, toFret: card.hi }).map((p) => ({
    s: p.s,
    f: p.f,
    cls: intervalClass(p.semis),
    label: label(settings, card.rootName, p.semis),
    dim: !inSet(p.s) || (card.kind === 'target' && p.semis !== card.target),
    pulse: (card.kind === 'target' && p.semis === card.target && inSet(p.s)) || (card.kind === 'change' && card.added.includes(p.semis) && inSet(p.s)),
  }));
  if (card.kind === 'change') {
    for (const n of card.removed) {
      for (const p of chordPositions(card.rootPc, { semis: [n] }, { fromFret: card.lo, toFret: card.hi, strings: card.strings })) {
        markers.push({ s: p.s, f: p.f, label: INTERVALS[n].label, cls: intervalClass(n), ghost: true, key: `g${p.s}-${p.f}` });
      }
    }
  }

  return (
    <div className="prompt-board">
      <Fretboard fromFret={from} toFret={to} fit big markers={markers} shadeStrings={card.strings} shadeFrets={[card.lo, card.hi]} />
      <div className="why">
        {card.kind === 'change' ? (
          <>
            <div className="why-main">{changeText(card.from, card.chord)}</div>
            {card.removed.length > 0 && <div className="muted small-text">Dashed circles: the note you moved away from.</div>}
          </>
        ) : (
          <div className="why-list">
            {card.chord.semis.map((n) => (
              <span key={n} className="why-item">
                <Pill semis={n} /> {spellInterval(card.rootName, n)}
                <span className="muted"> {n === 0 ? 'root' : `${n} frets`}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
