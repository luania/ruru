import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  workingDirectory: string | null;
  setWorkingDirectory: (path: string | null) => void;
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;
  recentPaths: string[];
  addRecentPath: (path: string) => void;
  removeRecentPath: (path: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      workingDirectory: null,
      setWorkingDirectory: (path) => set({ workingDirectory: path }),
      activeFilePath: null,
      setActiveFilePath: (path) => set({ activeFilePath: path }),
      recentPaths: [],
      addRecentPath: (path) =>
        set((state) => {
          const newPaths = [
            path,
            ...state.recentPaths.filter((p) => p !== path),
          ].slice(0, 10);
          return { recentPaths: newPaths };
        }),
      removeRecentPath: (path) =>
        set((state) => ({
          recentPaths: state.recentPaths.filter((p) => p !== path),
        })),
    }),
    {
      name: "ruru-storage",
      partialize: (state) => ({ recentPaths: state.recentPaths }),
    }
  )
);
