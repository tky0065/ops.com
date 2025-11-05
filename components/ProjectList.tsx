'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Trash2,
  Download,
  Search,
  Clock,
  HardDrive,
  AlertCircle
} from 'lucide-react';
import { LocalStorageManager } from '@/lib/storage/localStorage';
import { Project } from '@/types/project';
import { toast } from 'sonner';

interface ProjectListProps {
  onProjectSelect?: (project: Project) => void;
}

export function ProjectList({ onProjectSelect }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 });

  const loadProjects = useCallback(() => {
    try {
      const result = LocalStorageManager.getAllProjects();

      if (result.success && result.data) {
        // Map ProjectListItem[] to Project[] (expand with full data)
        const fullProjects: Project[] = [];
        for (const item of result.data) {
          const projectResult = LocalStorageManager.getProject(item.id);
          if (projectResult.success && projectResult.data) {
            fullProjects.push(projectResult.data);
          }
        }
        setProjects(fullProjects);
      } else {
        toast.error('Failed to load projects', {
          description: result.error || 'Unknown error',
        });
      }

      // Calculate storage usage
      const spaceInfo = LocalStorageManager.checkStorageSpace();
      setStorageUsage({
        used: spaceInfo.used / (1024 * 1024), // Convert to MB
        total: spaceInfo.limit / (1024 * 1024) // Convert to MB
      });
    } catch (error) {
      toast.error('Failed to load projects', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDelete = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        LocalStorageManager.deleteProject(projectId);
        loadProjects();
        toast.success('Project deleted');
      } catch (error) {
        toast.error('Failed to delete project', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  const handleLoad = (project: Project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
      toast.success('Project loaded', {
        description: `"${project.name}" has been loaded`,
      });
    }
  };

  const handleExport = (project: Project) => {
    try {
      const json = JSON.stringify(project, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}-project.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Project exported');
    } catch (error) {
      toast.error('Failed to export project', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStorageColor = () => {
    const percentage = (storageUsage.used / storageUsage.total) * 100;
    if (percentage > 80) return 'text-red-500';
    if (percentage > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Storage Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <HardDrive className={`h-4 w-4 ${getStorageColor()}`} />
          <span className={getStorageColor()}>
            {storageUsage.used.toFixed(2)} MB / {storageUsage.total} MB
          </span>
        </div>
      </div>

      {/* Storage Warning */}
      {storageUsage.used / storageUsage.total > 0.8 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Storage almost full
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You're using {((storageUsage.used / storageUsage.total) * 100).toFixed(0)}% of your
                browser storage. Consider deleting old projects.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try a different search term'
              : 'Start by converting a Docker Compose file'}
          </p>
          {!searchQuery && (
            <Button asChild>
              <a href="/convert">Convert Docker Compose</a>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              {/* Project Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg truncate flex-1">{project.name}</h3>
                  <Badge variant="outline">
                    {project.options.targetPlatform === 'both'
                      ? 'K8s + Swarm'
                      : project.options.targetPlatform === 'kubernetes'
                      ? 'Kubernetes'
                      : 'Docker Swarm'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(new Date(project.updatedAt).getTime())}</span>
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Services:</span>
                  <span className="font-medium">
                    {Object.keys(project.dockerCompose.parsed.services).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proxy:</span>
                  <span className="font-medium capitalize">
                    {project.options.proxyType === 'none' ? 'None' : project.options.proxyType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Health Checks:</span>
                  <span className="font-medium">
                    {project.options.addHealthChecks ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleLoad(project)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Load
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(project)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
