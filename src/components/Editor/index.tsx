import { useStore } from "../../store/useStore";

export const Editor = () => {
  const { openapi } = useStore();

  return (
    <div className="p-8 h-full overflow-auto bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">
          API Definition
        </h2>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
            {JSON.stringify(openapi, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
