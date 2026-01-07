const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

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

  // 개발 모드에서는 localhost:5173, 프로덕션에서는 빌드된 파일 로드
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  mainWindow.loadURL(startUrl);

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
