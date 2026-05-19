// roomApi.js
// 수정하지 마세요.

export function createEncryptedRoomConnection(options) {
  return createRoomConnection({ ...options, encrypted: true });
}

export function createUnencryptedRoomConnection(options) {
  return createRoomConnection({ ...options, encrypted: false });
}

function createRoomConnection({ serverUrl, roomId, encrypted }) {
  if (typeof serverUrl !== 'string') {
    throw Error('serverUrl must be a string');
  }

  if (typeof roomId !== 'string') {
    throw Error('roomId must be a string');
  }

  let intervalId;
  let messageCallback;

  return {
    connect() {
      console.log(
        encrypted
          ? '✅ 🔐 Connected to ' + roomId
          : '✅ Connected to ' + roomId,
      );

      intervalId = setInterval(() => {
        if (messageCallback) {
          messageCallback({
            id: String(Date.now()),
            text: Math.random() > 0.5 ? 'New comment' : 'Status changed',
          });
        }
      }, 3000);
    },

    disconnect() {
      clearInterval(intervalId);
      messageCallback = null;

      console.log(
        encrypted
          ? '❌ 🔐 Disconnected from ' + roomId
          : '❌ Disconnected from ' + roomId,
      );
    },

    on(event, callback) {
      if (event !== 'message') {
        throw Error('Only message event is supported');
      }

      if (messageCallback) {
        throw Error('Cannot add handler twice');
      }

      messageCallback = callback;
    },
  };
}
