import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ExternalLink, BookOpen, Zap, Shield, Settings, Code, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Documentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Learn how to use the DevOps Deployment Accelerator to transform your Docker Compose files
          into production-ready Kubernetes and Docker Swarm configurations.
        </p>
      </div>

      {/* Quick Start */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Quick Start</h2>
        </div>
        <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Upload</span> your docker-compose.yml file on the{' '}
            <Link href="/convert" className="text-primary hover:underline">
              Convert page
            </Link>
          </li>
          <li>
            <span className="text-foreground font-medium">Review</span> the validation status
            (green = ready, red = errors to fix)
          </li>
          <li>
            <span className="text-foreground font-medium">Configure</span> options: platform, proxy type,
            resource profile
          </li>
          <li>
            <span className="text-foreground font-medium">Convert</span> and wait ~2-5 seconds for generation
          </li>
          <li>
            <span className="text-foreground font-medium">Export</span> as ZIP or save project for later
          </li>
        </ol>
        <div className="mt-6">
          <Link href="/convert">
            <Button>Start Converting</Button>
          </Link>
        </div>
      </Card>

      {/* Features */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Features</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="parser">
            <AccordionTrigger>Docker Compose Parser</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                Parses and validates your Docker Compose v3.x files with detailed error reporting.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>YAML syntax validation with line/column errors</li>
                <li>Type checking and required fields validation</li>
                <li>Supports: services, ports, volumes, networks, env vars, health checks</li>
                <li>Real-time validation on file upload</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="kubernetes">
            <AccordionTrigger>Kubernetes Converter</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>Generates production-ready Kubernetes manifests for your services.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>Deployment</strong>: 3 replicas (default), rolling updates, pod templates
                </li>
                <li>
                  <strong>Service</strong>: ClusterIP or LoadBalancer with port mappings
                </li>
                <li>
                  <strong>ConfigMap</strong>: Environment variables
                </li>
                <li>
                  <strong>PersistentVolumeClaim</strong>: Named volumes (1Gi default)
                </li>
                <li>
                  <strong>Ingress</strong>: HTTP/HTTPS routing with TLS (if proxy enabled)
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="swarm">
            <AccordionTrigger>Docker Swarm Converter</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>Generates docker-stack.yml for Docker Swarm deployments.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Deploy section with replicas and placement constraints</li>
                <li>Restart policy (on-failure, 5s delay, 3 max attempts)</li>
                <li>Resource limits and reservations</li>
                <li>Overlay networks with attachable flag</li>
                <li>Health checks compatible with Swarm</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="proxy">
            <AccordionTrigger>Reverse Proxy Configurations</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>Generates configuration files for popular reverse proxies.</p>
              <div className="space-y-3 mt-2">
                <div>
                  <h4 className="font-semibold text-foreground">Traefik (Recommended)</h4>
                  <ul className="list-disc list-inside ml-4">
                    <li>Automatic service discovery</li>
                    <li>Let&apos;s Encrypt SSL automation</li>
                    <li>Built-in dashboard</li>
                    <li>WebSocket support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Nginx</h4>
                  <ul className="list-disc list-inside ml-4">
                    <li>Battle-tested and widely used</li>
                    <li>High performance</li>
                    <li>SSL/TLS configuration (TLSv1.2, TLSv1.3)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Caddy</h4>
                  <ul className="list-disc list-inside ml-4">
                    <li>Simplest configuration</li>
                    <li>Automatic HTTPS</li>
                    <li>Modern defaults</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="helm">
            <AccordionTrigger>Helm Chart Generator</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>Creates complete Helm Chart for easy Kubernetes deployment.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>Chart.yaml</strong>: Metadata (name, version, description)
                </li>
                <li>
                  <strong>values.yaml</strong>: Configurable parameters (replicas, resources, ingress)
                </li>
                <li>
                  <strong>templates/</strong>: Deployment, Service, Ingress, _helpers.tpl
                </li>
                <li>
                  <strong>NOTES.txt</strong>: Post-install instructions
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hardening">
            <AccordionTrigger>Production Hardening</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>Apply production-ready best practices automatically.</p>
              <div className="space-y-3 mt-2">
                <div>
                  <h4 className="font-semibold text-foreground">Health Checks</h4>
                  <ul className="list-disc list-inside ml-4">
                    <li>Liveness probe: Restart unhealthy containers</li>
                    <li>Readiness probe: Remove from load balancer when not ready</li>
                    <li>Configurable paths, intervals, and timeouts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Resource Limits</h4>
                  <ul className="list-disc list-inside ml-4">
                    <li>Small: 100m-500m CPU, 128Mi-512Mi RAM</li>
                    <li>Medium: 250m-1000m CPU, 256Mi-1Gi RAM</li>
                    <li>Large: 500m-2000m CPU, 512Mi-2Gi RAM</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Security Best Practices</h4>
                  <ul className="list-disc list-inside ml-4">
                    <li>Run as non-root user</li>
                    <li>Read-only root filesystem</li>
                    <li>Drop all capabilities</li>
                    <li>Prevent privilege escalation</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Configuration Options */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Configuration Options</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Target Platform</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Kubernetes Only</strong>: For cloud deployments (GKE, EKS, AKS)
              </li>
              <li>
                <strong className="text-foreground">Docker Swarm Only</strong>: Simpler than Kubernetes
              </li>
              <li>
                <strong className="text-foreground">Both Platforms</strong>: Generate configs for both
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Reverse Proxy</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Traefik (Recommended)</strong>: Auto SSL, service discovery
              </li>
              <li>
                <strong className="text-foreground">Nginx</strong>: Battle-tested, high performance
              </li>
              <li>
                <strong className="text-foreground">Caddy</strong>: Simplest config, automatic HTTPS
              </li>
              <li>
                <strong className="text-foreground">None</strong>: Skip proxy configuration
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Resource Profile</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Small</strong>: Microservices, background workers
              </li>
              <li>
                <strong className="text-foreground">Medium (Recommended)</strong>: Web apps, APIs
              </li>
              <li>
                <strong className="text-foreground">Large</strong>: Databases, data processing
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">FAQ</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="free">
            <AccordionTrigger>Is this tool free to use?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes, completely free. All processing happens in your browser. No servers, no accounts required.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="privacy">
            <AccordionTrigger>Do you store my Docker Compose files?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              No. Everything runs client-side in your browser. Your files never leave your computer.
              Projects saved in LocalStorage stay on your device only.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="version">
            <AccordionTrigger>Which Docker Compose version is supported?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Docker Compose v3.x (v3.0 through v3.8). v2.x may work but is not guaranteed.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="k8s-version">
            <AccordionTrigger>Which Kubernetes version is targeted?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              API v1.28+. Generated manifests work with Kubernetes v1.24 and newer.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="secrets">
            <AccordionTrigger>How do I handle secrets?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Environment variables are converted to ConfigMaps (not secrets). Create Kubernetes Secrets
              manually for sensitive data:
              <pre className="mt-2 p-2 bg-muted rounded text-sm">
                kubectl create secret generic my-secret --from-env-file=.env
              </pre>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="storage">
            <AccordionTrigger>How much can I store in LocalStorage?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              5-10MB depending on browser. The app warns at 80% usage. Export projects as ZIP before
              deleting to preserve your work.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* External Resources */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">External Resources</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <a
            href="https://docs.docker.com/compose/compose-file/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Docker Compose Specification</span>
          </a>
          <a
            href="https://kubernetes.io/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Kubernetes Documentation</span>
          </a>
          <a
            href="https://helm.sh/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Helm Documentation</span>
          </a>
          <a
            href="https://doc.traefik.io/traefik/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Traefik Proxy</span>
          </a>
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-8 text-center bg-primary/5 border-primary/20">
        <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6">
          Transform your Docker Compose files in minutes
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/convert">
            <Button size="lg">Start Converting</Button>
          </Link>
          <Link href="/templates">
            <Button size="lg" variant="outline">
              Browse Templates
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
