export const Sidebar = () => {
  return (
    <div className="w-64 border-r border-gray-700 bg-gray-800 p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-4 text-blue-400">API Editor</h1>
      <nav className="flex-1">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Overview
          </h3>
          <ul>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">
              Info
            </li>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">
              Servers
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Paths
          </h3>
          <ul>
            <li className="p-2 hover:bg-gray-700 rounded cursor-pointer text-sm text-gray-400 italic">
              No paths defined
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};
