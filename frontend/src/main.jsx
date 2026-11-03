import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_BASE_URL || '';
const states = ['off', 'low', 'medium', 'high', 'maximum'];
const DEMO_FANS = [
  { id: 'FNIQ-1042', name: 'Living room fan', model: 'AeroSense X2', signal: -48, battery: 86, temperature: 27.4, humidity: 61, rpm: 742, state: 'medium', lastSeen: 'just now' },
  { id: 'FNIQ-2077', name: 'Bedroom fan', model: 'Breeze Mini', signal: -61, battery: 64, temperature: 25.8, humidity: 55, rpm: 410, state: 'low', lastSeen: 'just now' },
  { id: 'FNIQ-3319', name: 'Study fan', model: 'AeroSense X2', signal: -74, battery: 92, temperature: 29.1, humidity: 68, rpm: 1018, state: 'high', lastSeen: 'just now' },
];
const DEMO_HISTORY = Array.from({ length: 12 }, (_, index) => {
  const statesForDay = ['low', 'medium', 'medium', 'high', 'high', 'medium', 'low', 'off', 'low', 'medium', 'high', 'medium'];
  const state = statesForDay[index];
  const temperature = Number((24.2 + Math.sin(index * 0.65) * 4.1 + (index > 7 ? 1.2 : 0)).toFixed(1));
  const humidity = Math.round(54 + Math.cos(index * 0.7) * 13);
  const createdAt = new Date(Date.now() - (12 - index) * 2 * 60 * 60 * 1000).toISOString();
  return {
    id: -(index + 1), demo: true, temperature_c: temperature, humidity_percent: humidity, occupied: state !== 'off',
    quiet_hours: index === 7, feedback: null, recommendation: {
      state, base_state: state, explanation: 'Generated historical demo decision for trend analysis.',
      rules_triggered: [temperature >= 29 ? 'warm' : 'moderate_temperature'], feedback_applied: null, created_at: createdAt,
    },
  };
});

function App() {
  const [inputs, setInputs] = useState({ temperature_c: 28, humidity_percent: 65, occupied: true, quiet_hours: false, feedback: null, apply_feedback: true });
  const [decision, setDecision] = useState(null);
  const [history, setHistory] = useState(DEMO_HISTORY);
  const [energy, setEnergy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realtime, setRealtime] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [bluetoothServices, setBluetoothServices] = useState([]);
  const [writableCharacteristic, setWritableCharacteristic] = useState(null);
  const [bluetoothMessage, setBluetoothMessage] = useState('');
  const [now, setNow] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherMessage, setWeatherMessage] = useState('');
  const [weatherLocation, setWeatherLocation] = useState('');
  const [fakeFans, setFakeFans] = useState(DEMO_FANS);
  const [fakeScanState, setFakeScanState] = useState('complete');
  const [selectedFakeFan, setSelectedFakeFan] = useState(DEMO_FANS[0]);
  const [simulationActive, setSimulationActive] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!simulationActive) return undefined;
    const timer = setInterval(() => {
      setFakeFans((current) => {
        const tick = Date.now() / 10000;
        const updated = current.map((fan, index) => {
          const wave = Math.sin(tick + index * 1.7);
          const temperature = Number((fan.temperature + wave * 0.12).toFixed(1));
          const humidity = Math.max(0, Math.min(100, Math.round(fan.humidity + Math.cos(tick + index) * 0.4)));
          const rpm = Math.max(0, Math.round(fan.rpm + wave * 18));
          return { ...fan, temperature, humidity, rpm, lastSeen: 'just now' };
        });
        setSelectedFakeFan((selected) => selected ? updated.find((fan) => fan.id === selected.id) || updated[0] : updated[0]);
        const primary = updated[0];
        setInputs((currentInputs) => ({
          ...currentInputs,
          temperature_c: primary.temperature,
          humidity_percent: primary.humidity,
        }));
        return updated;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [simulationActive]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API}/api/history?limit=12`);
      if (!response.ok) throw new Error('Could not load decision history.');
      const liveHistory = await response.json();
      setHistory([...liveHistory, ...DEMO_HISTORY.filter((demo) => !liveHistory.some((item) => item.id === demo.id))].slice(0, 20));
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { loadHistory(); }, []);
  useEffect(() => {
    const socketBase = API
      ? API.replace(/^http/, 'ws')
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    const socketUrl = `${socketBase}/api/realtime`;
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;
    socket.onopen = () => setRealtime(true);
    socket.onclose = () => setRealtime(false);
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'recommendation') {
        setDecision(message.data);
        setHistory((current) => [message.data, ...current.filter((item) => item.id !== message.data.id)].slice(0, 12));
      }
    };
    return () => { socket.close(); socketRef.current = null; };
  }, []);
  useEffect(() => {
    fetch(`${API}/api/energy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours: 5 }) })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Energy estimate unavailable.')))
      .then(setEnergy).catch(() => setEnergy(null));
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => recommend(), 350);
    return () => clearTimeout(timer);
  }, [inputs.temperature_c, inputs.humidity_percent, inputs.occupied, inputs.quiet_hours, inputs.feedback]);

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
  const fetchLiveWeather = () => {
    if (!navigator.geolocation) {
      setWeatherMessage('Location is unavailable on this device.');
      return;
    }
    setWeatherLoading(true);
    setWeatherMessage('Requesting your location...');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const query = new URLSearchParams({
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
          current: 'temperature_2m,relative_humidity_2m',
          timezone: 'auto',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
        if (!response.ok) throw new Error('Weather service is unavailable.');
        const data = await response.json();
        const temperature = Number(data.current?.temperature_2m);
        const humidity = Number(data.current?.relative_humidity_2m);
        if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) throw new Error('Live weather data was incomplete.');
        update('temperature_c', temperature);
        update('humidity_percent', humidity);
        setWeatherLocation(data.timezone || 'your location');
        setWeatherMessage(`Live conditions updated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
      } catch (e) {
        setWeatherMessage(e.message);
      } finally {
        setWeatherLoading(false);
      }
    }, (error) => {
      setWeatherLoading(false);
      setWeatherMessage(error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. Allow it in your browser to fetch live conditions.'
        : 'Could not determine your location.');
    }, { enableHighAccuracy: false, timeout: 10000 });
  };
  const connectBluetooth = async () => {
    if (!navigator.bluetooth) {
      setBluetoothMessage('Web Bluetooth is unavailable. Use Chrome or Edge over HTTPS (or localhost).');
      return;
    }
    try {
      setBluetoothMessage('Choose an Atomberg fan in the browser dialog...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'Atomberg' }],
        optionalServices: ['battery_service', 'device_information'],
      });
      device.addEventListener('gattserverdisconnected', () => {
        setBluetoothDevice(null);
        setBluetoothServices([]);
        setWritableCharacteristic(null);
        setBluetoothMessage('Fan disconnected.');
      });
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      const discovered = [];
      const writable = [];
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        discovered.push({
          uuid: service.uuid,
          characteristics: characteristics.map((characteristic) => ({
            uuid: characteristic.uuid,
            properties: Object.keys(characteristic.properties).filter((key) => characteristic.properties[key]),
            characteristic,
          })),
        });
        for (const characteristic of characteristics) {
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            writable.push({ serviceUuid: service.uuid, characteristic });
          }
          if (characteristic.properties.notify || characteristic.properties.indicate) {
            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
              const value = event.target.value;
              const bytes = new Uint8Array(value.buffer);
              setBluetoothMessage(`Telemetry received: ${Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join(' ')}`);
            });
          }
        }
      }
      setBluetoothDevice(device);
      setBluetoothServices(discovered.map((service) => ({
        ...service,
        characteristics: service.characteristics.map(({ characteristic: _, ...metadata }) => metadata),
      })));
      setWritableCharacteristic(writable[0] || null);
      setBluetoothMessage(writable.length
        ? `${device.name || 'BLE device'} connected. A writable BLE characteristic was found, but no Atomberg command protocol is known.`
        : `${device.name || 'BLE device'} connected. No writable control characteristic was advertised.`);
    } catch (e) {
      if (e.name !== 'NotFoundError') setBluetoothMessage(`Bluetooth connection failed: ${e.message}`);
    }
  };
  const disconnectBluetooth = () => {
    if (bluetoothDevice?.gatt?.connected) bluetoothDevice.gatt.disconnect();
    setBluetoothDevice(null);
    setBluetoothServices([]);
    setWritableCharacteristic(null);
  };
  const scanFakeFans = () => {
    setFakeScanState('scanning');
    setSelectedFakeFan(null);
    setFakeFans([]);
    window.setTimeout(() => {
      setFakeFans(DEMO_FANS);
      setFakeScanState('complete');
      setSelectedFakeFan(DEMO_FANS[0]);
    }, 900);
  };
  const currentState = decision?.recommendation?.state || 'off';
  const stateIndex = states.indexOf(currentState);
  const analysisHistory = history.filter((item) => item.demo || item.recommendation);
  const averageTemperature = analysisHistory.length
    ? (analysisHistory.reduce((total, item) => total + item.temperature_c, 0) / analysisHistory.length).toFixed(1)
    : '—';
  const averageHumidity = analysisHistory.length
    ? Math.round(analysisHistory.reduce((total, item) => total + item.humidity_percent, 0) / analysisHistory.length)
    : '—';
  const activeHours = analysisHistory.filter((item) => item.recommendation.state !== 'off').length;
  const highAirflowHours = analysisHistory.filter((item) => ['high', 'maximum'].includes(item.recommendation.state)).length;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">◌</span><span>Fan<span className="accent">IQ</span></span></div><div className="header-status"><time dateTime={now.toISOString()}>{now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time><div className="live-pill"><span className="pulse" /> {online ? (realtime ? 'REALTIME ONLINE' : 'CONNECTING...') : 'DEVICE OFFLINE'}</div></div></header>
    <main className="content">
      <section className="hero"><div><p className="eyebrow">SMART HOME / TRACK 01</p><h1>Climate intelligence,<br /><span className="accent">made visible.</span></h1><p className="lede">Simulate room conditions and let FanIQ recommend an explainable, comfort-aware airflow setting in real time.</p></div><div className="hero-stat"><strong>5</strong><span>FAN STATES<br />AVAILABLE</span></div></section>
      {error && <div className="alert">{error}</div>}
      <section className="panel bluetooth-panel"><div className="panel-heading"><div><p className="eyebrow">DEVICE LINK</p><h2>Nearby Atomberg fan</h2></div><span className={`badge ${bluetoothDevice ? 'connected-badge' : ''}`}>{bluetoothDevice ? 'CONNECTED' : navigator.bluetooth ? 'BLUETOOTH READY' : 'BROWSER ONLY'}</span></div><p className="muted">Connect from a secure browser session to inspect BLE services. Control is enabled only for a documented model protocol; FanIQ never sends guessed bytes to a motor controller.</p><div className="bluetooth-actions"><button className="primary-button" onClick={bluetoothDevice ? disconnectBluetooth : connectBluetooth}>{bluetoothDevice ? 'Disconnect fan' : 'Scan and connect  →'}</button>{bluetoothDevice && <span className="device-name">{bluetoothDevice.name || 'BLE device'} · {bluetoothServices.reduce((count, service) => count + service.characteristics.length, 0)} characteristics</span>}</div>{bluetoothMessage && <p className="bluetooth-message">{bluetoothMessage}</p>}{bluetoothDevice && writableCharacteristic && <p className="bluetooth-message">Writable characteristic found ({writableCharacteristic.characteristic.uuid}); model command mapping is required before control can be enabled.</p>}<div className="fake-scan"><div className="fake-scan-heading"><div><p className="eyebrow">DEMO MODE</p><h3>Simulated fan scan <span className="live-dot" /></h3></div><span className="badge">{fakeScanState === 'scanning' ? 'SCANNING...' : `${fakeFans.length} LIVE`}</span></div><p className="muted">Live demo telemetry is ready with generated fan data. No Bluetooth permission or hardware is required.</p><div className="demo-controls"><button className="secondary-button" onClick={scanFakeFans} disabled={fakeScanState === 'scanning'}>{fakeScanState === 'scanning' ? 'Searching nearby devices...' : 'Rescan simulated devices  →'}</button><button className={`simulation-toggle ${simulationActive ? 'active' : ''}`} onClick={() => setSimulationActive((active) => !active)}>{simulationActive ? 'Pause live feed' : 'Resume live feed'}</button></div>{fakeFans.length > 0 && <div className="fake-fan-list">{fakeFans.map((fan) => <button className={`fake-fan ${selectedFakeFan?.id === fan.id ? 'selected' : ''}`} key={fan.id} onClick={() => setSelectedFakeFan(fan)}><span className="fan-status" /><span className="fake-fan-main"><b>{fan.name}</b><small>{fan.model} · {fan.id}</small></span><span className="fake-fan-signal">{fan.signal} dBm</span></button>)}</div>}{selectedFakeFan && <div className="telemetry-grid"><span><b>{selectedFakeFan.temperature}°C</b><small>temperature</small></span><span><b>{selectedFakeFan.humidity}%</b><small>humidity</small></span><span><b>{selectedFakeFan.rpm}</b><small>RPM</small></span><span><b>{selectedFakeFan.battery}%</b><small>battery</small></span></div>}</div></section>
      <div className="dashboard-grid">
        <section className="panel controls"><div className="panel-heading"><div><p className="eyebrow">VIRTUAL ROOM</p><h2>Room conditions</h2></div><span className="badge">LIVE INPUT</span></div>
          <div className="metric-row"><label><span>Temperature</span><strong>{inputs.temperature_c.toFixed(1)}<small>°C</small></strong><input type="range" min="-10" max="60" step="0.5" value={inputs.temperature_c} onChange={(e) => update('temperature_c', Number(e.target.value))} /></label><label><span>Humidity</span><strong>{inputs.humidity_percent}<small>%</small></strong><input type="range" min="0" max="100" value={inputs.humidity_percent} onChange={(e) => update('humidity_percent', Number(e.target.value))} /></label></div>
          <div className="weather-actions"><button className="secondary-button" onClick={fetchLiveWeather} disabled={weatherLoading}>{weatherLoading ? 'Fetching live conditions...' : 'Use live weather  ↗'}</button><span>{weatherLocation || 'Device location required'}{weatherMessage && ` · ${weatherMessage}`}</span></div>
          <div className="toggle-list"><button className={`toggle ${inputs.occupied ? 'active' : ''}`} onClick={() => update('occupied', !inputs.occupied)}><span className="toggle-dot" /><span><b>Room occupied</b><small>Occupancy-aware automation</small></span><i>{inputs.occupied ? 'ON' : 'OFF'}</i></button><button className={`toggle ${inputs.quiet_hours ? 'active' : ''}`} onClick={() => update('quiet_hours', !inputs.quiet_hours)}><span className="toggle-dot" /><span><b>Quiet hours</b><small>Cap airflow at low speed</small></span><i>{inputs.quiet_hours ? 'ON' : 'OFF'}</i></button></div>
          <button className="primary-button" onClick={recommend} disabled={loading}>{loading ? 'Evaluating...' : 'Evaluate conditions  →'}</button>
        </section>
        <section className={`panel recommendation state-${currentState}`}><div className="panel-heading"><div><p className="eyebrow">AUTOMATION DECISION</p><h2>Recommended state</h2></div><span className="live-label">● REAL TIME</span></div><div className="fan-visual"><div className="fan-ring"><div className="fan-blades">✣</div></div><div><span className="state-label">{currentState.toUpperCase()}</span><p>{decision?.recommendation?.explanation || 'Run an evaluation to generate a recommendation.'}</p></div></div><div className="state-scale">{states.map((state, index) => <span className={index <= stateIndex ? 'filled' : ''} key={state}><i />{state}</span>)}</div>{decision && <div className="rule-note"><b>Why this result</b><span>{decision.recommendation.rules_triggered.map((rule) => rule.replaceAll('_', ' ')).join('  ·  ')}</span></div>}</section>
      </div>
      <section className="lower-grid"><section className="panel feedback"><div className="panel-heading"><div><p className="eyebrow">PERSONALISATION</p><h2>How does it feel?</h2></div><span className="badge">OPTIONAL</span></div><p className="muted">Feedback adjusts the next recommendation within safe, explainable limits.</p><div className="feedback-actions">{[['too_cool','Too cool','↓'],['comfortable','Comfortable','✓'],['too_warm','Too warm','↑']].map(([value, label, icon]) => <button className={inputs.feedback === value ? 'selected' : ''} key={value} onClick={() => update('feedback', inputs.feedback === value ? null : value)}><strong>{icon}</strong><span>{label}</span></button>)}</div></section><section className="panel history"><div className="panel-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Recent decisions</h2></div><span className="count">{history.length} logged</span></div>{history.length === 0 ? <p className="muted empty">Your decisions will appear here.</p> : <div className="history-list">{history.slice(0, 5).map((item) => <div className="history-item" key={item.id}><span className={`history-dot dot-${item.recommendation.state}`} /><span><b>{item.recommendation.state}{item.demo && <em> DEMO</em>}</b><small>{item.temperature_c}°C · {item.humidity_percent}% humidity</small></span><time>{new Date(item.recommendation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>)}</div>}</section></section>
      <section className="panel analysis-panel"><div className="panel-heading"><div><p className="eyebrow">HISTORICAL ANALYSIS</p><h2>Past 24-hour comfort profile</h2></div><span className="badge">DEMO DATASET · {analysisHistory.length} EVENTS</span></div><p className="muted">A preloaded history makes the dashboard feel alive before a physical fan is connected. Live decisions are added above the generated baseline.</p><div className="analysis-grid"><div><strong>{averageTemperature}°C</strong><span>average temperature</span></div><div><strong>{averageHumidity}%</strong><span>average humidity</span></div><div><strong>{activeHours}/{analysisHistory.length}</strong><span>hours with airflow</span></div><div><strong>{highAirflowHours}</strong><span>high-airflow events</span></div></div><div className="trend-legend"><span><i className="legend-temp" /> temperature</span><span><i className="legend-airflow" /> airflow intensity</span></div><div className="trend-chart" aria-label="Hourly temperature, humidity, and fan state trend">{analysisHistory.slice(0, 12).reverse().map((item) => { const state = item.recommendation.state; const intensity = Math.round((states.indexOf(state) / (states.length - 1)) * 100); return <div className="trend-column" key={item.id}><div className="trend-values"><b>{item.temperature_c}°</b><span>{item.humidity_percent}%</span></div><div className="trend-track"><i className={`trend-temp state-${state}`} style={{ height: `${Math.max(18, Math.min(100, (item.temperature_c - 18) * 7))}%` }} /><i className="trend-airflow" style={{ height: `${Math.max(8, intensity)}%` }} /></div><strong className={`trend-state state-${state}`}>{state}</strong><small>{new Date(item.recommendation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>})}</div></section>
      <section className="panel energy-panel"><div className="panel-heading"><div><p className="eyebrow">SCENARIO ANALYSIS</p><h2>Estimated energy use</h2></div><span className="badge">5 HOUR SCENARIO</span></div><div className="energy-content"><div><strong>{energy ? energy.estimates[currentState] : '—'}</strong><span>kWh at current state</span></div><div className="energy-bars">{states.slice(1).map((state) => <div className="energy-bar" key={state}><span>{state}</span><i><b style={{ width: `${(energy?.estimates[state] || 0) / 0.35 * 100}%` }} /></i><small>{energy?.estimates[state] ?? '—'}</small></div>)}</div></div><p className="assumption">{energy?.assumptions || 'Power assumptions are loaded from the backend.'}</p></section>
      <footer><span>FanIQ v1.0</span><span>Software simulation · Energy values are estimates, not measurements.</span></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
