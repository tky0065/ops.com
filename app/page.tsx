import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Zap, Shield, Network, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Transform Docker Compose to
          <br />
          <span className="text-primary">Production-Ready Deployments</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Convert your Docker Compose files into Kubernetes and Docker Swarm configurations in minutes.
          Production-ready, secure, and optimized.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/convert">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/templates">Browse Templates</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Why DevOps Accelerator?</h2>
          <p className="text-muted-foreground">
            Automate what takes days into minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Convert Docker Compose to production configs in seconds. What used to take days now takes minutes.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Production-Ready</h3>
            <p className="text-muted-foreground">
              Automatic health checks, resource limits, and security best practices applied out of the box.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Reverse Proxy Ready</h3>
            <p className="text-muted-foreground">
              Integrated Traefik, Nginx, or Caddy configurations with automatic SSL via Let&apos;s Encrypt.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">Four simple steps to production</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: '1',
              title: 'Upload',
              description: 'Drag and drop your docker-compose.yml file',
            },
            {
              step: '2',
              title: 'Configure',
              description: 'Choose platform, proxy, and optimization options',
            },
            {
              step: '3',
              title: 'Preview',
              description: 'Review generated Kubernetes, Swarm, and Helm manifests',
            },
            {
              step: '4',
              title: 'Export',
              description: 'Download complete package with docs and scripts',
            },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features List */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">What You Get</h2>
          <p className="text-muted-foreground">Everything you need for production deployment</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {[
            'Kubernetes Deployments & Services',
            'Docker Swarm Stack configurations',
            'Helm Charts with best practices',
            'Reverse proxy configs (Traefik/Nginx/Caddy)',
            'Health checks (liveness & readiness probes)',
            'Resource limits & requests',
            'Security best practices',
            'Automatic SSL with Let\'s Encrypt',
            'Complete README with deployment instructions',
            'Environment variable templates',
            'Local browser storage for projects',
            'Zero backend - everything client-side',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12 border-t">
        <h2 className="text-3xl font-bold">Ready to Deploy?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Start converting your Docker Compose files to production-ready configurations in seconds.
          No signup required, completely free.
        </p>
        <Button asChild size="lg">
          <Link href="/convert">
            Start Converting Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
