// App.jsx

/*
요구사항:
1. roomId가 바뀌면 재연결되어야 한다.
2. encrypted가 바뀌면 재연결되어야 한다.
3. theme가 바뀌어도 재연결되면 안 된다.
4. muted가 바뀌어도 재연결되면 안 된다.
5. 메시지 알림은 항상 최신 theme, muted 값을 사용해야 한다.
6. 검색창을 열면 input에 자동 focus 되어야 한다.
7. 검색어를 바꿔도 재연결되면 안 된다.
8. 렌더링 중 DOM 조작을 하면 안 된다.
9. roomApi.js는 수정하지 않는다.

현재 버그:
- theme나 muted를 바꿔도 연결이 다시 된다.
- 메시지가 올 때마다 연결이 다시 될 수 있다.
- 검색어를 바꿔도 불필요한 Effect가 돈다.
- input focus를 렌더링 중에 시도하고 있다.
*/

import { useState } from 'react';
import ProjectRoom from './ProjectRoom.jsx';

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
