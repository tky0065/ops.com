import {
  Project,
  ProjectListItem,
  StorageResponse,
  StorageSpaceInfo,
} from '@/types/project';

/**
 * LocalStorage Key Prefix
 */
const STORAGE_PREFIX = 'devops-accelerator';
const PROJECTS_KEY = `${STORAGE_PREFIX}:projects`;

/**
 * LocalStorage size limit (5MB in bytes)
 */
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB

/**
 * Warning threshold (80% of limit)
 */
const WARNING_THRESHOLD = 0.8;

/**
 * LocalStorage Manager Class
 * Handles all LocalStorage operations for project persistence
 */
export class LocalStorageManager {
  /**
   * Check if LocalStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate unique project ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get all project IDs
   */
  private static getProjectIds(): string[] {
    try {
      const idsJson = localStorage.getItem(PROJECTS_KEY);
      return idsJson ? JSON.parse(idsJson) : [];
    } catch (error) {
      console.error('Error reading project IDs:', error);
      return [];
    }
  }

  /**
   * Save project IDs
   */
  private static saveProjectIds(ids: string[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(ids));
  }

  /**
   * Get storage key for a project
   */
  private static getProjectKey(projectId: string): string {
    return `${STORAGE_PREFIX}:project:${projectId}`;
  }

  /**
   * Save a new project
   */
  static saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): StorageResponse<Project> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'LocalStorage is not available in this browser',
      };
    }

    try {
      // Check storage space before saving
      const spaceInfo = this.checkStorageSpace();
      if (spaceInfo.usagePercentage >= 100) {
        const sizeMB = (spaceInfo.used / (1024 * 1024)).toFixed(2);
        const limitMB = (spaceInfo.limit / (1024 * 1024)).toFixed(2);
        return {
          success: false,
          error: `Storage limit exceeded (${sizeMB}MB / ${limitMB}MB used).\n\nSuggestions:\n  • Delete old projects from the Projects page\n  • Export important projects as ZIP before deleting\n  • Clear browser cache and try again`,
        };
      }

      const now = new Date().toISOString();
      const newProject: Project = {
        ...project,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      };

      // Save project data
      const projectKey = this.getProjectKey(newProject.id);
      localStorage.setItem(projectKey, JSON.stringify(newProject));

      // Update project IDs list
      const ids = this.getProjectIds();
      ids.push(newProject.id);
      this.saveProjectIds(ids);

      return {
        success: true,
        data: newProject,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const spaceInfo = this.checkStorageSpace();
        const sizeMB = (spaceInfo.used / (1024 * 1024)).toFixed(2);
        const limitMB = (spaceInfo.limit / (1024 * 1024)).toFixed(2);
        return {
          success: false,
          error: `Storage quota exceeded (${sizeMB}MB / ${limitMB}MB used).\n\nSuggestions:\n  • Delete unused projects to free space\n  • Export and remove old projects\n  • Use smaller Docker Compose files\n  • Consider using browser with larger storage limit`,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save project',
      };
    }
  }

  /**
   * Update an existing project
   */
  static updateProject(projectId: string, updates: Partial<Project>): StorageResponse<Project> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'LocalStorage is not available in this browser',
      };
    }

    try {
      // Get existing project
      const existingResult = this.getProject(projectId);
      if (!existingResult.success || !existingResult.data) {
        return {
          success: false,
          error: 'Project not found',
        };
      }

      // Merge updates
      const updatedProject: Project = {
        ...existingResult.data,
        ...updates,
        id: projectId, // Ensure ID doesn't change
        createdAt: existingResult.data.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString(),
      };

      // Save updated project
      const projectKey = this.getProjectKey(projectId);
      localStorage.setItem(projectKey, JSON.stringify(updatedProject));

      return {
        success: true,
        data: updatedProject,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const spaceInfo = this.checkStorageSpace();
        const sizeMB = (spaceInfo.used / (1024 * 1024)).toFixed(2);
        const limitMB = (spaceInfo.limit / (1024 * 1024)).toFixed(2);
        return {
          success: false,
          error: `Storage quota exceeded (${sizeMB}MB / ${limitMB}MB used).\n\nSuggestions:\n  • Delete unused projects to free space\n  • Export this project as ZIP before making changes\n  • Reduce the size of your Docker Compose file`,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
      };
    }
  }

  /**
   * Get a project by ID
   */
  static getProject(projectId: string): StorageResponse<Project> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'LocalStorage is not available in this browser',
      };
    }

    try {
      const projectKey = this.getProjectKey(projectId);
      const projectJson = localStorage.getItem(projectKey);

      if (!projectJson) {
        return {
          success: false,
          error: 'Project not found',
        };
      }

      const project: Project = JSON.parse(projectJson);
      return {
        success: true,
        data: project,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve project',
      };
    }
  }

  /**
   * Get all projects (minimal data for list view)
   */
  static getAllProjects(): StorageResponse<ProjectListItem[]> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'LocalStorage is not available in this browser',
      };
    }

    try {
      const ids = this.getProjectIds();
      const projects: ProjectListItem[] = [];

      for (const id of ids) {
        const result = this.getProject(id);
        if (result.success && result.data) {
          const project = result.data;
          projects.push({
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            targetPlatform: project.options.targetPlatform,
            proxyType: project.options.proxyType,
            serviceCount: Object.keys(project.dockerCompose.parsed.services).length,
          });
        }
      }

      // Sort by updated date (most recent first)
      projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return {
        success: true,
        data: projects,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve projects',
      };
    }
  }

  /**
   * Delete a project
   */
  static deleteProject(projectId: string): StorageResponse<void> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'LocalStorage is not available in this browser',
      };
    }

    try {
      // Remove project data
      const projectKey = this.getProjectKey(projectId);
      localStorage.removeItem(projectKey);

      // Update project IDs list
      const ids = this.getProjectIds();
      const filteredIds = ids.filter((id) => id !== projectId);
      this.saveProjectIds(filteredIds);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      };
    }
  }

  /**
   * Delete all projects (clear all data)
   */
  static deleteAllProjects(): StorageResponse<void> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'LocalStorage is not available in this browser',
      };
    }

    try {
      const ids = this.getProjectIds();

      // Remove all project data
      for (const id of ids) {
        const projectKey = this.getProjectKey(id);
        localStorage.removeItem(projectKey);
      }

      // Clear project IDs list
      localStorage.removeItem(PROJECTS_KEY);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete all projects',
      };
    }
  }

  /**
   * Check storage space usage
   */
  static checkStorageSpace(): StorageSpaceInfo {
    let used = 0;

    try {
      // Calculate total size of all stored data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            // Calculate size in bytes (approximate)
            used += new Blob([key, value]).size;
          }
        }
      }
    } catch (error) {
      console.error('Error calculating storage space:', error);
    }

    const usagePercentage = (used / STORAGE_LIMIT) * 100;
    const warning = usagePercentage >= WARNING_THRESHOLD * 100;

    return {
      used,
      available: STORAGE_LIMIT - used,
      usagePercentage,
      limit: STORAGE_LIMIT,
      warning,
    };
  }

  /**
   * Export all projects as JSON
   */
  static exportAllProjects(): StorageResponse<string> {
    try {
      const allProjectsResult = this.getAllProjects();
      if (!allProjectsResult.success) {
        return {
          success: false,
          error: allProjectsResult.error,
        };
      }

      const projectIds = allProjectsResult.data?.map((p) => p.id) || [];
      const projects: Project[] = [];

      for (const id of projectIds) {
        const result = this.getProject(id);
        if (result.success && result.data) {
          projects.push(result.data);
        }
      }

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        projectCount: projects.length,
        projects,
      };

      return {
        success: true,
        data: JSON.stringify(exportData, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export projects',
      };
    }
  }

  /**
   * Import projects from JSON
   */
  static importProjects(jsonData: string): StorageResponse<{ imported: number; skipped: number }> {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.projects || !Array.isArray(importData.projects)) {
        return {
          success: false,
          error: 'Invalid import data format',
        };
      }

      let imported = 0;
      let skipped = 0;

      for (const project of importData.projects) {
        // Generate new ID to avoid conflicts
        const result = this.saveProject({
          name: project.name,
          dockerCompose: project.dockerCompose,
          options: project.options,
          results: project.results,
        });

        if (result.success) {
          imported++;
        } else {
          skipped++;
        }
      }

      return {
        success: true,
        data: { imported, skipped },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import projects',
      };
    }
  }
}
