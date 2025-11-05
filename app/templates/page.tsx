'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Import templates
import mernTemplate from '@/lib/templates/mern.json';
import wordpressTemplate from '@/lib/templates/wordpress.json';
import lampTemplate from '@/lib/templates/lamp.json';
import microservicesTemplate from '@/lib/templates/microservices.json';
import nextjsTemplate from '@/lib/templates/nextjs-postgres.json';
import springBootTemplate from '@/lib/templates/spring-boot-postgres.json';
import djangoTemplate from '@/lib/templates/django-postgres.json';
import flaskTemplate from '@/lib/templates/flask-postgres.json';
import fastapiTemplate from '@/lib/templates/fastapi-postgres.json';
import laravelTemplate from '@/lib/templates/laravel-mysql.json';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  dockerCompose: string;
  recommendedOptions: {
    targetPlatform: string;
    proxyType: string;
    addHealthChecks: boolean;
    addResourceLimits: boolean;
    resourceProfile: string;
    addSecurity: boolean;
  };
}

const templates: Template[] = [
  mernTemplate,
  wordpressTemplate,
  lampTemplate,
  microservicesTemplate,
  nextjsTemplate,
  springBootTemplate,
  djangoTemplate,
  flaskTemplate,
  fastapiTemplate,
  laravelTemplate,
];

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      // Store template in sessionStorage to load in convert page
      sessionStorage.setItem('templateData', JSON.stringify(selectedTemplate));
      toast.success('Template loaded', {
        description: `"${selectedTemplate.name}" has been loaded`,
      });
      router.push('/convert');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Template Library</h1>
        <p className="text-muted-foreground mt-2">
          Start with pre-configured Docker Compose templates for common stacks
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try a different search term</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleTemplateClick(template)}
            >
              {/* Template Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Recommended Options */}
              <div className="pt-2 border-t space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-medium capitalize">
                    {template.recommendedOptions.targetPlatform}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proxy:</span>
                  <span className="font-medium capitalize">
                    {template.recommendedOptions.proxyType}
                  </span>
                </div>
              </div>

              {/* Use Button */}
              <Button className="w-full" onClick={() => handleTemplateClick(template)}>
                Use Template
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Template Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tags */}
            <div>
              <h4 className="font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate?.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Docker Compose Preview */}
            <div>
              <h4 className="font-semibold mb-2">Docker Compose</h4>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                <code>{selectedTemplate?.dockerCompose}</code>
              </pre>
            </div>

            {/* Recommended Options */}
            <div>
              <h4 className="font-semibold mb-2">Recommended Configuration</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="ml-2 font-medium capitalize">
                    {selectedTemplate?.recommendedOptions.targetPlatform}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Proxy:</span>
                  <span className="ml-2 font-medium capitalize">
                    {selectedTemplate?.recommendedOptions.proxyType}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Health Checks:</span>
                  <span className="ml-2 font-medium">
                    {selectedTemplate?.recommendedOptions.addHealthChecks ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Resource Limits:</span>
                  <span className="ml-2 font-medium">
                    {selectedTemplate?.recommendedOptions.addResourceLimits ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Profile:</span>
                  <span className="ml-2 font-medium capitalize">
                    {selectedTemplate?.recommendedOptions.resourceProfile}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Security:</span>
                  <span className="ml-2 font-medium">
                    {selectedTemplate?.recommendedOptions.addSecurity ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate}>
              Use This Template
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
