import { useEffect, useState, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useStore } from "../../store/useStore";
import { Save } from "lucide-react";
import { Button } from "../ui/Button";

export const CodeEditor = () => {
  const { activeFilePath } = useStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const loadFile = () => {
      if (!activeFilePath) {
        setContent("");
        return;
      }

      setIsLoading(true);
      console.log("Loading file:", activeFilePath);
      window.ipcRenderer
        .readFile(activeFilePath)
        .then((fileContent) => {
          console.log("File loaded successfully");
          setContent(fileContent);
          setIsDirty(false);
        })
        .catch((error) => {
          console.error("Failed to read file:", error);
          setContent(`Error loading file: ${error}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    loadFile();
  }, [activeFilePath]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add Save command (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleSave = () => {
    if (!activeFilePath || !editorRef.current) return;

    const currentContent = editorRef.current.getValue();
    window.ipcRenderer
      .writeFile(activeFilePath, currentContent)
      .then(() => {
        setIsDirty(false);
        // Optional: Show success toast
      })
      .catch((error) => {
        console.error("Failed to save file:", error);
      });
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setIsDirty(true);
    }
  };

  if (!activeFilePath) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a file to view or edit
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  // Determine language based on file extension
  const getLanguage = (path: string) => {
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
    if (path.endsWith(".js")) return "javascript";
    if (path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".md")) return "markdown";
    return "plaintext";
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <span className="text-sm text-gray-300 truncate flex-1 mr-4">
          {activeFilePath}
          {isDirty && (
            <span className="ml-2 text-yellow-400 text-xs">● Modified</span>
          )}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={!isDirty}
          className="h-7 px-2"
          title="Save (Cmd+S)"
        >
          <Save
            size={14}
            className={isDirty ? "text-blue-400" : "text-gray-500"}
          />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage={getLanguage(activeFilePath)}
          path={activeFilePath} // Helps Monaco with model caching and intellisense
          value={content}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};
