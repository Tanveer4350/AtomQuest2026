import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const states = ['off', 'low', 'medium', 'high', 'maximum'];

function App() {
  const [inputs, setInputs] = useState({ temperature_c: 28, humidity_percent: 65, occupied: true, quiet_hours: false, feedback: null, apply_feedback: true });
  const [decision, setDecision] = useState(null);
  const [history, setHistory] = useState([]);
  const [energy, setEnergy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API}/api/history?limit=12`);
      if (!response.ok) throw new Error('Could not load decision history.');
      setHistory(await response.json());
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { loadHistory(); }, []);
  useEffect(() => {
    fetch(`${API}/api/energy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours: 5 }) })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Energy estimate unavailable.')))
      .then(setEnergy).catch(() => setEnergy(null));
  }, []);

  const recommend = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API}/api/recommendations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inputs) });
      if (!response.ok) throw new Error('The API rejected this simulation. Check the input values.');
      setDecision(await response.json()); await loadHistory();
    } catch (e) { setError(`${e.message} Is the backend running on port 8000?`); }
    finally { setLoading(false); }
  };
  const update = (key, value) => setInputs((current) => ({ ...current, [key]: value }));
  const currentState = decision?.recommendation?.state || 'off';
  const stateIndex = states.indexOf(currentState);

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">◌</span><span>Fan<span className="accent">IQ</span></span></div><div className="live-pill"><span className="pulse" /> SIMULATOR ONLINE</div></header>
    <main className="content">
      <section className="hero"><div><p className="eyebrow">SMART HOME / TRACK 01</p><h1>Climate intelligence,<br /><span className="accent">made visible.</span></h1><p className="lede">Simulate room conditions and let FanIQ recommend an explainable, comfort-aware airflow setting in real time.</p></div><div className="hero-stat"><strong>5</strong><span>FAN STATES<br />AVAILABLE</span></div></section>
      {error && <div className="alert">{error}</div>}
      <div className="dashboard-grid">
        <section className="panel controls"><div className="panel-heading"><div><p className="eyebrow">VIRTUAL ROOM</p><h2>Room conditions</h2></div><span className="badge">LIVE INPUT</span></div>
          <div className="metric-row"><label><span>Temperature</span><strong>{inputs.temperature_c.toFixed(1)}<small>°C</small></strong><input type="range" min="-10" max="60" step="0.5" value={inputs.temperature_c} onChange={(e) => update('temperature_c', Number(e.target.value))} /></label><label><span>Humidity</span><strong>{inputs.humidity_percent}<small>%</small></strong><input type="range" min="0" max="100" value={inputs.humidity_percent} onChange={(e) => update('humidity_percent', Number(e.target.value))} /></label></div>
          <div className="toggle-list"><button className={`toggle ${inputs.occupied ? 'active' : ''}`} onClick={() => update('occupied', !inputs.occupied)}><span className="toggle-dot" /><span><b>Room occupied</b><small>Occupancy-aware automation</small></span><i>{inputs.occupied ? 'ON' : 'OFF'}</i></button><button className={`toggle ${inputs.quiet_hours ? 'active' : ''}`} onClick={() => update('quiet_hours', !inputs.quiet_hours)}><span className="toggle-dot" /><span><b>Quiet hours</b><small>Cap airflow at low speed</small></span><i>{inputs.quiet_hours ? 'ON' : 'OFF'}</i></button></div>
          <button className="primary-button" onClick={recommend} disabled={loading}>{loading ? 'Evaluating...' : 'Evaluate conditions  →'}</button>
        </section>
        <section className={`panel recommendation state-${currentState}`}><div className="panel-heading"><div><p className="eyebrow">AUTOMATION DECISION</p><h2>Recommended state</h2></div><span className="live-label">● REAL TIME</span></div><div className="fan-visual"><div className="fan-ring"><div className="fan-blades">✣</div></div><div><span className="state-label">{currentState.toUpperCase()}</span><p>{decision?.recommendation?.explanation || 'Run an evaluation to generate a recommendation.'}</p></div></div><div className="state-scale">{states.map((state, index) => <span className={index <= stateIndex ? 'filled' : ''} key={state}><i />{state}</span>)}</div>{decision && <div className="rule-note"><b>Why this result</b><span>{decision.recommendation.rules_triggered.map((rule) => rule.replaceAll('_', ' ')).join('  ·  ')}</span></div>}</section>
      </div>
      <section className="lower-grid"><section className="panel feedback"><div className="panel-heading"><div><p className="eyebrow">PERSONALISATION</p><h2>How does it feel?</h2></div><span className="badge">OPTIONAL</span></div><p className="muted">Feedback adjusts the next recommendation within safe, explainable limits.</p><div className="feedback-actions">{[['too_cool','Too cool','↓'],['comfortable','Comfortable','✓'],['too_warm','Too warm','↑']].map(([value, label, icon]) => <button className={inputs.feedback === value ? 'selected' : ''} key={value} onClick={() => update('feedback', inputs.feedback === value ? null : value)}><strong>{icon}</strong><span>{label}</span></button>)}</div></section><section className="panel history"><div className="panel-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Recent decisions</h2></div><span className="count">{history.length} logged</span></div>{history.length === 0 ? <p className="muted empty">Your decisions will appear here.</p> : <div className="history-list">{history.slice(0, 5).map((item) => <div className="history-item" key={item.id}><span className={`history-dot dot-${item.recommendation.state}`} /><span><b>{item.recommendation.state}</b><small>{item.temperature_c}°C · {item.humidity_percent}% humidity</small></span><time>{new Date(item.recommendation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>)}</div>}</section></section>
      <section className="panel energy-panel"><div className="panel-heading"><div><p className="eyebrow">SCENARIO ANALYSIS</p><h2>Estimated energy use</h2></div><span className="badge">5 HOUR SCENARIO</span></div><div className="energy-content"><div><strong>{energy ? energy.estimates[currentState] : '—'}</strong><span>kWh at current state</span></div><div className="energy-bars">{states.slice(1).map((state) => <div className="energy-bar" key={state}><span>{state}</span><i><b style={{ width: `${(energy?.estimates[state] || 0) / 0.35 * 100}%` }} /></i><small>{energy?.estimates[state] ?? '—'}</small></div>)}</div></div><p className="assumption">{energy?.assumptions || 'Power assumptions are loaded from the backend.'}</p></section>
      <footer><span>FanIQ v1.0</span><span>Software simulation · Energy values are estimates, not measurements.</span></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
