import { Sidebar } from "../Sidebar";
import { Editor } from "../Editor";

export const Layout = () => {
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
        <Editor />
      </main>
    </div>
  );
};
