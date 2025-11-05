'use client';

import { useState, memo } from 'react';
import dynamic from 'next/dynamic';
import { Copy, Download, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// Lazy load Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
      <Loader2 className="h-8 w-8 animate-spin mb-2" />
      <div className="text-sm">Loading editor...</div>
    </div>
  ),
});

interface YamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  title?: string;
  language?: string;
  height?: string;
  fileName?: string;
}

export const YamlEditor = memo(function YamlEditor({
  value,
  onChange,
  readOnly = false,
  title,
  language = 'yaml',
  height = '500px',
  fileName,
}: YamlEditorProps) {
  const [copied, setCopied] = useState(false);

  // Use shorter height on mobile
  const responsiveHeight = typeof window !== 'undefined' && window.innerWidth < 768 ? '300px' : height;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([value], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `${title?.toLowerCase().replace(/\s+/g, '-') || 'file'}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded');
    } catch (error) {
      toast.error('Failed to download file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div>
          {title && <h4 className="text-sm font-semibold">{title}</h4>}
          {fileName && !title && (
            <p className="text-sm font-mono text-muted-foreground">{fileName}</p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-9 min-w-[44px]"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Copy</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-9 min-w-[44px]"
          >
            <Download className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ height: responsiveHeight }}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(newValue) => {
            if (onChange && newValue !== undefined) {
              onChange(newValue);
            }
          }}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            folding: true,
            renderLineHighlight: 'all',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <div className="text-sm text-gray-400">Loading editor...</div>
            </div>
          }
        />
      </div>

      {/* Footer Info */}
      <div className="border-t bg-muted/30 px-4 py-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{language.toUpperCase()}</span>
          <span>
            {value.split('\n').length} lines • {value.length} characters
          </span>
        </div>
      </div>
    </Card>
  );
});
