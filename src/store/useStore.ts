import { create } from "zustand";

interface AppState {
  openapi: Record<string, any>;
  setOpenapi: (openapi: Record<string, any>) => void;
}

export const useStore = create<AppState>((set) => ({
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "New API",
      version: "1.0.0",
    },
    paths: {},
  },
  setOpenapi: (openapi) => set({ openapi }),
}));
