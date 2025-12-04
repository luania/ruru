import { useStore } from "../../store/useStore";
import { FileTree } from "../FileTree";
import { Button } from "../ui/Button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Sidebar = () => {
  const { workingDirectory } = useStore();
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gray-900 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Explorer
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => navigate("/")}
          title="Back to Home"
        >
          <Home size={14} />
        </Button>
      </div>
      {workingDirectory ? (
        <FileTree rootPath={workingDirectory} />
      ) : (
        <div className="p-4 text-sm text-gray-500">No folder opened</div>
      )}
    </div>
  );
};
