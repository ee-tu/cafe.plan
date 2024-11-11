const { useState, useContext, createContext } = React;
const AuthContext = createContext(null);

// Utility Functions
const formatDate = date => date.toISOString().split('T')[0];
const getQuarterDays = currentDate => {
  const days = [];
  const start = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 5 || (d.getDay() === 4 && d.getDate() <= 7)) days.push(new Date(d));
  }
  return days;
};

// Components
const ShiftEntry = ({ date, shift, position, value, onSave }) => {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const handleSave = e => {
    e.preventDefault();
    onSave(date, shift, position, name);
    setShow(false);
    setName('');
  };

  return (
    <>
      <button className={`shift-entry ${!value ? 'empty' : ''}`} onClick={() => setShow(true)}>
        {value || '○'}
      </button>
      {show && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <form onSubmit={handleSave}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                className="w-full mb-2"
                required
              />
              <div className="text-right">
                <button type="button" onClick={() => setShow(false)} className="btn btn-secondary mr-2">
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState({});
  const [notes, setNotes] = useState({});
  const [closedDays, setClosedDays] = useState([]);

  const updateShift = (date, shift, position, name) => 
    setShifts(prev => {
      const dateStr = formatDate(date);
      return {
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          [shift]: { ...prev[dateStr]?.[shift], [position]: name }
        }
      };
    });

  const toggleDay = date => {
    const dateStr = formatDate(date);
    setClosedDays(prev => prev.includes(dateStr) ? 
      prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  };

  return (
    <div className="container">
      <div className="schedule-container">
        <div className="schedule-header">
          <h2>Dienstplan Q{Math.floor(currentDate.getMonth() / 3) + 1}/{currentDate.getFullYear()}</h2>
          <div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 3)))} 
              className="btn btn-secondary mr-2">←</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 3)))} 
              className="btn btn-secondary">→</button>
          </div>
        </div>
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Tag</th>
              <th>Status</th>
              <th colSpan="2">16:30 - 20:00</th>
              <th colSpan="2">20:00 - 22:00</th>
              <th>Anmerkungen</th>
            </tr>
          </thead>
          <tbody>
            {getQuarterDays(currentDate).map(date => {
              const dateStr = formatDate(date);
              const isClosed = closedDays.includes(dateStr);
              return (
                <tr key={dateStr}>
                  <td>
                    {date.toLocaleDateString('de-DE', {
                      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                    <br />
                    <small>KW {new Date(date).getWeek()}</small>
                  </td>
                  <td>
                    <button className={`btn ${isClosed ? 'status-closed' : 'status-open'}`}
                      onClick={() => toggleDay(date)}>
                      {isClosed ? 'Geschlossen' : 'Geöffnet'}
                    </button>
                  </td>
                  {!isClosed ? (
                    <>
                      {['shift1', 'shift2'].map(shift => (
                        ['kitchen', 'counter'].map(pos => (
                          <td key={`${shift}-${pos}`}>
                            <ShiftEntry
                              date={date}
                              shift={shift}
                              position={pos}
                              value={shifts[dateStr]?.[shift]?.[pos]}
                              onSave={updateShift}
                            />
                          </td>
                        ))
                      ))}
                    </>
                  ) : (
                    <td colSpan="4" className="text-center">Geschlossen</td>
                  )}
                  <td>
                    <input
                      type="text"
                      value={notes[dateStr] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [dateStr]: e.target.value }))}
                      placeholder="Anmerkungen..."
                      className="w-full"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Login = () => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  
  const handleSubmit = e => {
    e.preventDefault();
    if (login(creds.username, creds.password)) {
      setError('');
    } else {
      setError('Ungültige Zugangsdaten');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="text-center mb-2">Café Dienstplanung</h2>
        <form onSubmit={handleSubmit}>
          {['username', 'password'].map(field => (
            <div key={field} className="form-group">
              <input
                type={field === 'password' ? 'password' : 'text'}
                placeholder={field === 'username' ? 'Benutzername' : 'Passwort'}
                value={creds[field]}
                onChange={e => setCreds(prev => ({ ...prev, [field]: e.target.value }))}
                required
              />
            </div>
          ))}
          {error && <div className="error-message mb-2">{error}</div>}
          <button type="submit" className="btn btn-primary w-full">Anmelden</button>
        </form>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  const [auth, setAuth] = useState({ isAuthenticated: false, isAdmin: false });
  const creds = { username: 'cafe', password: 'cafe123', masterPassword: 'master123' };

  const login = (username, password) => {
    if (username === creds.username && (password === creds.password || password === creds.masterPassword)) {
      setAuth({ isAuthenticated: true, isAdmin: password === creds.masterPassword });
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout: () => setAuth({ isAuthenticated: false, isAdmin: false }) }}>
      {!auth.isAuthenticated ? <Login /> : <Schedule />}
    </AuthContext.Provider>
  );
};

// Initialize
ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// Helper for week number
Date.prototype.getWeek = function() {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};