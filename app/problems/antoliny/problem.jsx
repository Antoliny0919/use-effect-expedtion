import { useState, useEffect } from "react";

// 🐛 경매 입찰 스트림
//
// simulateAuction은 실제 WebSocket 연결이라고 가정합니다.
// 연결은 auctionId가 바뀔 때만 재시작되어야 합니다.
//
// 각 입찰은 현재 nickname과 currency로 기록되어야 합니다.

// 경매 번호를 바꿀때만 서버가 재시작 되어야 합니다. (lot-xxx 연결됨)
// 의존성배열 린트문제부터 해결해 봐요.

function simulateAuction(auctionId, { onConnect, onBid }) {
  onConnect(auctionId);
  let price = 1_000_000;
  const id = setInterval(() => {
    price += Math.floor(Math.random() * 100_000) + 10_000;
    onBid({ auctionId, price });
  }, 2000);
  return () => clearInterval(id);
}

const CURRENCIES = {
  KRW: (p) => `₩${p.toLocaleString()}`,
  USD: (p) => `$${(p / 1350).toFixed(0)}`,
};

export default function AntolinyProblem() {
  const [auctionId, setAuctionId] = useState("lot-001");
  const [nickname, setNickname] = useState("익명");
  const [currency, setCurrency] = useState("KRW");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    return simulateAuction(auctionId, {
      onConnect: (id) =>
        setEvents((prev) => [...prev, { type: "connect", id }]),
      onBid: ({ price }) =>
        setEvents((prev) => [
          ...prev,
          { type: "bid", price, nickname, currency },
        ]),
    });
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: "monospace", maxWidth: 480 }}>
      <h2>🔨 실시간 경매</h2>

      <div style={{ marginBottom: 16 }}>
        <label>
          경매 번호&nbsp;
          <select
            value={auctionId}
            onChange={(e) => setAuctionId(e.target.value)}
          >
            <option>lot-001</option>
            <option>lot-002</option>
            <option>lot-003</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>
          닉네임&nbsp;
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ width: 120 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>
          통화&nbsp;
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option>KRW</option>
            <option>USD</option>
          </select>
        </label>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {events.map((e, i) =>
          e.type === "connect" ? (
            <li key={i} style={{ color: "#888", marginBottom: 4 }}>
              🔗 {e.id} 연결됨
            </li>
          ) : (
            <li
              key={i}
              style={{
                background: "#f0f4ff",
                padding: "6px 10px",
                marginBottom: 4,
                borderRadius: 4,
              }}
            >
              💰 {CURRENCIES[e.currency](e.price)}{" "}
              <span style={{ color: "#888" }}>— {e.nickname}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
