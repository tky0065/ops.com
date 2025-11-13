'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  FileCheck,
} from 'lucide-react';
import type { ValidationResult } from '@/lib/validators/manifestValidator';

interface ValidationReportProps {
  kubernetes?: ValidationResult;
  dockerStack?: ValidationResult;
  helm?: ValidationResult;
}

export function ValidationReport({ kubernetes, dockerStack, helm }: ValidationReportProps) {
  if (!kubernetes && !dockerStack && !helm) {
    return null;
  }

  const hasResults = kubernetes || dockerStack || helm;
  if (!hasResults) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          <CardTitle>Validation Report</CardTitle>
        </div>
        <CardDescription>
          Manifest validation results with quality score and improvement suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={kubernetes ? 'kubernetes' : dockerStack ? 'swarm' : 'helm'}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kubernetes" disabled={!kubernetes}>
              Kubernetes
              {kubernetes && (
                <Badge variant={kubernetes.valid ? 'default' : 'destructive'} className="ml-2">
                  {kubernetes.summary.errorCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="swarm" disabled={!dockerStack}>
              Docker Stack
              {dockerStack && (
                <Badge variant={dockerStack.valid ? 'default' : 'destructive'} className="ml-2">
                  {dockerStack.summary.errorCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="helm" disabled={!helm}>
              Helm Chart
              {helm && (
                <Badge variant={helm.valid ? 'default' : 'destructive'} className="ml-2">
                  {helm.summary.errorCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {kubernetes && (
            <TabsContent value="kubernetes">
              <ValidationResultDisplay result={kubernetes} platform="Kubernetes" />
            </TabsContent>
          )}

          {dockerStack && (
            <TabsContent value="swarm">
              <ValidationResultDisplay result={dockerStack} platform="Docker Swarm" />
            </TabsContent>
          )}

          {helm && (
            <TabsContent value="helm">
              <ValidationResultDisplay result={helm} platform="Helm Chart" />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ValidationResultDisplayProps {
  result: ValidationResult;
  platform: string;
}

function ValidationResultDisplay({ result, platform }: ValidationResultDisplayProps) {
  return (
    <div className="space-y-6 mt-4">
      {/* Quality Score */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h3 className="text-lg font-semibold">Quality Score</h3>
          <p className="text-sm text-muted-foreground">
            {result.summary.validResources} of {result.summary.totalResources} resources valid
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QualityScoreIndicator score={result.score} />
          <div className="text-right">
            <div className="text-3xl font-bold">{result.score}</div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          title="Errors"
          count={result.summary.errorCount}
          color="red"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
          title="Warnings"
          count={result.summary.warningCount}
          color="yellow"
        />
        <SummaryCard
          icon={<Info className="h-5 w-5 text-blue-500" />}
          title="Info"
          count={result.summary.infoCount}
          color="blue"
        />
      </div>

      {/* Status Alert */}
      {result.valid ? (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            All {platform} manifests are valid and ready for deployment!
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Found {result.summary.errorCount} critical error{result.summary.errorCount !== 1 ? 's' : ''} that must be fixed before deployment.
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Suggestions</h3>
          </div>
          <ul className="space-y-2">
            {result.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <IssueList
          title="Errors"
          issues={result.errors}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          severity="error"
        />
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <IssueList
          title="Warnings"
          issues={result.warnings}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          severity="warning"
        />
      )}

      {/* Info */}
      {result.info.length > 0 && (
        <IssueList
          title="Informational"
          issues={result.info}
          icon={<Info className="h-4 w-4 text-blue-500" />}
          severity="info"
        />
      )}
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: 'red' | 'yellow' | 'blue';
}

function SummaryCard({ icon, title, count, color }: SummaryCardProps) {
  const bgColor = {
    red: 'bg-red-50 dark:bg-red-950',
    yellow: 'bg-yellow-50 dark:bg-yellow-950',
    blue: 'bg-blue-50 dark:bg-blue-950',
  }[color];

  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="text-2xl font-bold">{count}</span>
      </div>
    </div>
  );
}

interface QualityScoreIndicatorProps {
  score: number;
}

function QualityScoreIndicator({ score }: QualityScoreIndicatorProps) {
  if (score >= 90) {
    return <TrendingUp className="h-6 w-6 text-green-500" />;
  } else if (score >= 70) {
    return <Minus className="h-6 w-6 text-yellow-500" />;
  } else {
    return <TrendingDown className="h-6 w-6 text-red-500" />;
  }
}

interface IssueListProps {
  title: string;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    resource: string;
    kind: string;
    field?: string;
    message: string;
    suggestion?: string;
    line?: number;
  }>;
  icon: React.ReactNode;
  severity: 'error' | 'warning' | 'info';
}

function IssueList({ title, issues, icon, severity }: IssueListProps) {
  const borderColor = {
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500',
  }[severity];

  const bgColor = {
    error: 'bg-red-50 dark:bg-red-950',
    warning: 'bg-yellow-50 dark:bg-yellow-950',
    info: 'bg-blue-50 dark:bg-blue-950',
  }[severity];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">
          {title} ({issues.length})
        </h3>
      </div>
      <div className="space-y-2">
        {issues.map((issue, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${borderColor} ${bgColor}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {issue.kind}
                  </Badge>
                  <span className="text-sm font-medium">{issue.resource}</span>
                  {issue.field && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {issue.field}
                    </span>
                  )}
                </div>
                <p className="text-sm">{issue.message}</p>
                {issue.suggestion && (
                  <p className="text-xs text-muted-foreground italic">
                    💡 {issue.suggestion}
                  </p>
                )}
              </div>
              {issue.line && (
                <Badge variant="secondary" className="text-xs">
                  Line {issue.line}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
