import React from 'react';
import { KEYS, INTERVALS, intervalClass } from '../theory.js';

export function Chips({ options, value, onChange, multi = false, small = false }) {
  const isOn = (v) => (multi ? value.includes(v) : value === v);
  const click = (v) => {
    if (!multi) return onChange(v);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className={`chips ${small ? 'small' : ''}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={`chip ${isOn(o.value) ? 'on' : ''} ${o.cls || ''}`}
          onClick={() => click(o.value)}
          disabled={o.disabled}
        >
          {o.label}
          {o.sub && <span className="chip-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

export function KeyPicker({ value, onChange, withRandom = false, label = 'Root (key)' }) {
  return (
    <label className="select-wrap">
      <span className="select-label">{label}</span>
      <select
        className="select"
        value={String(value)}
        onChange={(e) => onChange(e.target.value === 'random' ? 'random' : Number(e.target.value))}
      >
        {KEYS.map((k) => (
          <option key={k.pc} value={k.pc}>
            {k.name}
          </option>
        ))}
        {withRandom && <option value="random">Random (changes every card)</option>}
      </select>
    </label>
  );
}

export function Pill({ semis, changed, ghost, children }) {
  return (
    <span className={`pill ${intervalClass(semis)} ${changed ? 'changed' : ''} ${ghost ? 'ghost' : ''}`}>
      {children ?? INTERVALS[semis].label}
    </span>
  );
}

export function Formula({ semis, changed = [], showSemis = false }) {
  return (
    <div className="formula">
      {semis.map((n) => (
        <div key={n} className="formula-item">
          <Pill semis={n} changed={changed.includes(n)} />
          {showSemis && <span className="formula-semis">{n}</span>}
        </div>
      ))}
    </div>
  );
}

export function Section({ title, kicker, children }) {
  return (
    <section className="section">
      {kicker && <div className="kicker">{kicker}</div>}
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function Callout({ children, tone = 'info' }) {
  return <div className={`callout ${tone}`}>{children}</div>;
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
