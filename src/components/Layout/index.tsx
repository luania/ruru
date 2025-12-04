import { Sidebar } from "../Sidebar";
import { Editor } from "../Editor";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const Layout = () => {
  return (
    <div className="h-screen w-screen bg-gray-900 text-white">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar />
        </Panel>
        <PanelResizeHandle className="w-[1px] bg-[#3e3e42] hover:bg-blue-500 transition-colors" />
        <Panel>
          <main className="h-full w-full overflow-hidden relative">
            <Editor />
          </main>
        </Panel>
      </PanelGroup>
    </div>
  );
};
