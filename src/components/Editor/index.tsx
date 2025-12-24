import { useEffect, useState } from "react";
import { CodeEditor } from "../CodeEditor";
import { OpenAPIEditor } from "../OpenAPIEditor";
import { useStore } from "../../store/useStore";
import { isOpenAPI } from "../../lib/openapi";

export const Editor = () => {
  const { activeFilePath } = useStore();
  const [isOpenAPIFile, setIsOpenAPIFile] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkFileType = () => {
      if (!activeFilePath) {
        setIsOpenAPIFile(false);
        return;
      }

      // Check if file extension is yaml or json
      if (!activeFilePath.match(/\.(yaml|yml|json)$/i)) {
        setIsOpenAPIFile(false);
        return;
      }

      setChecking(true);
      window.ipcRenderer
        .readFile(activeFilePath)
        .then((content) => {
          setIsOpenAPIFile(isOpenAPI(content));
        })
        .catch((error) => {
          console.error("Failed to check file type", error);
          setIsOpenAPIFile(false);
        })
        .finally(() => {
          setChecking(false);
        });
    };

    checkFileType();
  }, [activeFilePath]);

  if (checking) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-gray-500">
        Checking file type...
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-[#1e1e1e]">
      {isOpenAPIFile ? <OpenAPIEditor /> : <CodeEditor />}
    </div>
  );
};
