import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  filePath: string;
  content: string;
  theme: 'dark' | 'light';
  onChange: (value: string | undefined) => void;
  onSave: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ filePath, content, theme, onChange, onSave }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">{filePath}</span>
        <button onClick={onSave} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold">
          Save & Commit
        </button>
      </div>
      <Editor
        height="100%"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        path={filePath || 'file.txt'}
        defaultLanguage="typescript"
        value={content}
        onChange={onChange}
        options={{
          minimap: { enabled: true },
          fontSize: 13,
          fontFamily: 'JetBrains Mono, monospace',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 20, bottom: 20 }
        }}
      />
    </div>
  );
};