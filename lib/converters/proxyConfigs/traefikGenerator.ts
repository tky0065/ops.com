import * as yaml from 'js-yaml';
import { DockerCompose, DockerComposeService } from '@/types/dockerCompose';

/**
 * Traefik Configuration Options
 */
export interface TraefikOptions {
  email?: string; // For Let's Encrypt
  dashboard?: boolean; // Enable Traefik dashboard
  domains?: Record<string, string>; // serviceName -> domain mapping
  entrypoints?: string[]; // Custom entrypoints (default: web, websecure)
}

/**
 * Traefik Generator Class
 * Generates Traefik v2.10 configurations for Docker and Kubernetes
 */
export class TraefikGenerator {
  /**
   * Generate Traefik labels for Docker service
   */
  static generateDockerLabels(
    serviceName: string,
    domain: string,
    port: number,
    options?: { enableTLS?: boolean; certResolver?: string }
  ): Record<string, string> {
    const routerName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const serviceTr = `${routerName}-service`;

    const labels: Record<string, string> = {
      // Enable Traefik
      'traefik.enable': 'true',

      // HTTP Router
      [`traefik.http.routers.${routerName}.rule`]: `Host(\`${domain}\`)`,
      [`traefik.http.routers.${routerName}.entrypoints`]: options?.enableTLS ? 'websecure' : 'web',

      // Service
      [`traefik.http.services.${serviceTr}.loadbalancer.server.port`]: port.toString(),
    };

    // Add TLS configuration
    if (options?.enableTLS) {
      labels[`traefik.http.routers.${routerName}.tls`] = 'true';
      if (options.certResolver) {
        labels[`traefik.http.routers.${routerName}.tls.certresolver`] = options.certResolver;
      }

      // Add HTTP to HTTPS redirect
      labels[`traefik.http.routers.${routerName}-http.rule`] = `Host(\`${domain}\`)`;
      labels[`traefik.http.routers.${routerName}-http.entrypoints`] = 'web';
      labels[`traefik.http.routers.${routerName}-http.middlewares`] = `${routerName}-https-redirect`;
      labels[`traefik.http.middlewares.${routerName}-https-redirect.redirectscheme.scheme`] = 'https';
      labels[`traefik.http.middlewares.${routerName}-https-redirect.redirectscheme.permanent`] = 'true';
    }

    return labels;
  }

  /**
   * Generate Kubernetes IngressRoute (Traefik CRD)
   */
  static generateKubernetesIngressRoute(
    serviceName: string,
    domain: string,
    port: number,
    namespace: string = 'default',
    options?: { enableTLS?: boolean; certResolver?: string }
  ): string {
    const appName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const ingressRoute: any = {
      apiVersion: 'traefik.containo.us/v1alpha1',
      kind: 'IngressRoute',
      metadata: {
        name: `${appName}-ingressroute`,
        namespace,
        labels: {
          app: appName,
        },
      },
      spec: {
        entryPoints: options?.enableTLS ? ['websecure'] : ['web'],
        routes: [
          {
            match: `Host(\`${domain}\`)`,
            kind: 'Rule',
            services: [
              {
                name: appName,
                port,
              },
            ],
          },
        ],
      },
    };

    // Add TLS configuration
    if (options?.enableTLS) {
      ingressRoute.spec.tls = {
        certResolver: options.certResolver || 'letsencrypt',
      };
    }

    return yaml.dump(ingressRoute, { indent: 2, lineWidth: -1 });
  }

  /**
   * Generate Traefik static configuration (traefik.yml)
   */
  static generateStaticConfig(
    options: TraefikOptions = {}
  ): string {
    const config: any = {
      // API and Dashboard
      api: {
        dashboard: options.dashboard !== false,
        insecure: false, // Secure by default
      },

      // Entry Points
      entryPoints: {
        web: {
          address: ':80',
        },
        websecure: {
          address: ':443',
        },
      },

      // Certificate Resolvers (Let's Encrypt)
      certificatesResolvers: {},

      // Providers
      providers: {
        docker: {
          exposedByDefault: false, // Require explicit enable
        },
        kubernetesCRD: {
          enabled: true,
        },
      },

      // Logging
      log: {
        level: 'INFO',
      },
      accessLog: {
        enabled: true,
      },
    };

    // Add HTTP to HTTPS redirect
    if (options.email) {
      config.entryPoints.web.http = {
        redirections: {
          entryPoint: {
            to: 'websecure',
            scheme: 'https',
            permanent: true,
          },
        },
      };
    }

    // Add Let's Encrypt resolver
    if (options.email) {
      config.certificatesResolvers.letsencrypt = {
        acme: {
          email: options.email,
          storage: '/letsencrypt/acme.json',
          httpChallenge: {
            entryPoint: 'web',
          },
        },
      };
    }

    return yaml.dump(config, { indent: 2, lineWidth: -1 });
  }

  /**
   * Generate Traefik dynamic configuration for Docker
   */
  static generateDynamicConfig(
    services: Record<string, { domain: string; port: number }>,
    options: TraefikOptions = {}
  ): string {
    const config: any = {
      http: {
        routers: {},
        services: {},
        middlewares: {},
      },
    };

    // Generate config for each service
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      const routerName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Router
      config.http.routers[routerName] = {
        rule: `Host(\`${serviceConfig.domain}\`)`,
        service: routerName,
        entryPoints: ['websecure'],
        tls: {
          certResolver: 'letsencrypt',
        },
      };

      // Service
      config.http.services[routerName] = {
        loadBalancer: {
          servers: [
            {
              url: `http://${serviceName}:${serviceConfig.port}`,
            },
          ],
        },
      };
    }

    return yaml.dump(config, { indent: 2, lineWidth: -1 });
  }

  /**
   * Add Traefik service to Docker Compose
   */
  static addToDockerCompose(
    dockerCompose: DockerCompose,
    options: TraefikOptions = {}
  ): DockerCompose {
    // Clone to avoid mutation
    const compose = JSON.parse(JSON.stringify(dockerCompose));

    // Create Traefik service
    const traefikService: DockerComposeService = {
      image: 'traefik:v2.10',
      container_name: 'traefik',
      restart: 'unless-stopped',
      command: [
        '--api.dashboard=true',
        '--providers.docker=true',
        '--providers.docker.exposedbydefault=false',
        '--entrypoints.web.address=:80',
        '--entrypoints.websecure.address=:443',
      ],
      ports: [
        '80:80',
        '443:443',
        '8080:8080', // Dashboard
      ],
      volumes: [
        '/var/run/docker.sock:/var/run/docker.sock:ro',
        './letsencrypt:/letsencrypt',
      ],
      labels: {
        // Dashboard router
        'traefik.enable': 'true',
        'traefik.http.routers.dashboard.rule': 'Host(`traefik.localhost`)',
        'traefik.http.routers.dashboard.service': 'api@internal',
        'traefik.http.routers.dashboard.entrypoints': 'web',
      },
    };

    // Add Let's Encrypt configuration
    if (options.email && Array.isArray(traefikService.command)) {
      traefikService.command.push(
        '--certificatesresolvers.letsencrypt.acme.httpchallenge=true',
        '--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web',
        `--certificatesresolvers.letsencrypt.acme.email=${options.email}`,
        '--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json'
      );

      // Add HTTP to HTTPS redirect
      traefikService.command.push(
        '--entrypoints.web.http.redirections.entrypoint.to=websecure',
        '--entrypoints.web.http.redirections.entrypoint.scheme=https',
        '--entrypoints.web.http.redirections.entrypoint.permanent=true'
      );
    }

    // Add Traefik to services
    compose.services.traefik = traefikService;

    // Add labels to existing services
    if (options.domains) {
      for (const [serviceName, domain] of Object.entries(options.domains)) {
        if (compose.services[serviceName]) {
          const service = compose.services[serviceName];

          // Get first exposed port
          let port = 80;
          if (service.ports && service.ports.length > 0) {
            const portStr = service.ports[0];
            const parts = portStr.split(':');
            port = parseInt(parts[parts.length - 1].split('/')[0], 10);
          }

          // Generate and merge labels
          const traefikLabels = this.generateDockerLabels(
            serviceName,
            domain,
            port,
            {
              enableTLS: !!options.email,
              certResolver: 'letsencrypt',
            }
          );

          service.labels = {
            ...service.labels,
            ...traefikLabels,
          };
        }
      }
    }

    return compose;
  }

  /**
   * Generate complete Traefik setup for Kubernetes
   */
  static generateKubernetesSetup(
    services: Array<{ name: string; domain: string; port: number }>,
    namespace: string = 'default',
    options: TraefikOptions = {}
  ): Record<string, string> {
    const files: Record<string, string> = {};

    // Generate IngressRoute for each service
    services.forEach((service) => {
      const ingressRoute = this.generateKubernetesIngressRoute(
        service.name,
        service.domain,
        service.port,
        namespace,
        {
          enableTLS: !!options.email,
          certResolver: 'letsencrypt',
        }
      );

      files[`ingressroute-${service.name}.yaml`] = ingressRoute;
    });

    return files;
  }

  /**
   * Validate Traefik configuration
   */
  static validate(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required fields
    if (!config.entryPoints) {
      errors.push('Missing entryPoints configuration');
    }

    if (!config.providers) {
      errors.push('Missing providers configuration');
    }

    // Validate Let's Encrypt config
    if (config.certificatesResolvers?.letsencrypt) {
      const acme = config.certificatesResolvers.letsencrypt.acme;
      if (!acme.email) {
        errors.push('Let\'s Encrypt email is required');
      }
      if (!acme.storage) {
        errors.push('ACME storage path is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
