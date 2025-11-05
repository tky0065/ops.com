'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectList } from '@/components/ProjectList';
import { Project } from '@/types/project';

export default function ProjectsPage() {
  const router = useRouter();

  const handleProjectSelect = (project: Project) => {
    // Store selected project in sessionStorage to load in convert page
    sessionStorage.setItem('selectedProject', JSON.stringify(project));
    router.push('/convert');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Projects</h1>
        <p className="text-muted-foreground mt-2">
          Manage your saved Docker Compose conversion projects
        </p>
      </div>

      {/* Project List */}
      <ProjectList onProjectSelect={handleProjectSelect} />
    </div>
  );
}
