import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";

interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FileTreeItemProps {
  entry: FileEntry;
  level: number;
}

const FileTreeItem = ({ entry, level }: FileTreeItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const setActiveFilePath = useStore((state) => state.setActiveFilePath);
  const activeFilePath = useStore((state) => state.activeFilePath);

  const handleClick = () => {
    if (entry.isDirectory) {
      if (!isOpen && children.length === 0) {
        setIsLoading(true);
        window.ipcRenderer
          .readDirectory(entry.path)
          .then((result) => {
            setChildren(result);
          })
          .catch((error) => {
            console.error("Failed to read directory:", error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
      setIsOpen(!isOpen);
    } else {
      setActiveFilePath(entry.path);
    }
  };

  const isActive = activeFilePath === entry.path;

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer text-sm select-none",
          (isOpen || isActive) && "text-blue-400",
          isActive && "bg-gray-800"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        <span className="mr-1 w-4 h-4 flex items-center justify-center shrink-0">
          {entry.isDirectory &&
            (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        <span className="mr-2 text-blue-400 shrink-0 flex items-center justify-center w-4 h-4">
          {entry.isDirectory ? (
            <Folder size={14} />
          ) : (
            <File size={14} className="text-gray-400" />
          )}
        </span>
        <span className={cn("truncate", !entry.isDirectory && "text-gray-300")}>
          {entry.name}
        </span>
      </div>
      {isOpen && (
        <div>
          {isLoading ? (
            <div className="pl-8 py-1 text-xs text-gray-500">Loading...</div>
          ) : (
            children.map((child) => (
              <FileTreeItem key={child.path} entry={child} level={level + 1} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface FileTreeProps {
  rootPath: string;
}

export const FileTree = ({ rootPath }: FileTreeProps) => {
  const [rootEntries, setRootEntries] = useState<FileEntry[]>([]);

  useEffect(() => {
    const loadRoot = () => {
      window.ipcRenderer
        .readDirectory(rootPath)
        .then((result) => {
          setRootEntries(result);
        })
        .catch((error) => {
          console.error("Failed to read root directory:", error);
        });
    };
    loadRoot();
  }, [rootPath]);

  return (
    <div className="flex-1 overflow-y-auto">
      {rootEntries.map((entry) => (
        <FileTreeItem key={entry.path} entry={entry} level={0} />
      ))}
    </div>
  );
};
