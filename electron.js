const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

// Windows에서 window.alert()/confirm() 사용 시 대화상자가 닫힌 후
// 웹뷰가 키보드 포커스를 잃는 Electron 버그가 있어서,
// 렌더러의 alert/confirm을 메인 프로세스의 dialog로 대체하고 닫힌 뒤 포커스를 복원한다.
function refocusMainWindow() {
  if (!mainWindow) return;
  mainWindow.blur();
  mainWindow.focus();
  mainWindow.webContents.focus();
}

ipcMain.on('dialog:alert', (event, message) => {
  dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: '알림',
    message: String(message ?? ''),
    buttons: ['확인'],
    noLink: true,
  });
  refocusMainWindow();
  event.returnValue = true;
});

ipcMain.on('dialog:confirm', (event, message) => {
  const result = dialog.showMessageBoxSync(mainWindow, {
    type: 'question',
    title: '확인',
    message: String(message ?? ''),
    buttons: ['확인', '취소'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  refocusMainWindow();
  event.returnValue = result === 0;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: true, // 명시적으로 표시
    icon: path.join(__dirname, 'public/icon.ico'), // 아이콘 경로
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
    autoHideMenuBar: true, // 메뉴바 숨기기
    backgroundColor: '#0f172a',
  });

  // 창을 화면 중앙에 표시
  mainWindow.center();

 // 1. 빌드 여부를 더 확실하게 판별 (app.isPackaged 사용)
const isPackaged = app.isPackaged;

if (!isPackaged) {
// 개발 모드: Vite 서버 로드
mainWindow.loadURL('http://localhost:5173');
} else {
// 프로덕션 모드: 빌드된 파일 로드
// __dirname 기준으로 dist 폴더 위치를 다시 잡아야 할 수도 있습니다.
// 보통 메인 파일이 루트에 있다면 'dist/index.html'이 맞습니다.
const indexPath = path.join(__dirname, 'dist/index.html');
mainWindow.loadFile(indexPath); // loadURL 대신 loadFile 사용 권장
}

  // 로딩 완료 시 창 표시
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    mainWindow.show();
    mainWindow.focus();
  });

  // 개발자 도구 (항상 열기 - 디버깅용)
  // 배포 시 주석 처리
  //mainWindow.webContents.openDevTools();

  // 로딩 에러 시 콘솔에 출력
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    // 에러 발생 시에도 창은 표시
    mainWindow.show();
  });

  // 크래시 핸들러
  mainWindow.webContents.on('crashed', () => {
    console.error('Window crashed!');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
