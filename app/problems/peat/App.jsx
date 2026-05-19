// App.jsx

import { useState } from 'react';
import ProjectRoom from './ProjectRoom.js';

export default function App() {
  const [roomId, setRoomId] = useState('general');
  const [encrypted, setEncrypted] = useState(false);
  const [dark, setDark] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <label>
        Room:{' '}
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          <option value="general">general</option>
          <option value="design">design</option>
          <option value="release">release</option>
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={encrypted}
          onChange={(e) => setEncrypted(e.target.checked)}
        />
        Encrypted
      </label>

      <label>
        <input
          type="checkbox"
          checked={dark}
          onChange={(e) => setDark(e.target.checked)}
        />
        Dark theme
      </label>

      <label>
        <input
          type="checkbox"
          checked={muted}
          onChange={(e) => setMuted(e.target.checked)}
        />
        Mute notifications
      </label>

      <button onClick={() => setShowSearch((s) => !s)}>
        {showSearch ? 'Close search' : 'Open search'}
      </button>

      <hr />

      <ProjectRoom
        roomId={roomId}
        encrypted={encrypted}
        theme={dark ? 'dark' : 'light'}
        muted={muted}
        showSearch={showSearch}
      />
    </>
  );
}
