// ProjectRoom.js

import { useEffect, useRef, useState } from 'react';
import {
  createEncryptedRoomConnection,
  createUnencryptedRoomConnection,
} from './roomApi.js';
import { showNotification } from './notifications.js';

const serverUrl = 'https://localhost:4444';

export default function ProjectRoom({
  roomId,
  encrypted,
  theme,
  muted,
  showSearch,
}) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const searchRef = useRef(null);

  const options = {
    serverUrl,
    roomId,
  };

  if (showSearch && searchRef.current) {
    searchRef.current.focus();
  }

  useEffect(() => {
    const connection = encrypted
      ? createEncryptedRoomConnection(options)
      : createUnencryptedRoomConnection(options);

    connection.on('message', (msg) => {
      setMessages([...messages, msg]);

      if (!muted) {
        showNotification('[' + roomId + '] ' + msg.text, theme);
      }
    });

    connection.connect();

    return () => {
      connection.disconnect();
    };
  }, [options, encrypted, messages, muted, roomId, theme]);

  useEffect(() => {
    setVisibleMessages(
      messages.filter((message) =>
        message.text.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }, [messages, query]);

  return (
    <>
      <h1>Project room: {roomId}</h1>

      {showSearch && (
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages"
        />
      )}

      <ul>
        {visibleMessages.map((message) => (
          <li key={message.id}>{message.text}</li>
        ))}
      </ul>
    </>
  );
}
