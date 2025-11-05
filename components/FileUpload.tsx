'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUpload: (content: string, filename: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onFileUpload,
  accept = '.yml,.yaml',
  maxSizeMB = 5,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = accept.split(',').map(ext => ext.trim());
    const hasValidExtension = validExtensions.some(ext =>
      fileName.endsWith(ext.replace('.', ''))
    );

    if (!hasValidExtension) {
      toast.error('Invalid file type', {
        description: `Please upload a file with extension: ${accept}`,
      });
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error('File too large', {
        description: `Maximum file size is ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`,
      });
      return false;
    }

    return true;
  };

  const readFile = useCallback(
    (file: File) => {
      if (!validateFile(file)) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (content) {
            setUploadedFile({
              name: file.name,
              size: file.size,
            });
            onFileUpload(content, file.name);
            toast.success('File uploaded successfully', {
              description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
            });
          }
        } catch (error) {
          toast.error('Failed to read file', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file', {
          description: 'An error occurred while reading the file',
        });
      };

      reader.readAsText(file);
    },
    [onFileUpload, maxSizeMB, validateFile]
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        readFile(files[0]);
      }
    },
    [readFile]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        readFile(files[0]);
      }
    },
    [readFile]
  );

  const handleClear = useCallback(() => {
    setUploadedFile(null);
    toast.info('File cleared');
  }, []);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upload Docker Compose File</h3>
          {uploadedFile && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {!uploadedFile ? (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center
              rounded-lg border-2 border-dashed p-12 transition-colors
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
            `}
          >
            <Upload
              className={`h-12 w-12 mb-4 transition-colors ${
                isDragging ? 'text-primary' : 'text-muted-foreground'
              }`}
            />

            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                {isDragging ? 'Drop your file here' : 'Drag & drop your Docker Compose file'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: {accept} (max {maxSizeMB}MB)
              </p>
            </div>

            <input
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Tip:</strong> Make sure your docker-compose.yml is valid before uploading.</p>
          <p>📄 The file will be parsed and validated automatically.</p>
        </div>
      </div>
    </Card>
  );
}
