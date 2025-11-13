'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ManifestPreview } from '@/components/ManifestPreview';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Download, Save, CheckCircle2, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

// Import only essential modules at page load
import { DockerComposeParser } from '@/lib/parsers/dockerComposeParser';
import { LocalStorageManager } from '@/lib/storage/localStorage';
import { HelpTooltip } from '@/components/HelpTooltip';
import { ValidationReport } from '@/components/ValidationReport';
import { DiffViewer } from '@/components/DiffViewer';
import type { DockerCompose } from '@/types/dockerCompose';
import type { ValidationResult } from '@/lib/validators/manifestValidator';

// Converters will be dynamically imported when needed to reduce initial bundle size

type Platform = 'kubernetes' | 'swarm' | 'both';
type ProxyType = 'traefik' | 'nginx' | 'caddy' | 'none';
type ResourceProfile = 'small' | 'medium' | 'large';

export default function ConvertPage() {
  // State for file upload
  const [dockerComposeContent, setDockerComposeContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // State for configuration
  const [projectName, setProjectName] = useState<string>('');
  const [platform, setPlatform] = useState<Platform>('both');
  const [proxyType, setProxyType] = useState<ProxyType>('traefik');
  const [addHealthChecks, setAddHealthChecks] = useState(true);
  const [addResourceLimits, setAddResourceLimits] = useState(true);
  const [resourceProfile, setResourceProfile] = useState<ResourceProfile>('medium');
  const [addSecurity, setAddSecurity] = useState(true);
  const [email, setEmail] = useState('');

  // State for conversion results
  const [isConverting, setIsConverting] = useState(false);
  const [kubernetesYaml, setKubernetesYaml] = useState<Record<string, string>>({});
  const [dockerStackYaml, setDockerStackYaml] = useState<string>('');
  const [proxyConfig, setProxyConfig] = useState<string>('');
  const [helmChart, setHelmChart] = useState<{
    chartYaml?: string;
    valuesYaml?: string;
    templates?: Record<string, string>;
  }>({});
  const [parsedCompose, setParsedCompose] = useState<DockerCompose | null>(null);

  // State for validation results
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    kubernetes?: ValidationResult;
    dockerStack?: ValidationResult;
    helm?: ValidationResult;
  }>({});

  const handleFileUpload = (content: string, filename: string) => {
    setDockerComposeContent(content);
    setFileName(filename);

    // Auto-generate project name from filename if not set
    if (!projectName) {
      const name = filename.replace(/\.(yml|yaml)$/, '').replace(/[^a-zA-Z0-9-]/g, '-');
      setProjectName(name);
    }

    // Clear previous results
    setKubernetesYaml({});
    setDockerStackYaml('');
    setProxyConfig('');
    setParsedCompose(null);

    // Perform real-time validation
    toast.info('Validating Docker Compose file...');
    const parseResult = DockerComposeParser.parse(content);

    if (!parseResult.success) {
      setValidationStatus({
        isValid: false,
        errors: [parseResult.error || 'Unknown validation error'],
        warnings: [],
      });
      toast.error('Validation failed', {
        description: 'Please fix the errors before converting',
      });
    } else {
      setValidationStatus({
        isValid: true,
        errors: [],
        warnings: parseResult.warnings || [],
      });
      toast.success('Validation passed', {
        description: `Found ${Object.keys(parseResult.data?.services || {}).length} services`,
      });

      // Show warnings if any
      if (parseResult.warnings && parseResult.warnings.length > 0) {
        parseResult.warnings.forEach((warning) => {
          toast.warning('Warning', { description: warning });
        });
      }
    }
  };

  const handleConvert = async () => {
    if (!dockerComposeContent) {
      toast.error('No file uploaded', {
        description: 'Please upload a Docker Compose file first',
      });
      return;
    }

    if (!projectName.trim()) {
      toast.error('Project name required', {
        description: 'Please enter a project name',
      });
      return;
    }

    setIsConverting(true);

    try {
      // Step 1: Parse Docker Compose
      toast.info('Parsing Docker Compose file...');
      const parseResult = DockerComposeParser.parse(dockerComposeContent);

      if (!parseResult.success || !parseResult.data) {
        toast.error('Failed to parse Docker Compose', {
          description: parseResult.error || 'Invalid YAML format',
        });
        setIsConverting(false);
        return;
      }

      setParsedCompose(parseResult.data);

      // Show warnings if any
      if (parseResult.warnings && parseResult.warnings.length > 0) {
        parseResult.warnings.forEach((warning) => {
          toast.warning('Parser Warning', { description: warning });
        });
      }

      // Step 2: Convert to Kubernetes
      if (platform === 'kubernetes' || platform === 'both') {
        toast.info('Generating Kubernetes manifests...');

        // Dynamic import to reduce initial bundle size
        const { KubernetesConverter } = await import('@/lib/converters/kubernetesConverter');

        const k8sResult = KubernetesConverter.convert(parseResult.data, {
          targetPlatform: 'kubernetes',
          proxyType,
          addHealthChecks,
          addResourceLimits,
          resourceProfile,
          addSecurity,
          namespace: 'default',
          letsEncryptEmail: email,
        });

        if (k8sResult.success && k8sResult.yaml) {
          setKubernetesYaml(k8sResult.yaml);
          toast.success('Kubernetes manifests generated');
        } else {
          toast.error('Failed to generate Kubernetes manifests', {
            description: k8sResult.error,
          });
        }
      }

      // Step 3: Convert to Docker Stack
      if (platform === 'swarm' || platform === 'both') {
        toast.info('Generating Docker Stack configuration...');

        // Dynamic import to reduce initial bundle size
        const { DockerStackConverter } = await import('@/lib/converters/dockerStackConverter');

        const stackResult = DockerStackConverter.convert(parseResult.data, {
          targetPlatform: 'swarm',
          proxyType,
          addHealthChecks,
          addResourceLimits,
          resourceProfile,
          addSecurity,
        });

        if (stackResult.success && stackResult.yaml) {
          setDockerStackYaml(stackResult.yaml);
          toast.success('Docker Stack configuration generated');
        } else {
          toast.error('Failed to generate Docker Stack', {
            description: stackResult.error,
          });
        }

        // Show warnings if any
        if (stackResult.warnings && stackResult.warnings.length > 0) {
          stackResult.warnings.forEach((warning) => {
            toast.warning('Swarm Warning', { description: warning });
          });
        }
      }

      // Step 4: Generate proxy config (placeholder - will be implemented with proxy generators)
      if (proxyType !== 'none') {
        // TODO: Integrate proxy generators
        setProxyConfig(`# ${proxyType.toUpperCase()} Configuration\n# TODO: Implement proxy config generation`);
      }

      // Step 5: Generate Helm Chart
      toast.info('Generating Helm Chart...');
      const { HelmGenerator } = await import('@/lib/converters/helmGenerator');

      const helm = HelmGenerator.generateHelmChart(projectName, parseResult.data, {
        version: '0.1.0',
        appVersion: '1.0.0',
        description: `Helm chart for ${projectName}`,
      });

      setHelmChart(helm);
      toast.success('Helm Chart generated');

      toast.success('Conversion complete!', {
        description: 'All manifests including Helm Chart have been generated successfully',
      });

    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Conversion failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleSaveProject = () => {
    if (!projectName || !parsedCompose || !dockerComposeContent) {
      toast.error('Cannot save project', {
        description: 'Please convert a Docker Compose file first',
      });
      return;
    }

    try {
      const project = LocalStorageManager.saveProject({
        name: projectName,
        dockerCompose: {
          filename: fileName,
          content: dockerComposeContent,
          parsed: parsedCompose,
        },
        options: {
          targetPlatform: platform,
          proxyType,
          addHealthChecks,
          addResourceLimits,
          resourceProfile,
          addSecurity,
          letsEncryptEmail: email,
        },
      });

      toast.success('Project saved', {
        description: `"${projectName}" has been saved to your browser`,
      });
    } catch (error) {
      toast.error('Failed to save project', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleExport = async () => {
    if (!projectName || !parsedCompose) {
      toast.error('Cannot export', {
        description: 'Please convert a Docker Compose file first',
      });
      return;
    }

    try {
      toast.info('Generating export package...');

      const { ExportUtils } = await import('@/lib/utils/exportUtils');

      const blob = await ExportUtils.createZipArchive(
        projectName,
        parsedCompose,
        {
          targetPlatform: platform,
          proxyType,
          addHealthChecks,
          addResourceLimits,
          resourceProfile,
          addSecurity,
          letsEncryptEmail: email,
        },
        {
          kubernetesYaml,
          dockerStackYaml,
          proxyConfig,
          proxyType,
          helmChart,
        }
      );

      // Validate size
      const validation = ExportUtils.validateZipSize(blob);
      if (validation.warning) {
        toast.warning('Large file', {
          description: validation.warning,
        });
      }

      // Download
      ExportUtils.downloadZip(blob, projectName);

      toast.success('Export complete!', {
        description: `Downloaded ${projectName}-${new Date().toISOString().slice(0, 10)}.zip (${validation.sizeMB.toFixed(2)} MB)`,
      });
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleValidate = async () => {
    if (!hasResults) {
      toast.error('No manifests to validate', {
        description: 'Please convert your Docker Compose file first',
      });
      return;
    }

    setIsValidating(true);
    const results: {
      kubernetes?: ValidationResult;
      dockerStack?: ValidationResult;
      helm?: ValidationResult;
    } = {};

    try {
      toast.info('Validating manifests...');

      // Dynamically import validators
      const { validateKubernetesManifests, validateDockerStack } = await import(
        '@/lib/validators/manifestValidator'
      );

      // Validate Kubernetes manifests
      if (Object.keys(kubernetesYaml).length > 0) {
        const allK8sYaml = Object.values(kubernetesYaml).join('\n---\n');
        results.kubernetes = validateKubernetesManifests(allK8sYaml);

        if (results.kubernetes.valid) {
          toast.success('Kubernetes manifests valid', {
            description: `Score: ${results.kubernetes.score}/100`,
          });
        } else {
          toast.error('Kubernetes validation failed', {
            description: `Found ${results.kubernetes.summary.errorCount} error(s)`,
          });
        }
      }

      // Validate Docker Stack
      if (dockerStackYaml) {
        results.dockerStack = validateDockerStack(dockerStackYaml);

        if (results.dockerStack.valid) {
          toast.success('Docker Stack valid', {
            description: `Score: ${results.dockerStack.score}/100`,
          });
        } else {
          toast.warning('Docker Stack has issues', {
            description: `Found ${results.dockerStack.summary.errorCount} error(s)`,
          });
        }
      }

      // Validate Helm Chart
      if (helmChart.chartYaml && helmChart.valuesYaml) {
        const { HelmGenerator } = await import('@/lib/converters/helmGenerator');
        const helmValidation = HelmGenerator.validateHelmChart({
          chartYaml: helmChart.chartYaml,
          valuesYaml: helmChart.valuesYaml,
          templates: helmChart.templates || {},
        });

        // Convert Helm validation to ValidationResult format
        results.helm = {
          valid: helmValidation.valid,
          score: helmValidation.valid ? 100 : helmValidation.errors.length > 0 ? 0 : 80,
          errors: helmValidation.errors.map((e) => ({
            severity: 'error' as const,
            resource: 'Helm Chart',
            kind: 'Chart',
            message: e,
          })),
          warnings: helmValidation.warnings.map((w) => ({
            severity: 'warning' as const,
            resource: 'Helm Chart',
            kind: 'Chart',
            message: w,
          })),
          info: [],
          suggestions: helmValidation.valid
            ? ['Helm Chart is valid and ready for deployment']
            : ['Fix errors in Helm Chart before deployment'],
          summary: {
            totalResources: 1,
            validResources: helmValidation.valid ? 1 : 0,
            errorCount: helmValidation.errors.length,
            warningCount: helmValidation.warnings.length,
            infoCount: 0,
          },
        };

        if (helmValidation.valid) {
          toast.success('Helm Chart valid');
        } else {
          toast.error('Helm Chart validation failed', {
            description: `Found ${helmValidation.errors.length} error(s)`,
          });
        }
      }

      setValidationResults(results);

      // Overall summary
      const totalErrors =
        (results.kubernetes?.summary.errorCount || 0) +
        (results.dockerStack?.summary.errorCount || 0) +
        (results.helm?.summary.errorCount || 0);

      const avgScore = Math.round(
        (
          (results.kubernetes?.score || 0) +
          (results.dockerStack?.score || 0) +
          (results.helm?.score || 0)
        ) / Object.keys(results).length
      );

      if (totalErrors === 0) {
        toast.success('All validations passed!', {
          description: `Average quality score: ${avgScore}/100`,
        });
      } else {
        toast.warning('Validation complete', {
          description: `Found ${totalErrors} total error(s). Check the report below.`,
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const hasResults = Object.keys(kubernetesYaml).length > 0 || dockerStackYaml.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Convert Docker Compose</h1>
        <p className="text-muted-foreground mt-2">
          Transform your Docker Compose files into production-ready Kubernetes and Docker Swarm configurations
        </p>
      </div>

      {/* File Upload */}
      <FileUpload onFileUpload={handleFileUpload} />

      {/* Validation Status */}
      {validationStatus && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            {validationStatus.isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold">
                  {validationStatus.isValid ? 'Validation Passed' : 'Validation Failed'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {validationStatus.isValid
                    ? 'Your Docker Compose file is valid and ready to convert'
                    : 'Please fix the following errors before converting'}
                </p>
              </div>

              {/* Errors */}
              {validationStatus.errors.length > 0 && (
                <div className="space-y-1">
                  {validationStatus.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-md whitespace-pre-wrap font-mono"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {validationStatus.warnings.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Warnings</span>
                  </div>
                  {validationStatus.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="text-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-3 py-2 rounded-md"
                    >
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Configuration */}
      {dockerComposeContent && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="projectName">Project Name</Label>
                <HelpTooltip content="A unique name for your project. Used for naming generated files and Kubernetes resources. Use lowercase letters, numbers, and hyphens only." />
              </div>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-project"
              />
            </div>

            {/* Target Platform */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="platform">Target Platform</Label>
                <HelpTooltip content="Choose your deployment target. Kubernetes is recommended for cloud deployments. Docker Swarm for simpler setups. Select Both to generate configurations for both platforms." />
              </div>
              <Select value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
                <SelectTrigger id="platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kubernetes">Kubernetes Only</SelectItem>
                  <SelectItem value="swarm">Docker Swarm Only</SelectItem>
                  <SelectItem value="both">Both Platforms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Proxy Type */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="proxy">Reverse Proxy</Label>
                <HelpTooltip content="Reverse proxy handles SSL/TLS, routing, and load balancing. Traefik is recommended for automatic service discovery and Let's Encrypt SSL. Choose None if you have an existing proxy." />
              </div>
              <Select value={proxyType} onValueChange={(value) => setProxyType(value as ProxyType)}>
                <SelectTrigger id="proxy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traefik">Traefik (Recommended)</SelectItem>
                  <SelectItem value="nginx">Nginx</SelectItem>
                  <SelectItem value="caddy">Caddy</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resource Profile */}
            {addResourceLimits && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="resources">Resource Profile</Label>
                  <HelpTooltip content="Resource limits for CPU and memory. Small for microservices, Medium for web apps (recommended), Large for databases and data processing. Helps with cost optimization and prevents resource starvation." />
                </div>
                <Select value={resourceProfile} onValueChange={(value) => setResourceProfile(value as ResourceProfile)}>
                  <SelectTrigger id="resources">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (100m-500m CPU, 128Mi-512Mi RAM)</SelectItem>
                    <SelectItem value="medium">Medium (250m-1000m CPU, 256Mi-1Gi RAM)</SelectItem>
                    <SelectItem value="large">Large (500m-2000m CPU, 512Mi-2Gi RAM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Email for Let's Encrypt */}
            {proxyType !== 'none' && (
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email">Email (for Let&apos;s Encrypt SSL)</Label>
                  <HelpTooltip content="Email address for Let&apos;s Encrypt SSL certificate notifications. Used for certificate expiry warnings and important updates. Required for automatic HTTPS." />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
            )}
          </div>

          {/* Switches */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label>Health Checks</Label>
                  <HelpTooltip content="Adds liveness probes (restart unhealthy containers) and readiness probes (remove from load balancer when not ready). Essential for production deployments." />
                </div>
                <p className="text-sm text-muted-foreground">
                  Add liveness and readiness probes
                </p>
              </div>
              <Switch checked={addHealthChecks} onCheckedChange={setAddHealthChecks} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label>Resource Limits</Label>
                  <HelpTooltip content="Sets CPU and memory requests (guaranteed resources) and limits (maximum allowed). Prevents resource starvation and enables better cluster scheduling. Highly recommended for production." />
                </div>
                <p className="text-sm text-muted-foreground">
                  Set CPU and memory requests/limits
                </p>
              </div>
              <Switch checked={addResourceLimits} onCheckedChange={setAddResourceLimits} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label>Security Best Practices</Label>
                  <HelpTooltip content="Applies security contexts: runs as non-root user, read-only filesystem, drops all capabilities, prevents privilege escalation. Reduces attack surface and complies with security standards." />
                </div>
                <p className="text-sm text-muted-foreground">
                  Apply security contexts and policies
                </p>
              </div>
              <Switch checked={addSecurity} onCheckedChange={setAddSecurity} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleConvert}
              disabled={isConverting || !projectName || (validationStatus?.isValid === false)}
              className="flex-1"
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert'
              )}
            </Button>

            {hasResults && (
              <>
                <Button
                  variant="outline"
                  onClick={handleValidate}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Validate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveProject}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Project
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export ZIP
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Validation Report */}
      {hasResults && Object.keys(validationResults).length > 0 && (
        <ValidationReport
          kubernetes={validationResults.kubernetes}
          dockerStack={validationResults.dockerStack}
          helm={validationResults.helm}
        />
      )}

      {/* Diff Viewer */}
      {hasResults && dockerComposeContent && (
        <DiffViewer
          originalYaml={dockerComposeContent}
          kubernetesYaml={kubernetesYaml}
          dockerStackYaml={dockerStackYaml}
          helmChartYaml={helmChart.valuesYaml}
        />
      )}

      {/* Preview */}
      {hasResults && (
        <ManifestPreview
          kubernetesYaml={kubernetesYaml}
          dockerStackYaml={dockerStackYaml}
          proxyConfig={proxyConfig}
          proxyType={proxyType}
          helmChart={helmChart}
        />
      )}
    </div>
  );
}
