'use client';

import React, { useMemo, useState } from 'react';
import { diffLines, Change } from 'diff';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Plus,
  Minus,
  Download,
} from 'lucide-react';

interface DiffViewerProps {
  originalYaml: string;
  kubernetesYaml?: Record<string, string>;
  dockerStackYaml?: string;
  helmChartYaml?: string;
}

interface DiffSummary {
  additions: number;
  deletions: number;
  modifications: number;
}

export function DiffViewer({
  originalYaml,
  kubernetesYaml,
  dockerStackYaml,
  helmChartYaml,
}: DiffViewerProps) {
  const [currentDiffIndex, setCurrentDiffIndex] = useState(0);

  // Prepare comparison data
  const comparisons = useMemo(() => {
    const data: Array<{
      name: string;
      newContent: string;
      type: 'kubernetes' | 'swarm' | 'helm';
    }> = [];

    // Add Kubernetes deployments
    if (kubernetesYaml && Object.keys(kubernetesYaml).length > 0) {
      Object.entries(kubernetesYaml).forEach(([filename, content]) => {
        data.push({
          name: `Kubernetes: ${filename}`,
          newContent: content,
          type: 'kubernetes',
        });
      });
    }

    // Add Docker Stack
    if (dockerStackYaml) {
      data.push({
        name: 'Docker Stack',
        newContent: dockerStackYaml,
        type: 'swarm',
      });
    }

    // Add Helm Chart
    if (helmChartYaml) {
      data.push({
        name: 'Helm Chart: values.yaml',
        newContent: helmChartYaml,
        type: 'helm',
      });
    }

    return data;
  }, [kubernetesYaml, dockerStackYaml, helmChartYaml]);

  if (comparisons.length === 0) {
    return null;
  }

  const currentComparison = comparisons[currentDiffIndex];
  const diff = diffLines(originalYaml, currentComparison.newContent);
  const summary = calculateDiffSummary(diff);

  const handlePrevious = () => {
    setCurrentDiffIndex((prev) => (prev > 0 ? prev - 1 : comparisons.length - 1));
  };

  const handleNext = () => {
    setCurrentDiffIndex((prev) => (prev < comparisons.length - 1 ? prev + 1 : 0));
  };

  const handleExportDiff = () => {
    const diffText = generateDiffText(diff, originalYaml, currentComparison.name);
    const blob = new Blob([diffText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff-${currentComparison.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            <CardTitle>Compare Changes</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {comparisons.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentDiffIndex + 1} / {comparisons.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDiff}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Diff
            </Button>
          </div>
        </div>
        <CardDescription>
          Comparing: <strong>{currentComparison.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-green-600" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              +{summary.additions} additions
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-red-600" />
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              -{summary.deletions} deletions
            </Badge>
          </div>
          {summary.modifications > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              ~{summary.modifications} modifications
            </Badge>
          )}
        </div>

        {/* Diff View */}
        <Tabs defaultValue="split" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="unified">Unified View</TabsTrigger>
          </TabsList>

          <TabsContent value="split" className="mt-4">
            <SplitDiffView
              originalYaml={originalYaml}
              newYaml={currentComparison.newContent}
              diff={diff}
            />
          </TabsContent>

          <TabsContent value="unified" className="mt-4">
            <UnifiedDiffView diff={diff} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface SplitDiffViewProps {
  originalYaml: string;
  newYaml: string;
  diff: Change[];
}

function SplitDiffView({ originalYaml, newYaml, diff }: SplitDiffViewProps) {
  const originalLines = originalYaml.split('\n');
  const newLines = newYaml.split('\n');

  return (
    <div className="grid grid-cols-2 gap-4 overflow-hidden">
      {/* Original */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Original (Docker Compose)</h4>
        <div className="rounded-lg border bg-muted/50">
          <pre className="overflow-x-auto p-4 text-xs font-mono max-h-[600px] overflow-y-auto">
            {originalLines.map((line, idx) => (
              <div key={idx} className="flex">
                <span className="text-muted-foreground mr-4 select-none w-8 text-right">
                  {idx + 1}
                </span>
                <span>{line || ' '}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* New */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Generated</h4>
        <div className="rounded-lg border bg-muted/50">
          <pre className="overflow-x-auto p-4 text-xs font-mono max-h-[600px] overflow-y-auto">
            {newLines.map((line, idx) => (
              <div key={idx} className="flex">
                <span className="text-muted-foreground mr-4 select-none w-8 text-right">
                  {idx + 1}
                </span>
                <span>{line || ' '}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface UnifiedDiffViewProps {
  diff: Change[];
}

function UnifiedDiffView({ diff }: UnifiedDiffViewProps) {
  return (
    <div className="rounded-lg border bg-muted/50">
      <pre className="overflow-x-auto p-4 text-xs font-mono max-h-[600px] overflow-y-auto">
        {diff.map((part, index) => {
          const lines = part.value.split('\n').filter((l) => l.length > 0 || index < diff.length - 1);

          return lines.map((line, lineIndex) => {
            if (part.added) {
              return (
                <div
                  key={`${index}-${lineIndex}`}
                  className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100"
                >
                  <span className="select-none mr-2 text-green-600 dark:text-green-400">+</span>
                  {line || ' '}
                </div>
              );
            } else if (part.removed) {
              return (
                <div
                  key={`${index}-${lineIndex}`}
                  className="bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100"
                >
                  <span className="select-none mr-2 text-red-600 dark:text-red-400">-</span>
                  {line || ' '}
                </div>
              );
            } else {
              return (
                <div key={`${index}-${lineIndex}`}>
                  <span className="select-none mr-2 text-muted-foreground"> </span>
                  {line || ' '}
                </div>
              );
            }
          });
        })}
      </pre>
    </div>
  );
}

// Helper functions
function calculateDiffSummary(diff: Change[]): DiffSummary {
  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  diff.forEach((part) => {
    const lines = part.value.split('\n').filter((l) => l.length > 0);
    if (part.added) {
      additions += lines.length;
    } else if (part.removed) {
      deletions += lines.length;
    }
  });

  // Estimate modifications (pairs of adds/removes close together)
  const minChanges = Math.min(additions, deletions);
  modifications = Math.floor(minChanges * 0.5); // Rough estimate

  return { additions, deletions, modifications };
}

function generateDiffText(diff: Change[], originalName: string, newName: string): string {
  const lines: string[] = [];
  lines.push(`--- ${originalName}`);
  lines.push(`+++ ${newName}`);
  lines.push('');

  diff.forEach((part) => {
    const prefix = part.added ? '+' : part.removed ? '-' : ' ';
    const partLines = part.value.split('\n');
    partLines.forEach((line) => {
      if (line || prefix !== ' ') {
        lines.push(`${prefix}${line}`);
      }
    });
  });

  return lines.join('\n');
}
