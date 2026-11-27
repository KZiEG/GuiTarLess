# GuiTarLess

Learn guitar theory and practise it on the instrument, with each lesson tied directly to what you play.

**Live app:** https://kzieg.github.io/guitarless/ (add it to your Home Screen to use it like an app, even offline)

## What's in it

**Learn 1 – Intervals**
- *Root to octave on one string*: pick a root and step through all 13 intervals (root, ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7, octave), each with its semitone count, sound and role in chords. One fret = one semitone.
- *Intervals across strings*: tap anywhere to place a root and see each interval's shape on the other strings, including why shapes move up a fret when they cross from the G string to the B string. "All intervals" maps every interval around the root.

**Learn 2 – Building chords from intervals**
Start with root + 5th (a power chord) and change one interval at a time: major (1 3 5), minor (1 ♭3 5), sus2 (1 2 5), sus4 (1 4 5), major 7 (1 3 5 7), dominant 7 (1 3 5 ♭7), minor 7 (1 ♭3 5 ♭7). Each step shows what changed on the whole neck or in one position. Finish by building your own chord from interval toggles.

**Practice**
Pick a root (or random), the chords to focus on, the area of the neck and the strings. The app shows a prompt, you play it on your guitar, then it reveals the answer with every note labelled by interval. Hands-free: tap anywhere to move on, or set a timer. Modes:
- *Chord tones*: play every chord tone in the area, or find just one interval (e.g. every ♭3).
- *Change one note*: play one chord, then move a single note to turn it into another (e.g. G → Gsus4).
- *Move it around*: the same chord in four positions up the neck.

"Why? Learn this" on any answer jumps to that chord in Lesson 2.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run icons    # redraw the app icons (Python + Pillow)
```

| File | What it does |
|---|---|
| `src/theory.js` | Intervals, chord formulas, note spelling, fretboard maths. |
| `src/practice.js` | Practice session engine: turns the settings into prompt cards. |
| `src/audio.js` | Synthesized plucked-string sound (no samples). |
| `src/components/Fretboard.jsx` | The SVG fretboard used everywhere. |
| `src/pages/` | Intervals, Chords and Practice screens. |
| `public/sw.js`, `public/manifest.webmanifest` | Home Screen / offline support. |

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
