
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Electron(Windows)에서 native alert/confirm이 닫힌 뒤 입력 필드가
// 키보드 포커스를 잃는 버그가 있어, 메인 프로세스 dialog로 대체한다.
// 브라우저(vite dev)에서는 window.require가 없으므로 기본 동작 유지.
const electronRequire = (window as any).require;
if (electronRequire) {
  try {
    const { ipcRenderer } = electronRequire('electron');
    window.alert = (message?: any) => {
      ipcRenderer.sendSync('dialog:alert', String(message ?? ''));
    };
    window.confirm = (message?: string) => {
      return ipcRenderer.sendSync('dialog:confirm', String(message ?? '')) === true;
    };
  } catch {
    // ipcRenderer를 못 가져오면 기본 alert/confirm 사용
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
