export {};

declare global {
  interface Window {
    ipcRenderer: {
      on: (
        channel: string,
        listener: (event: unknown, ...args: unknown[]) => void
      ) => void;
      off: (channel: string, ...omit: unknown[]) => void;
      send: (channel: string, ...args: unknown[]) => void;
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      openDirectory: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      readDirectory: (
        path: string
      ) => Promise<Array<{ name: string; isDirectory: boolean; path: string }>>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<boolean>;
    };
  }
}
