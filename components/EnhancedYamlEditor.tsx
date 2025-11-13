'use client';

import React, { useState } from 'react';
import yaml from 'js-yaml';
import { YamlEditor } from './YamlEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Wand2,
  Code2,
  FileCode,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface EnhancedYamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  title?: string;
  fileName?: string;
  height?: string;
}

const snippets = [
  {
    name: 'Basic Service',
    description: 'Service with image, ports, and environment',
    template: `service-name:
  image: nginx:latest
  ports:
    - "8080:80"
  environment:
    ENV_VAR: value
  networks:
    - default
  restart: unless-stopped`,
  },
  {
    name: 'Service with Build',
    description: 'Service that builds from Dockerfile',
    template: `service-name:
  build:
    context: ./app
    dockerfile: Dockerfile
    args:
      BUILD_ENV: production
  ports:
    - "3000:3000"
  volumes:
    - ./app:/app
  environment:
    NODE_ENV: production`,
  },
  {
    name: 'Health Check',
    description: 'Add health check to service',
    template: `  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s`,
  },
  {
    name: 'Deploy Config (Swarm)',
    description: 'Swarm deployment configuration',
    template: `  deploy:
    mode: replicated
    replicas: 3
    resources:
      limits:
        cpus: "0.5"
        memory: 512M
      reservations:
        cpus: "0.1"
        memory: 128M
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
    placement:
      constraints:
        - node.role == worker`,
  },
  {
    name: 'Database Service',
    description: 'PostgreSQL with volume',
    template: `database:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: myapp
    POSTGRES_USER: user
    POSTGRES_PASSWORD: password
  volumes:
    - postgres-data:/var/lib/postgresql/data
  ports:
    - "5432:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U user"]
    interval: 10s
    timeout: 5s
    retries: 5`,
  },
  {
    name: 'Volume Definition',
    description: 'Named volume',
    template: `volumes:
  volume-name:
    driver: local
    driver_opts:
      type: none
      device: /path/to/data
      o: bind`,
  },
  {
    name: 'Network Definition',
    description: 'Custom network',
    template: `networks:
  network-name:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16`,
  },
];

const tips = [
  { title: 'Version', description: 'Use version: "3.8" or higher for modern features' },
  { title: 'Restart Policy', description: 'Use restart: unless-stopped for production services' },
  { title: 'Health Checks', description: 'Always add healthcheck for web services' },
  { title: 'Resource Limits', description: 'Define deploy.resources to prevent resource exhaustion' },
  { title: 'Networks', description: 'Use custom networks to isolate services' },
  { title: 'Volumes', description: 'Use named volumes for persistent data' },
  { title: 'Environment', description: 'Use env_file: for sensitive variables' },
  { title: 'Dependencies', description: 'Use depends_on with condition: service_healthy' },
];

export function EnhancedYamlEditor({
  value,
  onChange,
  title = 'Docker Compose Editor',
  fileName,
  height = '500px',
}: EnhancedYamlEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showSnippets, setShowSnippets] = useState(false);

  const handleFormat = () => {
    try {
      // Parse and re-dump with proper formatting
      const parsed = yaml.load(value);
      const formatted = yaml.dump(parsed, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false,
      });

      if (onChange) {
        onChange(formatted);
      }

      toast.success('YAML formatted successfully');
    } catch (error) {
      toast.error('Failed to format YAML', {
        description: error instanceof Error ? error.message : 'Invalid YAML syntax',
      });
    }
  };

  const handleInsertSnippet = (template: string) => {
    const newValue = value ? `${value}\n\n${template}` : template;
    if (onChange) {
      onChange(newValue);
    }
    toast.success('Snippet inserted');
  };

  const handleValidate = () => {
    try {
      yaml.load(value);
      toast.success('YAML is valid');
    } catch (error) {
      toast.error('YAML validation failed', {
        description: error instanceof Error ? error.message : 'Invalid syntax',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFormat}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Format YAML
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleValidate}
        >
          <Code2 className="mr-2 h-4 w-4" />
          Validate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSnippets(!showSnippets)}
        >
          <FileCode className="mr-2 h-4 w-4" />
          Snippets
          {showSnippets ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          {showSuggestions ? 'Hide Tips' : 'Show Tips'}
        </Button>
      </div>

      {/* Snippets Panel */}
      {showSnippets && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code Snippets</CardTitle>
            <CardDescription>
              Click to insert template at the end of your YAML
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {snippets.map((snippet, index) => (
                <button
                  key={index}
                  onClick={() => handleInsertSnippet(snippet.template)}
                  className="p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors text-left group"
                >
                  <div className="font-medium group-hover:text-primary">{snippet.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{snippet.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor with Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className={showSuggestions ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <YamlEditor
            value={value}
            onChange={onChange}
            title={title}
            fileName={fileName}
            height={height}
            language="yaml"
          />
        </div>

        {/* Suggestions Panel */}
        {showSuggestions && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg">Tips & Best Practices</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tips.map((tip, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <div className="font-medium text-sm mb-1">{tip.title}</div>
                      <div className="text-xs text-muted-foreground">{tip.description}</div>
                    </div>
                  ))}

                  {/* Quick Reference */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-2">Common Fields</h4>
                    <div className="space-y-1">
                      {['image', 'ports', 'environment', 'volumes', 'depends_on', 'networks', 'restart', 'healthcheck', 'deploy'].map((field) => (
                        <Badge key={field} variant="outline" className="text-xs mr-1 mb-1">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-2">Restart Policies</h4>
                    <div className="space-y-1">
                      {['no', 'always', 'on-failure', 'unless-stopped'].map((policy) => (
                        <Badge key={policy} variant="secondary" className="text-xs mr-1 mb-1">
                          {policy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
