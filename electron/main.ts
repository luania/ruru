import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs/promises";

const DIST = path.join(__dirname, "../dist");
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, "../public");

process.env.DIST = DIST;
process.env.VITE_PUBLIC = VITE_PUBLIC;

let win: BrowserWindow | null;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("open-directory", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender) || win;
    if (!window) return { canceled: true, filePaths: [] };

    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
    });
    return result;
  });

  ipcMain.handle("read-directory", async (_, dirPath) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .map((entry) => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: path.join(dirPath, entry.name),
        }))
        .sort((a, b) => {
          if (a.isDirectory === b.isDirectory) {
            return a.name.localeCompare(b.name);
          }
          return a.isDirectory ? -1 : 1;
        });
    } catch (error) {
      console.error("Failed to read directory:", error);
      throw error;
    }
  });

  ipcMain.handle("read-file", async (_, filePath) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  });

  ipcMain.handle("write-file", async (_, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, "utf-8");
      return true;
    } catch (error) {
      console.error("Failed to write file:", error);
      throw error;
    }
  });
});
