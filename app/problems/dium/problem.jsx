'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// 가상 서버 데이터 및 API 모의 환경
// ==========================================
const MOCK_ORDERS = [
  {
    id: 'order-1',
    storeId: 'gangnam',
    customerName: '김철수',
    status: 'PENDING',
    menu: '페페로니 피자 L',
  },
  {
    id: 'order-2',
    storeId: 'gangnam',
    customerName: '이영희',
    status: 'PROCESSING',
    menu: '반반 치킨 세트',
  },
  {
    id: 'order-3',
    storeId: 'hongdae',
    customerName: '박민수',
    status: 'PENDING',
    menu: '로제 떡볶이',
  },
  {
    id: 'order-4',
    storeId: 'hongdae',
    customerName: '최지원',
    status: 'COMPLETE',
    menu: '왕족발 대자',
  },
];

const INITIAL_BUGGY_CODE = `import { useEffect, useState } from 'react';
import { fetchOrders } from './api';

export default function OrderDashboard() {
  const [storeId, setStoreId] = useState('gangnam');
  const [keyword, setKeyword] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await fetchOrders({ storeId, keyword });
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  // 1. 주문 데이터 패치 이펙트
  useEffect(() => {
    loadOrders();
  }, [storeId, keyword, orders]);

  // 2. 3초 백그라운드 폴링 이펙트
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadOrders();
    }, 3000);
  }, [storeId, keyword]);

  return (
    <main>
      <h1>주문 목록</h1>
    </main>
  );
}`;

const SOLUTION_CODE = `import { useEffect, useState, useEffectEvent } from 'react';
import { fetchOrders } from './api';

export default function OrderDashboard() {
  const [storeId, setStoreId] = useState('gangnam');
  const [keyword, setKeyword] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // useEffectEvent는 항상 최신 props와 state를 바라봅니다.
  // 이펙트 의존성 배열에 넣지 않아도 되므로, useCallback 없이 무한 루프를 해결하는 모던한 정석 기법입니다.
  const onFetch = useEffectEvent(async (signal) => {
    setLoading(true);
    try {
      const data = await fetchOrders({ storeId, keyword }, { signal });
      setOrders(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  });

  // 매장(storeId)이나 검색어(keyword)가 바뀔 때만 이펙트가 기동합니다.
  useEffect(() => {
    const controller = new AbortController();
    onFetch(controller.signal);

    return () => {
      controller.abort(); // 이전 지연 요청 기각(Abort)하여 경쟁 상태 방어!
    };
  }, [storeId, keyword]);

  // 3초 주기 오토 폴링(setInterval) 세팅
  useEffect(() => {
    const intervalId = setInterval(() => {
      onFetch();
    }, 3000);

    return () => {
      clearInterval(intervalId); // 메모리 누수 완벽 해소!
    };
  }, [storeId, keyword]);

  return (
    <main>
      <h1>주문 목록</h1>
    </main>
  );
}`;

export default function Page() {
  // 시뮬레이터 설정 상태
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'consoleGuide' | 'hints'
  const [editorTab, setEditorTab] = useState('dashboard'); // 'dashboard' | 'api'
  const [simulatedDelay, setSimulatedDelay] = useState(true); // 경쟁 상태 시뮬레이션 지연용

  // 에디터 코드 상태
  const [code, setCode] = useState(INITIAL_BUGGY_CODE);
  const [apiCode] = useState(`// src/services/api.js
export async function fetchOrders({ storeId, keyword }, { signal } = {}) {
  const params = new URLSearchParams({ keyword });
  const response = await fetch(\`/api/stores/\${storeId}/orders?\${params}\`, { signal });

  if (!response.ok) {
    throw new Error('주문 조회 실패');
  }
  return response.json();
}`);

  // 구문 분석을 통해 감지된 실시간 버그 제어 상태 (기본값은 buggy 기준)
  const [hasOrdersDependency, setHasOrdersDependency] = useState(true);
  const [hasPollingCleanup, setHasPollingCleanup] = useState(false);
  const [hasRaceConditionGuard, setHasRaceConditionGuard] = useState(false);

  // 가상 콘솔 로그
  const [consoleLogs, setConsoleLogs] = useState([
    { type: 'system', text: '가상 React 에디터 환경이 준비되었습니다.' },
    {
      type: 'info',
      text: '왼쪽 소스코드를 편집한 뒤 상단의 "새로고침 🔄" 버튼을 누르면 실시간 시뮬레이터에 적용됩니다.',
    },
  ]);

  const addLog = useCallback((type, text) => {
    setConsoleLogs((prev) =>
      [
        ...prev,
        { type, text, timestamp: new Date().toLocaleTimeString() },
      ].slice(-40),
    );
  }, []);

  const clearLogs = () => {
    setConsoleLogs([{ type: 'system', text: '콘솔 로그가 초기화되었습니다.' }]);
  };

  // ==========================================
  // [가상 브라우저 러닝타임 상태]
  // ==========================================
  const [storeId, setStoreId] = useState('gangnam');
  const [keyword, setKeyword] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 시뮬레이션 지표
  const [apiCallCount, setApiCallCount] = useState(0);
  const [activeIntervalsCount, setActiveIntervalsCount] = useState(1);
  const intervalTrackerRef = useRef([]);

  // 무한 업데이트 폭증 방지 가드 레일
  const lastFetchTimeRef = useRef(0);

  // ------------------------------------------------------------------
  // 실시간 코드 구문 분석기 (Parser)
  // ------------------------------------------------------------------
  const handleCompileCode = (currentCode) => {
    addLog('system', '⚙️ 작성된 코드를 빌드하고 분석하는 중...');

    // 1. orders 의존성 여부 정확한 검사
    const useEffectRegex =
      /useEffect\s*\(\s*(?:\(\s*\)|[^)]+)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[([\s\S]*?)\]\s*\)/g;
    let isOrdersDepDetected = false;
    let match;
    useEffectRegex.lastIndex = 0;
    while ((match = useEffectRegex.exec(currentCode)) !== null) {
      const depArrayContent = match[1];
      if (/\borders\b/.test(depArrayContent)) {
        isOrdersDepDetected = true;
        break;
      }
    }

    // 2. Polling interval clearInterval 클린업 소멸 주기 체크
    const hasInterval = currentCode.includes('setInterval');
    const hasClearInterval = currentCode.includes('clearInterval');
    const isCleanupDetected = hasInterval && hasClearInterval;

    // 3. Race Condition Guard 체크 (AbortController 혹은 ignore 변수 패턴 탐색)
    const hasAbortController =
      currentCode.includes('AbortController') ||
      currentCode.includes('abort()');
    const hasActiveFlag =
      currentCode.includes('active') &&
      (currentCode.includes('active = false') ||
        currentCode.includes('!active'));
    const isRaceConditionGuardDetected = hasAbortController || hasActiveFlag;

    // 적용 상태 업데이트
    setHasOrdersDependency(isOrdersDepDetected);
    setHasPollingCleanup(isCleanupDetected);
    setHasRaceConditionGuard(isRaceConditionGuardDetected);

    // 로그 전송
    addLog('success', '🔧 컴파일 완료! 감지된 이펙트 특성:');
    addLog(
      'info',
      `   - orders 무한 루프 위험 요소: ${isOrdersDepDetected ? '⚠️ 존재함 (의존성 포함)' : '✅ 안전함 (의존성 제외됨)'}`,
    );
    addLog(
      'info',
      `   - 백그라운드 폴링 클린업 장치: ${isCleanupDetected ? '✅ 감지됨 (clearInterval)' : '⚠️ 누락됨 (메모리 누수 우려)'}`,
    );
    addLog(
      'info',
      `   - 경쟁 상태(Race-condition) 방어벽: ${isRaceConditionGuardDetected ? '✅ 구성됨 (AbortController)' : '⚠️ 미장착 (구버전 통신 간섭 위험)'}`,
    );

    // 시뮬레이터 환경 변수 초기화
    setApiCallCount(0);
    intervalTrackerRef.current.forEach((id) => clearInterval(id));
    intervalTrackerRef.current = [];
    setActiveIntervalsCount(1);
    setKeyword('');
    setOrders([]);
  };

  // ------------------------------------------------------------------
  // 가상 API 시뮬레이터 통신 엔진
  // ------------------------------------------------------------------
  const mockFetchOrders = useCallback(
    (currentStoreId, currentKeyword, signal) => {
      return new Promise((resolve, reject) => {
        const delay =
          simulatedDelay && currentKeyword ? Math.random() * 1700 + 700 : 200;

        const timeoutId = setTimeout(() => {
          if (signal && signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }

          const filtered = MOCK_ORDERS.filter((order) => {
            const matchStore = order.storeId === currentStoreId;
            const matchKeyword = currentKeyword
              ? order.customerName.includes(currentKeyword) ||
                order.menu.includes(currentKeyword)
              : true;
            return matchStore && matchKeyword;
          });

          resolve(filtered);
        }, delay);

        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }
      });
    },
    [simulatedDelay],
  );

  // 컴파일 분석 상태 기반 이펙트 러너
  const loadOrdersRuntime = useCallback(
    async (signal) => {
      setLoading(true);
      setApiCallCount((prev) => prev + 1);
      addLog(
        'fetch',
        `🌐 [API 호출] fetchOrders({ 지점: "${storeId}", 검색어: "${keyword}" })`,
      );

      try {
        const data = await mockFetchOrders(storeId, keyword, signal);
        if (signal && signal.aborted) return;
        setOrders(data);
        addLog(
          'success',
          `✅ [수신 성공] 최신 데이터 렌더링 완료 (수신 수: ${data.length}개)`,
        );
      } catch (error) {
        if (error.name === 'AbortError') {
          addLog(
            'system',
            `🚫 [경쟁 상태 방어 완료] 이전 비동기 패치 폐기 처리 (검색어: "${keyword}")`,
          );
        } else {
          addLog('error', `❌ [API 오류] ${error.message}`);
        }
      } finally {
        if (!signal || !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [storeId, keyword, mockFetchOrders, addLog],
  );

  // Effect 러너 바인딩
  useEffect(() => {
    const controller = hasRaceConditionGuard ? new AbortController() : null;

    if (hasOrdersDependency) {
      const now = Date.now();
      if (now - lastFetchTimeRef.current > 1000) {
        lastFetchTimeRef.current = now;
        addLog(
          'warning',
          `🚨 [이펙트 트리거] 의존성 [orders] 변경 감지로 인한 동기적 재수신 유발`,
        );
        loadOrdersRuntime(controller?.signal);
      } else {
        addLog(
          'error',
          `🚫 [무한 루프 제어] orders 가 변경되어 리프레시를 요청했으나 무한 루프 파열을 방지하고자 API 인입을 임시 제한 중입니다.`,
        );
      }
    } else {
      loadOrdersRuntime(controller?.signal);
    }

    return () => {
      if (controller) {
        controller.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    storeId,
    keyword,
    hasOrdersDependency ? orders : null,
    hasOrdersDependency,
    hasRaceConditionGuard,
  ]);

  // Polling 이펙트 타이머 바인딩
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!hasOrdersDependency) {
        loadOrdersRuntime();
      } else {
        addLog(
          'warning',
          '⏰ [폴링 트리거] 3초 타이머가 백그라운드에서 백업 조회를 요청합니다.',
        );
        loadOrdersRuntime();
      }
    }, 3000);

    if (hasPollingCleanup) {
      intervalTrackerRef.current.push(intervalId);
      setActiveIntervalsCount(1);
      return () => {
        clearInterval(intervalId);
        addLog(
          'system',
          `🧹 [폴링 클린업 완료] setInterval (ID: ${intervalId}) 정리 완료`,
        );
      };
    } else {
      intervalTrackerRef.current.push(intervalId);
      setActiveIntervalsCount(intervalTrackerRef.current.length);
      addLog(
        'system',
        `➕ [폴링 누적] 클린업 누락으로 setInterval (ID: ${intervalId}) 신규 중첩됨 (누적 활성 타이머: ${intervalTrackerRef.current.length}개)`,
      );
    }
  }, [
    storeId,
    keyword,
    hasPollingCleanup,
    hasOrdersDependency,
    loadOrdersRuntime,
    addLog,
  ]);

  // ------------------------------------------------------------------
  // 보조 기능 핸들러
  // ------------------------------------------------------------------
  const handleReset = () => {
    setCode(INITIAL_BUGGY_CODE);
    handleCompileCode(INITIAL_BUGGY_CODE);
    addLog('system', '🔄 코드가 초기 버그 버전으로 리셋되었습니다.');
  };

  const handleLoadSolution = () => {
    setCode(SOLUTION_CODE);
    handleCompileCode(SOLUTION_CODE);
    addLog('success', '💡 모범 답안 코드가 로드되어 에디터에 적용되었습니다!');
  };

  const handleEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newValue =
        code.substring(0, selectionStart) + '  ' + code.substring(selectionEnd);
      setCode(newValue);

      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      }, 0);
    }
  };

  // Next.js 하이드레이션 오류 방지를 위한 마운트 체크
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-900">
      {/* 상단 네비게이션 헤더 */}
      <header className="border-b border-slate-900 bg-slate-900/95 sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-500 text-slate-950 p-1 rounded-lg font-black text-xs tracking-wider">
            SANDBOX
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              실시간 React 에디터 & useEffect 디버깅 챌린지
            </h1>
            <p className="text-[11px] text-slate-400">
              직접 코드를 타이핑하고 실행하며 렌더 주입 반응을 체험하세요.
            </p>
          </div>
        </div>

        {/* 에디터 제어 액션 */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleCompileCode(code)}
            className="px-3.5 py-1.5 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            🔄 새로고침 / 실행
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            ✕ 초기화
          </button>
          <button
            onClick={handleLoadSolution}
            className="px-3 py-1.5 rounded-md bg-teal-950/80 hover:bg-teal-900 text-teal-400 border border-teal-850 text-xs font-semibold transition-all"
          >
            💡 정답 불러오기
          </button>
        </div>
      </header>

      {/* 2단 분할 레이아웃 */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* 왼쪽 섹션 (7 cols) */}
        <div className="lg:col-span-7 border-r border-slate-900 flex flex-col bg-slate-900/10">
          <div className="flex border-b border-slate-800 bg-slate-900/80 px-4">
            <button
              onClick={() => setActiveTab('problem')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'problem'
                  ? 'border-teal-500 text-teal-400 bg-slate-900/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📝 요구사항 및 파일
            </button>
            <button
              onClick={() => setActiveTab('consoleGuide')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'consoleGuide'
                  ? 'border-teal-500 text-teal-400 bg-slate-900/20'
                  : 'border-transparent text-teal-400 hover:text-teal-200'
              }`}
            >
              🎯 콘솔 가이드라인
            </button>
            <button
              onClick={() => setActiveTab('hints')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'hints'
                  ? 'border-teal-500 text-teal-400 bg-slate-900/20'
                  : 'border-transparent text-rose-400 hover:text-rose-300'
              }`}
            >
              📖 정답 가이드 & 해결 기법
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === 'problem' && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 bg-slate-950/60 border-b border-slate-900 text-xs space-y-1.5">
                  <p className="font-bold text-slate-200">
                    🚀 미션: orders 무한패치 루프 해결 & 타이머 누수 해결 &
                    경쟁상태 극복
                  </p>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    아래{' '}
                    <code className="text-teal-400 bg-teal-950/60 px-1 py-0.5 rounded">
                      OrderDashboard.jsx
                    </code>{' '}
                    에디터를 자유롭게 편집하세요. `useEffect` 내부에 의존성을
                    올바르게 나열하고, `clearInterval` 및 `AbortController`를
                    활용한 클린업을 작성한 후 상단의{' '}
                    <strong className="text-teal-400">새로고침</strong>을
                    누르세요!
                  </p>
                </div>

                {/* 에디터 파일 탭 */}
                <div className="flex bg-slate-950/80 px-4 py-2 border-b border-slate-900 gap-2 items-center">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mr-2">
                    Files
                  </span>
                  <button
                    onClick={() => setEditorTab('dashboard')}
                    className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                      editorTab === 'dashboard'
                        ? 'bg-slate-800 text-white font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📂 OrderDashboard.jsx (수정 가능 ✍️)
                  </button>
                  <button
                    onClick={() => setEditorTab('api')}
                    className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                      editorTab === 'api'
                        ? 'bg-slate-800 text-white font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔒 api.js (읽기 전용 👁️)
                  </button>
                </div>

                {/* 실제 인터랙티브 소스 코드 편집기 영역 */}
                <div className="flex-1 relative bg-slate-950 overflow-hidden flex font-mono text-xs">
                  {editorTab === 'dashboard' ? (
                    <>
                      {/* 줄번호 표시판 */}
                      <div className="w-12 bg-slate-950/80 border-r border-slate-900/60 text-slate-600 select-none text-right pr-3.5 py-4 space-y-0 text-[11px] leading-5 font-mono">
                        {Array.from({
                          length: code.split('\n').length || 40,
                        }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* 에디터 본체 */}
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleEditorKeyDown}
                        placeholder="이곳에 코드를 작성하세요..."
                        className="flex-1 bg-transparent text-slate-200 p-4 focus:outline-none resize-none overflow-y-auto leading-5 font-mono whitespace-pre text-[11px] selection:bg-slate-800 focus:ring-0"
                        spellCheck="false"
                      />
                    </>
                  ) : (
                    <>
                      {/* 줄번호 표시판 */}
                      <div className="w-12 bg-slate-950/80 border-r border-slate-900/60 text-slate-700 text-right pr-3.5 py-4 space-y-0 text-[11px] leading-5 font-mono">
                        {Array.from({ length: apiCode.split('\n').length }).map(
                          (_, i) => (
                            <div key={i}>{i + 1}</div>
                          ),
                        )}
                      </div>
                      <textarea
                        value={apiCode}
                        readOnly
                        className="flex-1 bg-transparent text-slate-500 p-4 focus:outline-none resize-none overflow-y-auto leading-5 font-mono text-[11px] select-text"
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'consoleGuide' && (
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-160px)] space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">
                    🎯 디버깅 가이드: 콘솔 로그 분석법
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    오른쪽 가상 브라우저에서 특정 액션을 수행할 때, 가상 콘솔에
                    어떤 로그가 찍히는지를 비교하여 버그를 완벽하게 구별해낼 수
                    있습니다.
                  </p>
                </div>

                {/* 🔴 버그 상태 로그 양상 */}
                <div className="border border-rose-900/50 bg-rose-950/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h4 className="text-xs font-bold text-rose-400">
                      🔴 버그 상태일 때의 비정상 콘솔 흐름 (위험 신호)
                    </h4>
                  </div>
                  <ul className="space-y-3 text-[11px] text-slate-300">
                    <li className="bg-slate-950/60 p-2.5 rounded border border-rose-950/30">
                      <strong className="text-amber-400 block mb-1">
                        🚨 [이펙트 트리거] 및 🚫 [무한 루프 제어] 연속 발생
                      </strong>
                      지점을 한 번 바꾸거나 아무 조작을 안 해도 콘솔에 노란색
                      Warning과 빨간색 Error가 지속적으로 무한 스크롤됩니다.
                      <br />
                      <span className="text-rose-400/80">
                        👉 원인: orders가 fetch 이펙트의 의존성에 들어 있어
                        갱신-요청 무한 굴레에 빠졌습니다.
                      </span>
                    </li>
                    <li className="bg-slate-950/60 p-2.5 rounded border border-rose-950/30">
                      <strong className="text-sky-300 block mb-1">
                        ➕ [폴링 누적] 신규 중첩됨 로그 지속 누적
                      </strong>
                      지점을 다른 곳으로 바꿀 때마다{' '}
                      <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">
                        "setInterval (ID: X) 신규 중첩됨"
                      </code>{' '}
                      로그가 나타나며,{' '}
                      <strong className="text-rose-400">
                        동시 생존 가상 타이머 수가 2개, 3개, 4개...
                      </strong>{' '}
                      계속해서 늘어납니다.
                      <br />
                      <span className="text-rose-400/80">
                        👉 원인: useEffect의 리턴문에 clearInterval 클린업
                        장치가 누락되어 메모리 누수가 발생 중입니다.
                      </span>
                    </li>
                    <li className="bg-slate-950/60 p-2.5 rounded border border-rose-950/30">
                      <strong className="text-slate-400 block mb-1">
                        🚫 [경쟁 상태 방어 완료] 로그 누락
                      </strong>
                      검색창에 한글을 빠르게 ("치" ➡️ "치킨") 연타하여
                      입력했는데도 콘솔에 이전 요청 폐기 안내 로그가 전혀
                      발생하지 않습니다.
                      <br />
                      <span className="text-rose-400/80">
                        👉 원인: AbortController 신호 전달이 유실되어 타이핑
                        속도에 따라 화면 데이터가 꼬일 위험이 존재합니다.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* 🟢 정상 상태 로그 양상 */}
                <div className="border border-teal-900/50 bg-teal-950/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <h4 className="text-xs font-bold text-teal-400">
                      🟢 정상(해결) 상태일 때의 콘솔 흐름 (합격 신호)
                    </h4>
                  </div>
                  <ul className="space-y-3 text-[11px] text-slate-300">
                    <li className="bg-slate-950/60 p-2.5 rounded border border-teal-950/30">
                      <strong className="text-emerald-400 block mb-1">
                        ✅ 무한 반복 현상 소멸 및 쌍 로그 매칭
                      </strong>
                      지점을 한 번 클릭했을 때,{' '}
                      <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">
                        🌐 [API 호출]
                      </code>{' '}
                      로그가 발생한 이후 정확히{' '}
                      <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">
                        ✅ [수신 성공]
                      </code>{' '}
                      로그가 **단 1번만 쌍**으로 찍히고 정지합니다.
                    </li>
                    <li className="bg-slate-950/60 p-2.5 rounded border border-teal-950/30">
                      <strong className="text-teal-400 block mb-1">
                        🧹 [폴링 클린업 완료] 로그 등장
                      </strong>
                      지점을 홍대점에서 강남점으로 변경할 때, 기존 가상 타이머가
                      안전히 제거되며{' '}
                      <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">
                        🧹 [폴링 클린업 완료] 기존 setInterval (ID: X) 정리 완료
                      </code>
                      가 선제적으로 기록됩니다.
                    </li>
                    <li className="bg-slate-950/60 p-2.5 rounded border border-teal-950/30">
                      <strong className="text-sky-300 block mb-1">
                        🚫 [경쟁 상태 방어 완료] 로그 정상 노출
                      </strong>
                      "경쟁상태 재현"을 체크하고 검색창에 글자를 마구 입력하면,
                      이전 완성되지 않은 지연 요청들을 무시하면서{' '}
                      <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">
                        🚫 [경쟁 상태 방어 완료] 이전 비동기 패치 폐기 처리
                      </code>{' '}
                      로그가 정상적으로 출력됩니다.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'hints' && (
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-160px)] space-y-5">
                <h3 className="text-sm font-bold text-rose-400">
                  🕵️ 해결을 위한 3대 버그 완전 분석 가이드
                </h3>
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full font-bold">
                      원인 01
                    </span>
                    <h4 className="text-xs font-bold text-white mt-2 mb-1">
                      orders 의존성으로 인한 API 폭발
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      `useEffect` 내의 `loadOrders`는 호출 내부에서 `setOrders`
                      상태 변경을 진행합니다. 의존성 배열에 `orders`를 기입하면,
                      주문 목록이 업데이트되는 즉시 해당 이펙트가 재발행되어
                      다시 수신 요청을 넣는 무한 호출의 핑퐁 늪에 영구적으로
                      빠집니다.
                    </p>
                    <p className="text-teal-400 text-[11px] font-bold mt-1.5">
                      🔑 해결: 의존성 배열에서 orders 제거하기
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full font-bold">
                      원인 02
                    </span>
                    <h4 className="text-xs font-bold text-white mt-2 mb-1">
                      setInterval의 누적 생성 및 클린업 누락
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      매장 정보(`storeId`)나 검색어(`keyword`)가 수정되면 기존의
                      `useEffect` 블록이 만료되고 새로 생성됩니다. 그러나 이전의
                      `setInterval` 타이머가 제거되지 않으므로, 기존 타이머들이
                      힙 메모리에 중첩 구동 상태로 남아 3초마다 지속해서 호출을
                      퍼붓는 메모리 누수가 유입됩니다.
                    </p>
                    <p className="text-teal-400 text-[11px] font-bold mt-1.5">
                      🔑 해결: return () =&gt; clearInterval(intervalId)
                      선언하기
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full font-bold">
                      원인 03
                    </span>
                    <h4 className="text-xs font-bold text-white mt-2 mb-1">
                      네트워크 통신 경쟁 상태 (Race Condition)
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      "치" ➡️ "치킨"을 빠르게 타이핑할 때, "치" 요청이 지연되어
                      "치킨" 응답보다 늦게 정체가 풀려 렌더링을 덮어써버리면
                      검색 인풋은 치킨인데 화면에는 치 결과가 남는 이상 동기화
                      오류가 생깁니다.
                    </p>
                    <p className="text-teal-400 text-[11px] font-bold mt-1.5">
                      🔑 해결: AbortController 신호를 인입하여 cleanup에서
                      abort() 시키거나 ignore 플래그 설정
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 섹션: 라이브 데모 웹 브라우저 & 가상 콘솔 (5 cols) */}
        {/* lg:sticky와 높이 계산식을 더해 전체 스크롤 시에도 뷰포트 내 하단에 완전히 밀착 고정시킵니다. */}
        <div className="lg:col-span-5 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] flex flex-col bg-slate-950 border-l border-slate-900 overflow-hidden">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
              <span className="text-[11px] text-slate-400 ml-1 font-mono">
                localhost:3000/orders
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={simulatedDelay}
                  onChange={(e) => {
                    setSimulatedDelay(e.target.checked);
                    addLog(
                      'system',
                      `⚙️ [네트워크 설정] 레이턴시 경쟁 모드 ${e.target.checked ? '활성화' : '비활성화'}`,
                    );
                  }}
                  className="accent-teal-500 rounded"
                />
                경쟁상태(Network Lag) 재현
              </label>
            </div>
          </div>

          {/* 라이브 스크린 - 컨텐츠가 길어지면 브라우저 내부에서만 자체 스크롤되도록 분리 */}
          <div className="p-6 bg-slate-950 flex-1 overflow-y-auto flex flex-col justify-between border-b border-slate-900">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  주문 실시간 대시보드
                </span>
                {loading && (
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded animate-pulse">
                    로딩 중...
                  </span>
                )}
              </div>

              {/* 지점 및 필터 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold">
                    지점 선택
                  </span>
                  <select
                    value={storeId}
                    onChange={(e) => {
                      setStoreId(e.target.value);
                      addLog(
                        'info',
                        `📍 지점 변경 -> ${e.target.value === 'gangnam' ? '강남점' : '홍대점'}`,
                      );
                    }}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="gangnam">강남점</option>
                    <option value="hongdae">홍대점</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold">
                    메뉴/고객 검색
                  </span>
                  <input
                    type="text"
                    value={keyword}
                    placeholder="예: 피자, 김철수"
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      addLog('info', `🔍 검색어 입력: "${e.target.value}"`);
                    }}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* 주문 목록 */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-xl overflow-hidden min-h-30 max-h-40 overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 leading-relaxed">
                    검색 결과가 없거나 소스코드 내 무한 루프로 인해
                    <br />
                    렌더링 리소스가 고갈 상태입니다.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-900">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 text-xs flex justify-between items-center hover:bg-slate-900/20"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {order.customerName} 고객
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {order.menu}
                          </p>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            order.status === 'COMPLETE'
                              ? 'bg-teal-500/10 text-teal-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {order.status === 'COMPLETE'
                            ? '배달완료'
                            : '접수진행'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 자원 분석 */}
            <div className="mt-4 pt-4 border-t border-slate-900/60 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-900">
                <span className="text-slate-500 block text-[9px]">
                  API 호출 누적 횟수
                </span>
                <span
                  className={`text-sm font-bold ${apiCallCount > 15 ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`}
                >
                  {apiCallCount}회 호출됨
                </span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-900">
                <span className="text-slate-500 block text-[9px]">
                  누적 가상 타이머 수 (Memory Leak)
                </span>
                <span
                  className={`text-sm font-bold ${activeIntervalsCount > 1 ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`}
                >
                  {activeIntervalsCount}개 동시 생존
                </span>
              </div>
            </div>
          </div>

          {/* 가상 콘솔 - 우하단에 완전히 붙어있도록 고정 */}
          <div className="h-52.5 shrink-0 border-t border-slate-800 bg-slate-950 flex flex-col font-mono">
            <div className="bg-slate-900 px-4 py-1.5 flex justify-between items-center text-[10px] border-b border-slate-800 text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">Console</span>
                <span className="bg-slate-800 text-slate-300 px-1.5 rounded text-[8px]">
                  {consoleLogs.length} logs
                </span>
              </div>
              <button
                onClick={clearLogs}
                className="text-slate-500 hover:text-white transition-colors text-[9px]"
              >
                🚫 Clear
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-1 text-[10px] leading-tight">
              {consoleLogs.map((log, index) => {
                let colorClass = 'text-slate-400';
                let prefix = 'ℹ️';
                if (log.type === 'warning') {
                  colorClass =
                    'text-amber-400 bg-amber-950/20 px-1 py-0.5 rounded border-l-2 border-amber-500';
                  prefix = '⚠️';
                } else if (log.type === 'error') {
                  colorClass =
                    'text-rose-400 bg-rose-950/20 px-1 py-0.5 rounded border-l-2 border-rose-500';
                  prefix = '❌';
                } else if (log.type === 'success') {
                  colorClass = 'text-emerald-400';
                  prefix = '✅';
                } else if (log.type === 'fetch') {
                  colorClass = 'text-sky-300';
                  prefix = '🌐';
                } else if (log.type === 'system') {
                  colorClass = 'text-slate-500';
                  prefix = '⚙️';
                }

                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-1.5 ${colorClass}`}
                  >
                    <span>{prefix}</span>
                    <span className="text-slate-600">
                      [{log.timestamp || 'SYSTEM'}]
                    </span>
                    <span className="flex-1 break-all">{log.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
