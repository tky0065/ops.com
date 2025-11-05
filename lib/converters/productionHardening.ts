import {
  KubernetesDeployment,
  KubernetesProbe,
  KubernetesContainer,
} from '@/types/kubernetes';

/**
 * Resource Profile Type
 */
export type HardeningResourceProfile = 'small' | 'medium' | 'large';

/**
 * Health Check Options
 */
export interface HealthCheckOptions {
  livenessPath?: string; // Default: /health
  readinessPath?: string; // Default: /ready
  port?: number | string; // Auto-detect if not provided
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  failureThreshold?: number;
  useTCP?: boolean; // Fallback to TCP probe
}

/**
 * Resource Limit Options
 */
export interface ResourceLimitOptions {
  profile?: HardeningResourceProfile;
  custom?: {
    requests?: {
      cpu?: string;
      memory?: string;
    };
    limits?: {
      cpu?: string;
      memory?: string;
    };
  };
}

/**
 * Security Options
 */
export interface SecurityOptions {
  runAsUser?: number; // Default: 1000
  fsGroup?: number; // Default: 1000
  readOnlyRootFilesystem?: boolean; // Default: false (compatibility)
  allowPrivilegeEscalation?: boolean; // Default: false
  dropCapabilities?: boolean; // Default: true
}

/**
 * Production Hardening Class
 * Applies production-ready configurations to Kubernetes deployments
 */
export class ProductionHardening {
  /**
   * Add health check probes to deployment
   */
  static addHealthChecks(
    deployment: KubernetesDeployment,
    options: HealthCheckOptions = {}
  ): KubernetesDeployment {
    const hardened = JSON.parse(JSON.stringify(deployment));

    hardened.spec.template.spec.containers.forEach((container: KubernetesContainer) => {
      // Auto-detect port if not provided
      let port = options.port;
      if (!port && container.ports && container.ports.length > 0) {
        port = container.ports[0].containerPort;
      }

      // Default to TCP if no port found or useTCP is true
      if (!port || options.useTCP) {
        // TCP Probe
        const tcpPort = port || (container.ports?.[0]?.containerPort || 8080);

        container.livenessProbe = {
          tcpSocket: {
            port: tcpPort,
          },
          initialDelaySeconds: options.initialDelaySeconds || 30,
          periodSeconds: options.periodSeconds || 10,
          timeoutSeconds: options.timeoutSeconds || 5,
          failureThreshold: options.failureThreshold || 3,
        };

        container.readinessProbe = {
          tcpSocket: {
            port: tcpPort,
          },
          initialDelaySeconds: options.initialDelaySeconds || 10,
          periodSeconds: options.periodSeconds || 5,
          timeoutSeconds: options.timeoutSeconds || 3,
          failureThreshold: options.failureThreshold || 3,
        };
      } else {
        // HTTP Probe
        container.livenessProbe = {
          httpGet: {
            path: options.livenessPath || '/health',
            port: port,
            scheme: 'HTTP',
          },
          initialDelaySeconds: options.initialDelaySeconds || 30,
          periodSeconds: options.periodSeconds || 10,
          timeoutSeconds: options.timeoutSeconds || 5,
          failureThreshold: options.failureThreshold || 3,
        };

        container.readinessProbe = {
          httpGet: {
            path: options.readinessPath || '/ready',
            port: port,
            scheme: 'HTTP',
          },
          initialDelaySeconds: options.initialDelaySeconds || 10,
          periodSeconds: options.periodSeconds || 5,
          timeoutSeconds: options.timeoutSeconds || 3,
          failureThreshold: options.failureThreshold || 3,
        };
      }
    });

    return hardened;
  }

  /**
   * Add resource limits to deployment
   */
  static addResourceLimits(
    deployment: KubernetesDeployment,
    options: ResourceLimitOptions = {}
  ): KubernetesDeployment {
    const hardened = JSON.parse(JSON.stringify(deployment));

    // Get resources based on profile or custom
    const resources = options.custom || this.getResourceProfile(options.profile || 'small');

    hardened.spec.template.spec.containers.forEach((container: KubernetesContainer) => {
      container.resources = resources;
    });

    return hardened;
  }

  /**
   * Get resource limits for a profile
   */
  private static getResourceProfile(profile: HardeningResourceProfile) {
    const profiles = {
      small: {
        requests: {
          cpu: '100m',
          memory: '128Mi',
        },
        limits: {
          cpu: '500m',
          memory: '512Mi',
        },
      },
      medium: {
        requests: {
          cpu: '250m',
          memory: '256Mi',
        },
        limits: {
          cpu: '1000m',
          memory: '1Gi',
        },
      },
      large: {
        requests: {
          cpu: '500m',
          memory: '512Mi',
        },
        limits: {
          cpu: '2000m',
          memory: '2Gi',
        },
      },
    };

    return profiles[profile];
  }

  /**
   * Add security best practices to deployment
   */
  static addSecurityBestPractices(
    deployment: KubernetesDeployment,
    options: SecurityOptions = {}
  ): KubernetesDeployment {
    const hardened = JSON.parse(JSON.stringify(deployment));

    // Container Security Context
    hardened.spec.template.spec.containers.forEach((container: KubernetesContainer) => {
      container.securityContext = {
        runAsUser: options.runAsUser || 1000,
        runAsNonRoot: true,
        readOnlyRootFilesystem: options.readOnlyRootFilesystem || false,
        allowPrivilegeEscalation: options.allowPrivilegeEscalation !== undefined
          ? options.allowPrivilegeEscalation
          : false,
        capabilities: options.dropCapabilities !== false
          ? {
              drop: ['ALL'],
            }
          : undefined,
      };
    });

    // Pod Security Context
    hardened.spec.template.spec.securityContext = {
      fsGroup: options.fsGroup || 1000,
      runAsNonRoot: true,
      seccompProfile: {
        type: 'RuntimeDefault',
      },
    };

    return hardened;
  }

  /**
   * Apply all production optimizations
   */
  static applyAllOptimizations(
    deployment: KubernetesDeployment,
    options: {
      healthChecks?: HealthCheckOptions | boolean;
      resourceLimits?: ResourceLimitOptions | boolean;
      security?: SecurityOptions | boolean;
    } = {}
  ): KubernetesDeployment {
    let hardened = JSON.parse(JSON.stringify(deployment));

    // Add health checks
    if (options.healthChecks !== false) {
      const healthCheckOpts = typeof options.healthChecks === 'object'
        ? options.healthChecks
        : {};
      hardened = this.addHealthChecks(hardened, healthCheckOpts);
    }

    // Add resource limits
    if (options.resourceLimits !== false) {
      const resourceOpts = typeof options.resourceLimits === 'object'
        ? options.resourceLimits
        : { profile: 'medium' as HardeningResourceProfile };
      hardened = this.addResourceLimits(hardened, resourceOpts);
    }

    // Add security best practices
    if (options.security !== false) {
      const securityOpts = typeof options.security === 'object'
        ? options.security
        : {};
      hardened = this.addSecurityBestPractices(hardened, securityOpts);
    }

    return hardened;
  }

  /**
   * Validate resource limits are reasonable
   */
  static validateResourceLimits(resources: any): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (!resources) {
      warnings.push('No resource limits defined');
      return { valid: false, warnings };
    }

    // Check CPU requests
    if (resources.requests?.cpu) {
      const cpuRequest = this.parseCPU(resources.requests.cpu);
      if (cpuRequest < 10) {
        warnings.push(`CPU request (${resources.requests.cpu}) seems very low, may cause throttling`);
      }
    }

    // Check memory requests
    if (resources.requests?.memory) {
      const memRequest = this.parseMemory(resources.requests.memory);
      if (memRequest < 64) {
        warnings.push(`Memory request (${resources.requests.memory}) seems very low, may cause OOM`);
      }
    }

    // Check limits vs requests
    if (resources.limits && resources.requests) {
      const cpuLimit = this.parseCPU(resources.limits.cpu || '0');
      const cpuRequest = this.parseCPU(resources.requests.cpu || '0');

      if (cpuLimit > 0 && cpuRequest > 0 && cpuLimit < cpuRequest) {
        warnings.push('CPU limit is lower than request');
      }

      const memLimit = this.parseMemory(resources.limits.memory || '0');
      const memRequest = this.parseMemory(resources.requests.memory || '0');

      if (memLimit > 0 && memRequest > 0 && memLimit < memRequest) {
        warnings.push('Memory limit is lower than request');
      }
    }

    return { valid: warnings.length === 0, warnings };
  }

  /**
   * Parse CPU value to millicores
   */
  private static parseCPU(cpu: string): number {
    if (cpu.endsWith('m')) {
      return parseInt(cpu.slice(0, -1), 10);
    }
    return parseFloat(cpu) * 1000;
  }

  /**
   * Parse memory value to MiB
   */
  private static parseMemory(memory: string): number {
    const units: Record<string, number> = {
      'Ki': 1 / 1024,
      'Mi': 1,
      'Gi': 1024,
      'Ti': 1024 * 1024,
      'K': 1 / 1000,
      'M': 1,
      'G': 1000,
      'T': 1000 * 1000,
    };

    for (const [unit, multiplier] of Object.entries(units)) {
      if (memory.endsWith(unit)) {
        const value = parseFloat(memory.slice(0, -unit.length));
        return value * multiplier;
      }
    }

    // Assume bytes if no unit
    return parseFloat(memory) / (1024 * 1024);
  }

  /**
   * Generate deployment recommendations
   */
  static generateRecommendations(deployment: KubernetesDeployment): string[] {
    const recommendations: string[] = [];

    deployment.spec.template.spec.containers.forEach((container, index) => {
      const containerName = container.name || `container-${index}`;

      // Check health probes
      if (!container.livenessProbe) {
        recommendations.push(`Add liveness probe to container '${containerName}'`);
      }
      if (!container.readinessProbe) {
        recommendations.push(`Add readiness probe to container '${containerName}'`);
      }

      // Check resources
      if (!container.resources) {
        recommendations.push(`Define resource limits for container '${containerName}'`);
      } else {
        if (!container.resources.requests) {
          recommendations.push(`Define resource requests for container '${containerName}'`);
        }
        if (!container.resources.limits) {
          recommendations.push(`Define resource limits for container '${containerName}'`);
        }
      }

      // Check security context
      if (!container.securityContext) {
        recommendations.push(`Add security context to container '${containerName}'`);
      } else {
        if (!container.securityContext.runAsNonRoot) {
          recommendations.push(`Set runAsNonRoot=true for container '${containerName}'`);
        }
        if (container.securityContext.allowPrivilegeEscalation !== false) {
          recommendations.push(`Set allowPrivilegeEscalation=false for container '${containerName}'`);
        }
      }
    });

    // Check pod security context
    if (!deployment.spec.template.spec.securityContext) {
      recommendations.push('Add pod security context');
    }

    return recommendations;
  }
}
