import React, { useEffect, useState } from 'react';
import Intervals from './pages/Intervals.jsx';
import Chords from './pages/Chords.jsx';
import Practice from './pages/Practice.jsx';

const TABS = [
  { id: 'intervals', label: 'Intervals', icon: '↔', sub: 'Learn 1' },
  { id: 'chords', label: 'Chords', icon: '◎', sub: 'Learn 2' },
  { id: 'practice', label: 'Practice', icon: '♪', sub: 'Play' },
];

const fromHash = () => {
  const h = window.location.hash.replace('#', '');
  return TABS.some((t) => t.id === h) ? h : 'intervals';
};

export default function App() {
  const [tab, setTab] = useState(fromHash);
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    const onHash = () => setTab(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id) => {
    window.location.hash = id;
    setTab(id);
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          Gui<span>Tar</span>Less
        </div>
        <div className="brand-sub">intervals → chords → the neck</div>
      </header>

      <main>
        {tab === 'intervals' && <Intervals />}
        {tab === 'chords' && <Chords focus={focus} />}
        {tab === 'practice' && (
          <Practice
            onLearn={(f) => {
              setFocus({ ...f, t: Date.now() });
              go('chords');
            }}
          />
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
            <span className="tab-sub">{t.sub}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
