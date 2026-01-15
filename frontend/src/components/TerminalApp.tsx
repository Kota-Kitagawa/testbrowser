import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalApp = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !terminalRef.current) return;
    initialized.current = true;

    // 1. スクロール設定を有効にしてTerminalを初期化
    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e' },
      fontSize: 14,
      scrollback: 2000,      // 2000行までスクロールで遡れるように設定
      allowProposedApi: true // Resize等のイベント処理に必要
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    xtermRef.current = term;

    const hostname = window.location.hostname;
    const socketUrl = `ws://${hostname}:3000/ws`;
    const socket = new WebSocket(socketUrl);

    // バックエンドにサイズ変更を伝えるためのイベント
    term.onResize((size) => {
      if (socket.readyState === WebSocket.OPEN) {
        // バックエンド側もJSONをパースできるようにしている場合はこちら
        socket.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
      }
    });

    socket.onopen = () => {
      requestAnimationFrame(() => {
        if (terminalRef.current) {
          term.open(terminalRef.current);
          try {
            fitAddon.fit();
            term.focus();
          } catch (e) {}
        }
      });
    };

    socket.onmessage = async (event) => {
      const text = event.data instanceof Blob ? await event.data.text() : event.data;
      term.write(text);
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        // メッセージ形式をJSONに統一（バックエンドに合わせて調整してください）
        socket.send(JSON.stringify({ type: 'data', content: data }));
      }
    });

    // 2. リサイズループを防止しつつ、親要素のサイズに追従させる
    let resizeTimer: number;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        try {
          if (terminalRef.current && terminalRef.current.offsetParent !== null) {
            fitAddon.fit();
          }
        } catch (e) {}
      });
    });

    // ブラウザのリサイズではなく、ターミナルの親要素（Draggableの枠）を監視
    if (terminalRef.current?.parentElement) {
      resizeObserver.observe(terminalRef.current.parentElement);
    }

    return () => {
      cancelAnimationFrame(resizeTimer);
      resizeObserver.disconnect();
      socket.close();
      term.dispose();
      initialized.current = false;
    };
  }, []);

  // 3. スタイル調整：min-h-0 と overflow-hidden がスクロールを正常に機能させる鍵です
  return (
    <div className="w-full h-full bg-[#1e1e1e] flex flex-col min-h-0 overflow-hidden">
      <div ref={terminalRef} className="flex-1 p-2 min-h-0" />
    </div>
  );
};

export default TerminalApp;