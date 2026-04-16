import React from 'react';
import { Folder, FileCode, FileJson, Code, Info, File, ChevronRight } from 'lucide-react';

interface FileTreeProps {
  items: any[];
  depth?: number;
  activeFile: string | null;
  fetchFiles: (path: string) => void;
  readFile: (path: string) => void;
  setContextMenu: (menu: { x: number, y: number, item: any } | null) => void;
  isRenaming: string | null;
  renameValue: string;
  setRenameValue: (val: string) => void;
  setIsRenaming: (val: string | null) => void;
  renameFile: (path: string, newName: string) => void;
}

export const FileTree = ({ 
  items, 
  depth = 0, 
  activeFile, 
  fetchFiles, 
  readFile, 
  setContextMenu, 
  isRenaming, 
  renameValue, 
  setRenameValue, 
  setIsRenaming, 
  renameFile 
}: FileTreeProps) => {
  const getFileIcon = (name: string, isDirectory: boolean) => {
    if (isDirectory) return <Folder size={14} className="text-indigo-500" />;
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode size={14} className="text-blue-400" />;
      case 'json':
        return <FileJson size={14} className="text-yellow-400" />;
      case 'css':
        return <Code size={14} className="text-pink-400" />;
      case 'md':
        return <Info size={14} className="text-zinc-400" />;
      default:
        return <File size={14} className="text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <div key={item.path}>
          <button 
            onClick={() => item.isDirectory ? fetchFiles(item.path) : readFile(item.path)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, item });
            }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-all group ${activeFile === item.path ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'}`}
            style={{ paddingLeft: `${(depth + 1) * 12}px` }}
          >
            <div className="shrink-0">
              {getFileIcon(item.name, item.isDirectory)}
            </div>
            {isRenaming === item.path ? (
              <input 
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => setIsRenaming(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameFile(item.path, renameValue);
                  if (e.key === 'Escape') setIsRenaming(null);
                }}
                className="flex-1 bg-zinc-950 border border-indigo-500/50 rounded px-1 py-0.5 text-[10px] focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1 text-left font-medium">{item.name}</span>
            )}
            {item.isDirectory && (
              <ChevronRight size={12} className="text-zinc-600 group-hover:text-zinc-400 transition-transform" />
            )}
          </button>
          {item.isDirectory && item.children && item.children.length > 0 && (
            <FileTree 
              items={item.children} 
              depth={depth + 1} 
              activeFile={activeFile}
              fetchFiles={fetchFiles}
              readFile={readFile}
              setContextMenu={setContextMenu}
              isRenaming={isRenaming}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              setIsRenaming={setIsRenaming}
              renameFile={renameFile}
            />
          )}
        </div>
      ))}
    </div>
  );
};
