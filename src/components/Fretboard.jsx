import React from 'react';
import { STRING_NAMES } from '../theory.js';

const OPEN_W = 34;
const FRET_W = 56;
const STRING_H = 30;
const PAD_T = 16;
const PAD_B = 24;
const PAD_L = 22;
const PAD_R = 8;
const INLAYS = [3, 5, 7, 9, 15];

/**
 * Horizontal fretboard. High e on top, low E at the bottom.
 *
 * markers: [{ s, f, label, cls, dim, ghost, pulse, key }]
 * lines:   [{ from: {s,f}, to: {s,f}, cls }]
 * shadeStrings: string indices to highlight as the "area"
 * shadeFrets: [lo, hi] fret range to highlight as the "area"
 */
export default function Fretboard({
  fromFret = 0,
  toFret = 12,
  markers = [],
  lines = [],
  onTap,
  shadeStrings,
  shadeFrets,
  fit = false,
  big = false,
}) {
  const cols = [];
  let x = PAD_L;
  for (let f = fromFret; f <= toFret; f++) {
    const w = f === 0 ? OPEN_W : FRET_W;
    cols.push({ f, x, w, cx: x + w / 2 });
    x += w;
  }
  const width = x + PAD_R;
  const height = PAD_T + STRING_H * 5 + PAD_B;
  const yOf = (s) => PAD_T + (5 - s) * STRING_H;
  const col = (f) => cols.find((c) => c.f === f);
  const boardLeft = cols[0].f === 0 ? cols[0].x + cols[0].w : cols[0].x;
  const boardRight = cols[cols.length - 1].x + cols[cols.length - 1].w;
  const midY = PAD_T + STRING_H * 2.5;

  const tap = (s, f) => onTap && onTap(s, f);

  return (
    <div className={`fretboard-wrap ${fit ? 'fit' : ''} ${big ? 'big' : ''}`}>
      <svg
        className="fretboard"
        viewBox={`0 0 ${width} ${height}`}
        style={fit ? { width: '100%' } : { width, minWidth: width }}
        role="img"
        aria-label={`Fretboard, frets ${fromFret} to ${toFret}`}
      >
        {/* Wood */}
        <rect className="fb-wood" x={boardLeft} y={PAD_T - 8} width={boardRight - boardLeft} height={STRING_H * 5 + 16} rx="3" />

        {/* Practice area */}
        {shadeFrets && shadeStrings && (() => {
          const lo = col(Math.max(shadeFrets[0], fromFret));
          const hi = col(Math.min(shadeFrets[1], toFret));
          if (!lo || !hi) return null;
          const top = Math.max(...shadeStrings);
          const bot = Math.min(...shadeStrings);
          return (
            <rect
              className="fb-area"
              x={lo.x + 2}
              y={yOf(top) - STRING_H / 2 + 3}
              width={hi.x + hi.w - lo.x - 4}
              height={(top - bot + 1) * STRING_H - 6}
              rx="8"
            />
          );
        })()}

        {/* Inlays */}
        {cols.map(({ f, cx }) =>
          f === 12 ? (
            <g key={`in${f}`}>
              <circle className="fb-inlay" cx={cx} cy={PAD_T + STRING_H * 1.5} r="5" />
              <circle className="fb-inlay" cx={cx} cy={PAD_T + STRING_H * 3.5} r="5" />
            </g>
          ) : INLAYS.includes(f) ? (
            <circle key={`in${f}`} className="fb-inlay" cx={cx} cy={midY} r="5" />
          ) : null,
        )}

        {/* Fret wires */}
        {cols.map(({ f, x, w }) => (
          <line
            key={`w${f}`}
            className={f === 0 ? 'fb-nut' : 'fb-wire'}
            x1={x + w}
            x2={x + w}
            y1={PAD_T - 8}
            y2={PAD_T + STRING_H * 5 + 8}
          />
        ))}
        {cols[0].f > 1 && (
          <line className="fb-wire" x1={cols[0].x} x2={cols[0].x} y1={PAD_T - 8} y2={PAD_T + STRING_H * 5 + 8} />
        )}

        {/* Strings */}
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <g key={`s${s}`}>
            <line
              className={`fb-string ${shadeStrings && !shadeStrings.includes(s) ? 'off' : ''}`}
              x1={cols[0].x}
              x2={boardRight}
              y1={yOf(s)}
              y2={yOf(s)}
              strokeWidth={1 + (5 - s) * 0.35}
            />
            <text className="fb-strname" x={PAD_L - 12} y={yOf(s) + 4}>
              {STRING_NAMES[s]}
            </text>
          </g>
        ))}

        {/* Fret numbers */}
        {cols.map(({ f, cx }) => (
          <text key={`n${f}`} className={`fb-fretnum ${INLAYS.includes(f) || f === 12 ? 'strong' : ''}`} x={cx} y={height - 6}>
            {f}
          </text>
        ))}

        {/* Tap targets */}
        {onTap &&
          cols.map(({ f, x, w }) =>
            [0, 1, 2, 3, 4, 5].map((s) => (
              <rect
                key={`t${s}-${f}`}
                className="fb-tap"
                x={x}
                y={yOf(s) - STRING_H / 2}
                width={w}
                height={STRING_H}
                onClick={() => tap(s, f)}
              />
            )),
          )}

        {/* Lines (interval shapes) */}
        {lines.map((l, i) => {
          const a = col(l.from.f);
          const b = col(l.to.f);
          if (!a || !b) return null;
          return (
            <line
              key={`l${i}`}
              className={`fb-link ${l.cls || ''}`}
              x1={a.cx}
              y1={yOf(l.from.s)}
              x2={b.cx}
              y2={yOf(l.to.s)}
            />
          );
        })}

        {/* Markers */}
        {markers.map((m) => {
          const c = col(m.f);
          if (!c) return null;
          return (
            <g
              key={m.key || `m${m.s}-${m.f}`}
              className={`fb-dot ${m.cls || ''} ${m.dim ? 'dim' : ''} ${m.ghost ? 'ghost' : ''} ${m.pulse ? 'pulse' : ''}`}
              transform={`translate(${c.cx} ${yOf(m.s)})`}
              onClick={onTap ? () => tap(m.s, m.f) : undefined}
            >
              <circle r="12.5" />
              {m.label != null && (
                <text y="4" className={String(m.label).length > 2 ? 'small' : ''}>
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
