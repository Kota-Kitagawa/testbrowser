import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Monitor, FileText, Terminal as TerminalIcon, Settings } from 'lucide-react';
import './index.css';
// ターミナルコンポーネントを同じファイル内に定義、または別ファイルからインポート
import TerminalApp from './components/TerminalApp'; 

function App() {
  // ウィンドウの開閉状態
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Draggable用のRef（ウィンドウごとに分ける必要があります）
  const noteNodeRef = useRef(null);
  const terminalNodeRef = useRef(null);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500">
      
      {/* デスクトップアイコン */}
      <div className="p-4 grid grid-cols-1 gap-4 w-24">
        <DesktopIcon icon={<Monitor size={32} />} label="This PC" />
        <DesktopIcon 
          icon={<FileText size={32} />} 
          label="Notepad" 
          onDoubleClick={() => setIsNoteOpen(true)} 
        />
        <DesktopIcon 
          icon={<TerminalIcon size={32} />} 
          label="Terminal" 
          onDoubleClick={() => setIsTerminalOpen(true)} 
        />
      </div>

      {/* --- メモ帳ウィンドウ --- */}
      {isNoteOpen && (
        <Draggable nodeRef={noteNodeRef} handle=".title-bar">
          <div 
            ref={noteNodeRef}
            className="absolute top-20 left-20 w-[500px] bg-white/70 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 overflow-hidden flex flex-col z-10"
          >
            <div className="title-bar p-3 flex justify-between items-center bg-white/20 select-none">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <FileText size={16} />
                <span>Untitled - Notepad</span>
              </div>
              <div className="flex gap-4 px-2">
                <button className="hover:bg-black/5 px-2 rounded">ー</button>
                <button className="hover:bg-black/5 px-2 rounded">▢</button>
                <button 
                  onClick={() => setIsNoteOpen(false)} // 修正: falseにする
                  className="hover:bg-red-500 hover:text-white px-2 rounded transition-colors"
                >✕</button>
              </div>
            </div>
            
            <div className="p-1">
              <textarea 
                className="w-full h-64 p-4 bg-white/50 outline-none resize-none text-gray-800"
                placeholder="Type something..."
              />
            </div>
            <div className="p-2 flex justify-end bg-white/20">
              <button className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors">
                Save
              </button>
            </div>
          </div>
        </Draggable>
      )}

      {/* --- ターミナルウィンドウ --- */}
      {isTerminalOpen && (
        <Draggable nodeRef={terminalNodeRef} handle=".title-bar">
          <div 
            ref={terminalNodeRef}
            className="absolute top-40 left-40 w-[600px] h-[400px] bg-black/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col z-20"
          >
            <div className="title-bar p-3 flex justify-between items-center bg-white/10 select-none cursor-move">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <TerminalIcon size={16} />
                <span>Linux Terminal (Bun)</span>
              </div>
              <div className="flex gap-4 px-2">
                <button onClick={() => setIsTerminalOpen(false)} className="text-white hover:bg-red-500 px-2 rounded">✕</button>
              </div>
            </div>
            
            {/* ターミナル本体 */}
            <div className="flex-1 bg-black/50">
               <TerminalApp />
            </div>
          </div>
        </Draggable>
      )}

      {/* タスクバー (中央配置) */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-xl z-50">
        <TaskbarIcon icon={<img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Windows_logo_-_2021.svg" className="w-6" />} isStart />
        <TaskbarIcon icon={<Monitor className="text-blue-100" />} />
        
        {/* Notepad Icon */}
        <TaskbarIcon 
          icon={<FileText className="text-blue-200" />} 
          active={isNoteOpen} 
          onClick={() => setIsNoteOpen(!isNoteOpen)} 
        />
        
        {/* Terminal Icon */}
        <TaskbarIcon 
          icon={<TerminalIcon className="text-gray-200" />} 
          active={isTerminalOpen} 
          onClick={() => setIsTerminalOpen(!isTerminalOpen)} 
        />
        
        <TaskbarIcon icon={<Settings className="text-gray-300" />} />
      </div>
    </div>
  );
}

// サブコンポーネント：デスクトップアイコン
const DesktopIcon = ({ icon, label, onDoubleClick }: any) => (
  <div 
    onDoubleClick={onDoubleClick}
    className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white/10 cursor-pointer transition-colors group select-none"
  >
    <div className="text-white drop-shadow-md group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-white text-xs drop-shadow-md select-none">{label}</span>
  </div>
);

// サブコンポーネント：タスクバーアイコン
const TaskbarIcon = ({ icon, isStart, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-md transition-all hover:bg-white/20 relative ${isStart ? 'hover:scale-110' : ''}`}
  >
    <div className={active ? 'scale-90' : ''}>
      {icon}
    </div>
    {active && (
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_4px_white]" />
    )}
  </button>
);

export default App;