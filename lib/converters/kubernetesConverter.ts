import * as yaml from 'js-yaml';
import {
  DockerCompose,
  DockerComposeService,
  ServiceMetadata,
} from '@/types/dockerCompose';
import {
  KubernetesDeployment,
  KubernetesService,
  KubernetesConfigMap,
  KubernetesPersistentVolumeClaim,
  KubernetesManifests,
  KubernetesConversionResult,
  KubernetesContainer,
} from '@/types/kubernetes';
import { ConversionOptions } from '@/types/project';

/**
 * Kubernetes Converter Class
 * Converts Docker Compose services to Kubernetes manifests
 */
export class KubernetesConverter {
  /**
   * Main conversion method
   */
  static convert(
    dockerCompose: DockerCompose,
    options: ConversionOptions
  ): KubernetesConversionResult {
    const warnings: string[] = [];
    const deployments: KubernetesDeployment[] = [];
    const services: KubernetesService[] = [];
    const configMaps: KubernetesConfigMap[] = [];
    const persistentVolumeClaims: KubernetesPersistentVolumeClaim[] = [];

    const namespace = options.namespace || 'default';

    try {
      // Convert each service
      for (const [serviceName, service] of Object.entries(dockerCompose.services)) {
        // Create Deployment
        const deployment = this.createDeployment(serviceName, service, namespace, options);
        deployments.push(deployment);

        // Create Service if ports are exposed
        if (service.ports && service.ports.length > 0) {
          const k8sService = this.createService(serviceName, service, namespace);
          services.push(k8sService);
        }

        // Create ConfigMap for environment variables
        const envVars = this.extractEnvironmentVariables(service);
        if (Object.keys(envVars).length > 0) {
          const configMap = this.createConfigMap(serviceName, envVars, namespace);
          configMaps.push(configMap);
        }

        // Create PVC for named volumes
        if (service.volumes) {
          const pvcs = this.createPVCs(serviceName, service.volumes, namespace);
          persistentVolumeClaims.push(...pvcs);
        }
      }

      // Generate YAML files
      const yamlFiles: Record<string, string> = {};

      deployments.forEach((deployment) => {
        yamlFiles[`deployment-${deployment.metadata.name}.yaml`] = yaml.dump(deployment, {
          indent: 2,
          lineWidth: -1,
        });
      });

      services.forEach((service) => {
        yamlFiles[`service-${service.metadata.name}.yaml`] = yaml.dump(service, {
          indent: 2,
          lineWidth: -1,
        });
      });

      configMaps.forEach((configMap) => {
        yamlFiles[`configmap-${configMap.metadata.name}.yaml`] = yaml.dump(configMap, {
          indent: 2,
          lineWidth: -1,
        });
      });

      persistentVolumeClaims.forEach((pvc) => {
        yamlFiles[`pvc-${pvc.metadata.name}.yaml`] = yaml.dump(pvc, {
          indent: 2,
          lineWidth: -1,
        });
      });

      return {
        success: true,
        manifests: {
          deployments,
          services,
          configMaps: configMaps.length > 0 ? configMaps : undefined,
          persistentVolumeClaims: persistentVolumeClaims.length > 0 ? persistentVolumeClaims : undefined,
        },
        yaml: yamlFiles,
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
   * Create Kubernetes Deployment from Docker Compose service
   */
  static createDeployment(
    serviceName: string,
    service: DockerComposeService,
    namespace: string,
    options: ConversionOptions
  ): KubernetesDeployment {
    const appName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const replicas = service.deploy?.replicas || 3;

    const labels = {
      app: appName,
      'app.kubernetes.io/name': appName,
      'app.kubernetes.io/component': 'service',
    };

    // Create container definition
    const container: KubernetesContainer = {
      name: appName,
      image: service.image || 'nginx:latest', // Fallback if build is used
      ports: this.convertPorts(service.ports),
      env: this.convertEnvironmentToEnvVars(serviceName, service),
      volumeMounts: this.convertVolumeMounts(service.volumes),
    };

    // Add command if specified
    if (service.command) {
      container.command = Array.isArray(service.command) ? service.command : ['/bin/sh', '-c', service.command];
    }

    // Add working directory
    if (service.working_dir) {
      container.workingDir = service.working_dir;
    }

    // Add resource limits if enabled
    if (options.addResourceLimits) {
      const profile = options.resourceProfile && options.resourceProfile !== 'custom'
        ? options.resourceProfile
        : 'small';
      container.resources = this.getResourceLimits(profile);
    }

    // Add health checks if enabled
    if (options.addHealthChecks) {
      const probes = this.createHealthChecks(service);
      container.livenessProbe = probes.livenessProbe;
      container.readinessProbe = probes.readinessProbe;
    }

    // Add security context if enabled
    if (options.addSecurity) {
      container.securityContext = {
        runAsUser: 1000,
        runAsNonRoot: true,
        readOnlyRootFilesystem: false, // Set to false by default for compatibility
        allowPrivilegeEscalation: false,
        capabilities: {
          drop: ['ALL'],
        },
      };
    }

    const deployment: KubernetesDeployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: appName,
        namespace,
        labels,
      },
      spec: {
        replicas,
        selector: {
          matchLabels: {
            app: appName,
          },
        },
        template: {
          metadata: {
            labels,
          },
          spec: {
            containers: [container],
            volumes: this.convertVolumes(serviceName, service.volumes),
          },
        },
      },
    };

    // Add pod security context if security is enabled
    if (options.addSecurity) {
      deployment.spec.template.spec.securityContext = {
        fsGroup: 1000,
        runAsNonRoot: true,
        seccompProfile: {
          type: 'RuntimeDefault',
        },
      };
    }

    return deployment;
  }

  /**
   * Create Kubernetes Service from Docker Compose service
   */
  static createService(
    serviceName: string,
    service: DockerComposeService,
    namespace: string
  ): KubernetesService {
    const appName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const ports = this.convertPortsForService(service.ports || []);

    // Determine service type (LoadBalancer if ports are exposed, otherwise ClusterIP)
    const serviceType: 'ClusterIP' | 'LoadBalancer' = 'ClusterIP';

    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: appName,
        namespace,
        labels: {
          app: appName,
        },
      },
      spec: {
        type: serviceType,
        selector: {
          app: appName,
        },
        ports,
      },
    };
  }

  /**
   * Create ConfigMap for environment variables
   */
  static createConfigMap(
    serviceName: string,
    envVars: Record<string, string>,
    namespace: string
  ): KubernetesConfigMap {
    const appName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${appName}-config`,
        namespace,
        labels: {
          app: appName,
        },
      },
      data: envVars,
    };
  }

  /**
   * Create PersistentVolumeClaims for named volumes
   */
  static createPVCs(
    serviceName: string,
    volumes: string[],
    namespace: string
  ): KubernetesPersistentVolumeClaim[] {
    const appName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const pvcs: KubernetesPersistentVolumeClaim[] = [];

    volumes.forEach((volumeStr, index) => {
      const parts = volumeStr.split(':');
      const source = parts[0];

      // Only create PVC for named volumes (not bind mounts)
      if (!source.startsWith('/') && !source.startsWith('.')) {
        const pvcName = `${appName}-${source}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        pvcs.push({
          apiVersion: 'v1',
          kind: 'PersistentVolumeClaim',
          metadata: {
            name: pvcName,
            namespace,
            labels: {
              app: appName,
            },
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: '1Gi', // Default size
              },
            },
          },
        });
      }
    });

    return pvcs;
  }

  /**
   * Convert Docker Compose ports to Kubernetes container ports
   */
  private static convertPorts(ports?: string[]) {
    if (!ports || ports.length === 0) return undefined;

    return ports.map((portStr) => {
      const parts = portStr.split(':');
      const lastPart = parts[parts.length - 1];

      let port: number;
      let protocol: 'TCP' | 'UDP' = 'TCP';

      if (lastPart.includes('/')) {
        const [portNum, proto] = lastPart.split('/');
        port = parseInt(portNum, 10);
        protocol = proto.toUpperCase() as 'TCP' | 'UDP';
      } else {
        port = parseInt(lastPart, 10);
      }

      return {
        containerPort: port,
        protocol,
      };
    });
  }

  /**
   * Convert Docker Compose ports for Kubernetes Service
   */
  private static convertPortsForService(ports: string[]) {
    return ports.map((portStr, index) => {
      const parts = portStr.split(':');
      let hostPort: number;
      let containerPort: number;
      let protocol: 'TCP' | 'UDP' = 'TCP';

      let lastPart = parts[parts.length - 1];
      if (lastPart.includes('/')) {
        const [port, proto] = lastPart.split('/');
        lastPart = port;
        protocol = proto.toUpperCase() as 'TCP' | 'UDP';
      }

      if (parts.length === 2) {
        hostPort = parseInt(parts[0], 10);
        containerPort = parseInt(lastPart, 10);
      } else if (parts.length === 3) {
        hostPort = parseInt(parts[1], 10);
        containerPort = parseInt(lastPart, 10);
      } else {
        containerPort = parseInt(lastPart, 10);
        hostPort = containerPort;
      }

      return {
        name: `port-${index}`,
        protocol,
        port: hostPort,
        targetPort: containerPort,
      };
    });
  }

  /**
   * Convert environment variables to Kubernetes env format
   */
  private static convertEnvironmentToEnvVars(serviceName: string, service: DockerComposeService) {
    const envVars = this.extractEnvironmentVariables(service);
    const appName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    return Object.entries(envVars).map(([key, value]) => ({
      name: key,
      valueFrom: {
        configMapKeyRef: {
          name: `${appName}-config`,
          key,
        },
      },
    }));
  }

  /**
   * Extract environment variables from Docker Compose service
   */
  private static extractEnvironmentVariables(service: DockerComposeService): Record<string, string> {
    if (!service.environment) return {};

    if (Array.isArray(service.environment)) {
      const result: Record<string, string> = {};
      service.environment.forEach((envStr) => {
        const [key, ...valueParts] = envStr.split('=');
        if (key) {
          result[key] = valueParts.join('=') || '';
        }
      });
      return result;
    }

    // Convert all values to strings for Kubernetes ConfigMap compatibility
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(service.environment)) {
      result[key] = String(value);
    }
    return result;
  }

  /**
   * Convert volume mounts to Kubernetes format
   */
  private static convertVolumeMounts(volumes?: string[]) {
    if (!volumes || volumes.length === 0) return undefined;

    return volumes.map((volumeStr) => {
      const parts = volumeStr.split(':');
      const source = parts[0];
      const target = parts[1];
      const readOnly = parts[2] === 'ro';

      const volumeName = source.startsWith('/') || source.startsWith('.')
        ? 'host-volume'
        : source.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      return {
        name: volumeName,
        mountPath: target,
        readOnly,
      };
    });
  }

  /**
   * Convert volumes to Kubernetes volume definitions
   */
  private static convertVolumes(serviceName: string, volumes?: string[]) {
    if (!volumes || volumes.length === 0) return undefined;

    const appName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const volumeDefs: any[] = [];

    volumes.forEach((volumeStr) => {
      const parts = volumeStr.split(':');
      const source = parts[0];

      if (!source.startsWith('/') && !source.startsWith('.')) {
        const volumeName = source.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const pvcName = `${appName}-${volumeName}`;

        volumeDefs.push({
          name: volumeName,
          persistentVolumeClaim: {
            claimName: pvcName,
          },
        });
      }
    });

    return volumeDefs.length > 0 ? volumeDefs : undefined;
  }

  /**
   * Create health check probes
   */
  private static createHealthChecks(service: DockerComposeService) {
    const ports = service.ports || [];
    const firstPort = ports.length > 0 ? parseInt(ports[0].split(':').pop()?.split('/')[0] || '8080', 10) : 8080;

    return {
      livenessProbe: {
        httpGet: {
          path: '/health',
          port: firstPort,
          scheme: 'HTTP' as const,
        },
        initialDelaySeconds: 30,
        periodSeconds: 10,
        timeoutSeconds: 5,
        failureThreshold: 3,
      },
      readinessProbe: {
        httpGet: {
          path: '/ready',
          port: firstPort,
          scheme: 'HTTP' as const,
        },
        initialDelaySeconds: 10,
        periodSeconds: 5,
        timeoutSeconds: 3,
        failureThreshold: 3,
      },
    };
  }

  /**
   * Get resource limits based on profile
   */
  private static getResourceLimits(profile: 'small' | 'medium' | 'large') {
    const profiles = {
      small: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '500m', memory: '512Mi' },
      },
      medium: {
        requests: { cpu: '250m', memory: '256Mi' },
        limits: { cpu: '1000m', memory: '1Gi' },
      },
      large: {
        requests: { cpu: '500m', memory: '512Mi' },
        limits: { cpu: '2000m', memory: '2Gi' },
      },
    };

    return profiles[profile];
  }
}
