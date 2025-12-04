import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { FolderOpen, Clock, X } from "lucide-react";
import { Button } from "../../components/ui/Button";

export const Home = () => {
  const navigate = useNavigate();
  const {
    setWorkingDirectory,
    setActiveFilePath,
    setOpenapi,
    recentPaths,
    addRecentPath,
    removeRecentPath,
  } = useStore();

  const handleOpenProject = async () => {
    try {
      const result = await window.ipcRenderer.openDirectory();
      if (!result.canceled && result.filePaths.length > 0) {
        const path = result.filePaths[0];
        addRecentPath(path);
        setWorkingDirectory(path);
        setActiveFilePath(null);
        setOpenapi({
          openapi: "3.0.0",
          info: {
            title: "New API",
            version: "1.0.0",
          },
          paths: {},
        });
        navigate("/editor");
      }
    } catch (error) {
      console.error("Failed to open directory:", error);
    }
  };

  const handleOpenRecent = (path: string) => {
    addRecentPath(path);
    setWorkingDirectory(path);
    setActiveFilePath(null);
    setOpenapi({
      openapi: "3.0.0",
      info: {
        title: "New API",
        version: "1.0.0",
      },
      paths: {},
    });
    navigate("/editor");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 text-blue-500 tracking-tight">
          Ruru
        </h1>
        <p className="text-gray-400 text-lg">OpenAPI Visual Editor</p>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Button
            onClick={handleOpenProject}
            size="lg"
            className="w-full py-6 text-lg gap-3 shadow-lg shadow-blue-900/20"
          >
            <FolderOpen size={24} />
            Open Local Project
          </Button>
        </div>

        {recentPaths.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} />
              Recent Projects
            </h3>
            <div className="bg-gray-800/50 rounded-lg border border-gray-800 overflow-hidden">
              {recentPaths.map((path) => (
                <div
                  key={path}
                  className="group flex items-center justify-between p-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
                >
                  <button
                    onClick={() => handleOpenRecent(path)}
                    className="flex-1 text-left text-sm text-gray-300 hover:text-blue-400 truncate mr-4 font-mono"
                    title={path}
                  >
                    {path}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentPath(path);
                    }}
                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
