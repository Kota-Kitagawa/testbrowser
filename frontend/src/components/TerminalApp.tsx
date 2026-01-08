import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalApp = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const initialized = useRef(false); // 二重初期化防止用

  useEffect(() => {
    // すでに初期化されていたら何もしない (Strict Mode対策)
    if (initialized.current || !terminalRef.current) return;
    initialized.current = true;

    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e' },
      fontSize: 14,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    xtermRef.current = term;

    const socket = new WebSocket('ws://localhost:3000/ws');

    socket.onopen = () => {
  console.log('✅ WebSocket Connected');
  
  requestAnimationFrame(() => {
    if (terminalRef.current) {
      term.open(terminalRef.current);
      try {
        fitAddon.fit();
        term.focus();
        // 手動の term.write("$ ") などは削除します。
        // サーバーからプロンプトが送られてくるのを待ちます。
      } catch (e) {}
    }
  });
};

    socket.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        const text = await event.data.text();
        term.write(text);
      } else {
        term.write(event.data);
      }
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    const handleResize = () => {
      try { fitAddon.fit(); } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      console.log('Cleaning up terminal...');
      window.removeEventListener('resize', handleResize);
      socket.close();
      term.dispose();
      initialized.current = false;
    };
  }, []);

  // 親要素にしっかりサイズを持たせる
  return (
    <div className="w-full h-full bg-[#1e1e1e] flex flex-col min-h-[300px]">
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
};

export default TerminalApp;