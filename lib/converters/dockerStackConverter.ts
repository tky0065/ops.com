import * as yaml from 'js-yaml';
import {
  DockerCompose,
  DockerComposeService,
  DockerComposeNetwork,
} from '@/types/dockerCompose';
import { ConversionOptions } from '@/types/project';

/**
 * Docker Stack Converter Result
 */
export interface DockerStackConversionResult {
  success: boolean;
  yaml?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Docker Stack Converter Class
 * Converts Docker Compose to Docker Swarm Stack format
 */
export class DockerStackConverter {
  /**
   * Main conversion method
   */
  static convert(
    dockerCompose: DockerCompose,
    options: ConversionOptions
  ): DockerStackConversionResult {
    const warnings: string[] = [];

    try {
      // Clone the docker compose to avoid mutating original
      const stackCompose: any = JSON.parse(JSON.stringify(dockerCompose));

      // Ensure version is compatible with Swarm (3.3+)
      if (!stackCompose.version || parseFloat(stackCompose.version) < 3.3) {
        stackCompose.version = '3.8';
        warnings.push('Updated version to 3.8 for Docker Swarm compatibility');
      }

      // Process each service
      for (const [serviceName, service] of Object.entries(stackCompose.services)) {
        this.addDeployConfig(service as any, options);

        // Add healthchecks if enabled
        if (options.addHealthChecks) {
          this.addHealthCheck(service as any);
        }

        // Remove build context (not supported in stack deploy)
        if ((service as any).build) {
          warnings.push(`Service '${serviceName}' has 'build' context which is not supported in Docker Stack. Please build and push the image first.`);
          delete (service as any).build;
        }

        // Ensure image is present
        if (!(service as any).image) {
          warnings.push(`Service '${serviceName}' is missing 'image' field. This is required for Docker Stack deployment.`);
        }
      }

      // Configure networks for Swarm (overlay with attachable)
      if (stackCompose.networks) {
        for (const [networkName, network] of Object.entries(stackCompose.networks)) {
          this.configureNetwork(network as any);
        }
      } else {
        // Create default network
        stackCompose.networks = {
          default: {
            driver: 'overlay',
            attachable: true,
          },
        };
      }

      // Generate YAML
      const yamlContent = yaml.dump(stackCompose, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });

      return {
        success: true,
        yaml: yamlContent,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error',
      };
    }
  }

  /**
   * Add deploy configuration to a service
   */
  private static addDeployConfig(service: any, options: ConversionOptions): void {
    // Initialize deploy section if it doesn't exist
    if (!service.deploy) {
      service.deploy = {};
    }

    // Set replicas (default: 3)
    if (!service.deploy.replicas) {
      service.deploy.replicas = 3;
    }

    // Add placement constraints
    if (!service.deploy.placement) {
      service.deploy.placement = {
        constraints: ['node.role == worker'],
      };
    }

    // Add restart policy
    if (!service.deploy.restart_policy) {
      service.deploy.restart_policy = {
        condition: 'on-failure',
        delay: '5s',
        max_attempts: 3,
        window: '120s',
      };
    }

    // Add resource limits if enabled
    if (options.addResourceLimits) {
      const profile = options.resourceProfile && options.resourceProfile !== 'custom'
        ? options.resourceProfile
        : 'small';
      const resources = this.getResourceLimits(profile);
      service.deploy.resources = resources;
    }

    // Add update config for rolling updates
    if (!service.deploy.update_config) {
      service.deploy.update_config = {
        parallelism: 2,
        delay: '10s',
        failure_action: 'rollback',
        order: 'start-first',
      };
    }

    // Add rollback config
    if (!service.deploy.rollback_config) {
      service.deploy.rollback_config = {
        parallelism: 0,
        order: 'stop-first',
      };
    }

    // Add labels for better organization
    if (!service.deploy.labels) {
      service.deploy.labels = {};
    }
  }

  /**
   * Add healthcheck to a service
   */
  private static addHealthCheck(service: any): void {
    // Skip if healthcheck already exists
    if (service.healthcheck) {
      return;
    }

    // Try to detect port for health check
    let port = 80;
    if (service.ports && service.ports.length > 0) {
      const portStr = service.ports[0];
      const parts = portStr.split(':');
      const lastPart = parts[parts.length - 1];
      port = parseInt(lastPart.split('/')[0], 10) || 80;
    }

    // Default health check using curl or wget
    service.healthcheck = {
      test: ['CMD-SHELL', `curl -f http://localhost:${port}/health || exit 1`],
      interval: '30s',
      timeout: '10s',
      retries: 3,
      start_period: '40s',
    };
  }

  /**
   * Configure network for Swarm mode
   */
  private static configureNetwork(network: any): void {
    if (!network) {
      return;
    }

    // Set driver to overlay if not specified
    if (!network.driver) {
      network.driver = 'overlay';
    }

    // Enable attachable for easier debugging
    if (network.attachable === undefined) {
      network.attachable = true;
    }
  }

  /**
   * Get resource limits based on profile
   */
  private static getResourceLimits(profile: 'small' | 'medium' | 'large') {
    const profiles = {
      small: {
        limits: {
          cpus: '0.50',
          memory: '512M',
        },
        reservations: {
          cpus: '0.10',
          memory: '128M',
        },
      },
      medium: {
        limits: {
          cpus: '1.00',
          memory: '1G',
        },
        reservations: {
          cpus: '0.25',
          memory: '256M',
        },
      },
      large: {
        limits: {
          cpus: '2.00',
          memory: '2G',
        },
        reservations: {
          cpus: '0.50',
          memory: '512M',
        },
      },
    };

    return profiles[profile];
  }

  /**
   * Validate service for Stack deployment
   */
  static validateService(serviceName: string, service: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Image is required for stack deploy
    if (!service.image) {
      errors.push(`Service '${serviceName}' must have 'image' field for Docker Stack deployment`);
    }

    // Build context is not supported
    if (service.build) {
      errors.push(`Service '${serviceName}' has 'build' context which is not supported in Docker Stack`);
    }

    // Container name is not supported in swarm mode
    if (service.container_name) {
      errors.push(`Service '${serviceName}' has 'container_name' which is not supported in Docker Swarm mode`);
    }

    // Links are deprecated
    if (service.links) {
      errors.push(`Service '${serviceName}' uses 'links' which are deprecated. Use service names for DNS resolution instead`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add security best practices to service
   */
  static addSecurityBestPractices(service: any): void {
    // Add read-only root filesystem where possible
    // Note: This may break some applications, use with caution
    if (!service.read_only) {
      // Don't force this by default as it can break many apps
      // service.read_only = true;
    }

    // Add user specification (non-root)
    if (!service.user && service.deploy) {
      // service.user = '1000:1000'; // Commented out as this can break many images
    }

    // Add tmpfs for temporary files
    if (!service.tmpfs) {
      service.tmpfs = ['/tmp', '/run'];
    }

    // Add security_opt for additional security
    if (!service.security_opt) {
      service.security_opt = [
        'no-new-privileges:true',
      ];
    }
  }

  /**
   * Optimize service for production
   */
  static optimizeForProduction(service: any): void {
    // Add logging configuration
    if (!service.logging) {
      service.logging = {
        driver: 'json-file',
        options: {
          'max-size': '10m',
          'max-file': '3',
        },
      };
    }

    // Add stop grace period
    if (!service.stop_grace_period) {
      service.stop_grace_period = '30s';
    }

    // Ensure restart is not set (conflicts with deploy.restart_policy)
    if (service.restart) {
      delete service.restart;
    }
  }

  /**
   * Generate complete production-ready stack
   */
  static convertWithOptimizations(
    dockerCompose: DockerCompose,
    options: ConversionOptions
  ): DockerStackConversionResult {
    // First do basic conversion
    const result = this.convert(dockerCompose, options);

    if (!result.success || !result.yaml) {
      return result;
    }

    try {
      // Parse the generated YAML
      const stackCompose = yaml.load(result.yaml) as any;

      // Apply optimizations to each service
      for (const service of Object.values(stackCompose.services)) {
        this.optimizeForProduction(service as any);

        if (options.addSecurity) {
          this.addSecurityBestPractices(service as any);
        }
      }

      // Re-generate YAML
      const optimizedYaml = yaml.dump(stackCompose, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });

      return {
        ...result,
        yaml: optimizedYaml,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Optimization failed',
      };
    }
  }
}
