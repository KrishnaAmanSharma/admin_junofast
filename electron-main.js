const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Start the Express server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Express server...');
    
    // Start the server process
    serverProcess = spawn('node', ['server/index.js'], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output);
      
      // Check if server started successfully
      if (output.includes('serving on port')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 30000);
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: Add app icon
    title: 'Juno Fast - Admin Dashboard'
  });

  // Remove default menu bar
  Menu.setApplicationMenu(null);

  // Load the app - wait for server to start
  startServer()
    .then(() => {
      // Wait a bit more for server to be fully ready
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5000');
      }, 2000);
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      // Show error page or exit
      app.quit();
    });

  // Handle window closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Development tools (remove in production)
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
  // Kill server process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  // On macOS it is common for applications to stay open until explicitly quit
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // On macOS it's common to re-create a window when clicking dock icon
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Handle app termination
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    // Open in external browser instead
    require('electron').shell.openExternal(navigationUrl);
  });
});