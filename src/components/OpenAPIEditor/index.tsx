import { Code, LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { CodeEditor } from "../CodeEditor";
import { Button } from "../ui/Button";
import OpenAPIFormEditor from "./OpenAPIFormEditor";

export const OpenAPIEditor = () => {
  const [view, setView] = useState<"form" | "code">("form");
  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <Button
            variant={view === "form" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("form")}
            className="gap-2"
          >
            <LayoutTemplate size={14} />
            Form
          </Button>
          <Button
            variant={view === "code" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("code")}
            className="gap-2"
          >
            <Code size={14} />
            Code
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "form" ? <OpenAPIFormEditor /> : <CodeEditor />}
      </div>
    </div>
  );
};
