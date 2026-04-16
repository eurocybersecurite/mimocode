import React, { Fragment } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Plus, Folder, RefreshCw, ChevronRight, FileCode, FileJson, 
  Code, Info, File, X, Save, Layout, Activity 
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface FilesPageProps {
  currentPath: string;
  fetchFiles: (path: string) => void;
  readFile: (path: string) => void;
  activeFile: string | null;
  fileTree: any[];
  isCreatingFile: boolean;
  setIsCreatingFile: (val: boolean) => void;
  isCreatingDir: boolean;
  setIsCreatingDir: (val: boolean) => void;
  newItemName: string;
  setNewItemName: (val: string) => void;
  handleCreateItem: (isDir: boolean) => void;
  fileSearchTerm: string;
  searchFiles: (term: string) => void;
  openFiles: any[];
  closeFile: (path: string) => void;
  hasUnsavedChanges: boolean;
  showEditorSearch: boolean;
  setShowEditorSearch: (val: boolean) => void;
  showDiff: boolean;
  setShowDiff: (val: boolean) => void;
  saveFile: () => void;
  isSaving: boolean;
  fileContent: string;
  setFileContent: (val: string) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  setOpenFiles: React.Dispatch<React.SetStateAction<any[]>>;
  theme: string;
  originalContent: string;
  editorSearchTerm: string;
  setEditorSearchTerm: (val: string) => void;
  editorReplaceTerm: string;
  setEditorReplaceTerm: (val: string) => void;
  handleReplace: () => void;
  getFileIcon: (name: string, isDirectory: boolean) => React.ReactNode;
}

export function FilesPage({
  currentPath,
  fetchFiles,
  readFile,
  activeFile,
  fileTree,
  isCreatingFile,
  setIsCreatingFile,
  isCreatingDir,
  setIsCreatingDir,
  newItemName,
  setNewItemName,
  handleCreateItem,
  fileSearchTerm,
  searchFiles,
  openFiles,
  closeFile,
  hasUnsavedChanges,
  showEditorSearch,
  setShowEditorSearch,
  showDiff,
  setShowDiff,
  saveFile,
  isSaving,
  fileContent,
  setFileContent,
  setHasUnsavedChanges,
  setOpenFiles,
  theme,
  originalContent,
  editorSearchTerm,
  setEditorSearchTerm,
  editorReplaceTerm,
  setEditorReplaceTerm,
  handleReplace,
  getFileIcon
}: FilesPageProps) {
  const FileTree = ({ items, depth = 0 }: { items: any[], depth?: number }) => {
    return (
      <div className="space-y-0.5">
        {items.map((item: any) => (
          <div key={item.path}>
            <button 
              onClick={() => item.isDirectory ? fetchFiles(item.path) : readFile(item.path)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-all group ${
                activeFile === item.path ? 'bg-indigo-600/10 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
              style={{ paddingLeft: `${(depth * 12) + 8}px` }}
            >
              <div className="shrink-0">
                {getFileIcon(item.name, item.isDirectory)}
              </div>
              <span className="truncate flex-1 text-left">{item.name}</span>
              {item.isDirectory && <ChevronRight size={10} className="text-zinc-700 group-hover:text-zinc-500" />}
            </button>
            {item.isDirectory && item.children && item.children.length > 0 && (
              <FileTree items={item.children} depth={depth + 1} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      key="files"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex overflow-hidden"
    >
      {/* File Explorer */}
      <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-950/30">
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Explorer</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsCreatingFile(true)} 
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                title="New File"
              >
                <Plus size={14} />
              </button>
              <button 
                onClick={() => setIsCreatingDir(true)} 
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                title="New Folder"
              >
                <Folder size={14} />
              </button>
              <button 
                onClick={() => fetchFiles(currentPath)} 
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                title="Refresh"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            <button 
              onClick={() => fetchFiles('.')}
              className="text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors whitespace-nowrap"
            >
              root
            </button>
            {currentPath !== '.' && currentPath.split('/').map((part, i, arr) => (
              <Fragment key={i}>
                <ChevronRight size={10} className="text-zinc-700 shrink-0" />
                <button 
                  onClick={() => fetchFiles(arr.slice(0, i + 1).join('/'))}
                  className={`text-[10px] whitespace-nowrap transition-colors ${i === arr.length - 1 ? 'text-indigo-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {part}
                </button>
              </Fragment>
            ))}
          </div>

          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input 
              type="text"
              placeholder="Search files..."
              value={fileSearchTerm}
              onChange={(e) => searchFiles(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-[10px] focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {(isCreatingFile || isCreatingDir) && (
            <div className="px-2 py-1.5 mb-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                {isCreatingDir ? <Folder size={12} className="text-indigo-500" /> : <File size={12} className="text-zinc-500" />}
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  New {isCreatingDir ? 'Folder' : 'File'}
                </span>
              </div>
              <input 
                autoFocus
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateItem(isCreatingDir);
                  if (e.key === 'Escape') {
                    setIsCreatingFile(false);
                    setIsCreatingDir(false);
                    setNewItemName('');
                  }
                }}
                placeholder="Name..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500/50"
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => handleCreateItem(isCreatingDir)}
                  className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded"
                >
                  Create
                </button>
                <button 
                  onClick={() => {
                    setIsCreatingFile(false);
                    setIsCreatingDir(false);
                    setNewItemName('');
                  }}
                  className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {currentPath !== '.' && !fileSearchTerm && (
            <button 
              onClick={() => fetchFiles(currentPath.split('/').slice(0, -1).join('/') || '.')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" /> ..
            </button>
          )}
          <FileTree items={fileTree} />
          {fileTree.length === 0 && (
            <div className="py-8 text-center text-zinc-600">
              <p className="text-[10px] font-medium">No files found</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-zinc-900/20">
        {activeFile ? (
          <>
            <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center overflow-x-auto no-scrollbar">
              {openFiles.map(file => (
                <div 
                  key={file.path}
                  onClick={() => readFile(file.path)}
                  className={`h-full px-4 flex items-center gap-2 border-r border-zinc-800 cursor-pointer transition-all min-w-[120px] max-w-[200px] group ${activeFile === file.path ? 'bg-zinc-950 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
                >
                  <FileCode size={14} className={activeFile === file.path ? 'text-indigo-400' : 'text-zinc-600'} />
                  <span className="text-xs font-medium truncate flex-1">{file.path.split('/').pop()}</span>
                  {file.isDirty && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.path);
                    }}
                    className="p-1 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {getFileIcon(activeFile.split('/').pop() || '', false)}
                  {activeFile}
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-1.5 text-[9px] text-yellow-500 font-bold uppercase tracking-widest">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                    Unsaved
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-600 font-mono italic mr-2">Auto-saves every 2s</span>
                <button 
                  onClick={() => setShowEditorSearch(!showEditorSearch)}
                  className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${showEditorSearch ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  <Search size={12} /> {showEditorSearch ? 'Hide Search' : 'Search & Replace'}
                </button>
                <button 
                  onClick={() => setShowDiff(!showDiff)}
                  className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${showDiff ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  <Layout size={12} /> {showDiff ? 'Hide Diff' : 'Show Diff'}
                </button>
                <button 
                  onClick={saveFile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white text-[10px] font-bold uppercase rounded transition-colors"
                >
                  <Save size={12} /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {showEditorSearch && (
                <div className="bg-zinc-900 border-b border-zinc-800 p-2 flex items-center gap-2 animate-in slide-in-from-top duration-200">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input 
                        type="text"
                        placeholder="Find..."
                        value={editorSearchTerm}
                        onChange={(e) => setEditorSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-[10px] text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Activity size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input 
                        type="text"
                        placeholder="Replace with..."
                        value={editorReplaceTerm}
                        onChange={(e) => setEditorReplaceTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-[10px] text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleReplace}
                    className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase rounded transition-colors"
                  >
                    Replace All
                  </button>
                  <button 
                    onClick={() => setShowEditorSearch(false)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {showDiff ? (
                <div className="flex-1 overflow-auto bg-zinc-950">
                  <ReactDiffViewer
                    oldValue={originalContent}
                    newValue={fileContent}
                    splitView={true}
                    useDarkTheme={theme === 'dark'}
                    styles={{
                      variables: {
                        dark: {
                          diffViewerBackground: '#09090b',
                          diffViewerColor: '#d4d4d8',
                          addedBackground: '#064e3b',
                          addedColor: '#34d399',
                          removedBackground: '#7f1d1d',
                          removedColor: '#f87171',
                          wordAddedBackground: '#065f46',
                          wordRemovedBackground: '#991b1b',
                          addedGutterBackground: '#064e3b',
                          removedGutterBackground: '#7f1d1d',
                          gutterColor: '#52525b',
                          codeFoldGutterBackground: '#18181b',
                          codeFoldBackground: '#18181b',
                          codeFoldContentColor: '#71717a',
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <Editor
                  height="100%"
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  path={activeFile || 'file.txt'}
                  defaultLanguage="typescript"
                  value={fileContent}
                  onChange={(value) => {
                    const newContent = value || '';
                    setFileContent(newContent);
                    setHasUnsavedChanges(true);
                    // Update openFiles state
                    setOpenFiles(prev => prev.map(f => f.path === activeFile ? { ...f, content: newContent, isDirty: true } : f));
                  }}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 20, bottom: 20 }
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-4">
            <FileCode size={64} className="opacity-10" />
            <p className="text-sm font-medium">Select a file to edit</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
