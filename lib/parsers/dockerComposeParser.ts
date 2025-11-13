import * as yaml from 'js-yaml';
import { z } from 'zod';
import {
  DockerCompose,
  DockerComposeParseResult,
  ServiceMetadata,
  PortMapping,
  VolumeMount,
} from '@/types/dockerCompose';

/**
 * Zod Schema for Docker Compose Service
 */
const serviceSchema = z.object({
  image: z.string().optional(),
  build: z.union([
    z.string(),
    z.object({
      context: z.string(),
      dockerfile: z.string().optional(),
      args: z.record(z.string(), z.string()).optional(),
    }),
  ]).optional(),
  container_name: z.string().optional(),
  ports: z.array(z.string()).optional(),
  environment: z.union([
    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    z.array(z.string()),
  ]).optional(),
  env_file: z.union([z.string(), z.array(z.string())]).optional(),
  volumes: z.array(z.string()).optional(),
  networks: z.array(z.string()).optional(),
  depends_on: z.union([
    z.array(z.string()),
    z.record(z.string(), z.object({
      condition: z.enum(['service_started', 'service_healthy', 'service_completed_successfully']).optional(),
      restart: z.boolean().optional(),
    }).passthrough()),
  ]).optional(),
  command: z.union([z.string(), z.array(z.string())]).optional(),
  entrypoint: z.union([z.string(), z.array(z.string())]).optional(),
  working_dir: z.string().optional(),
  user: z.string().optional(),
  restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).optional(),
  labels: z.record(z.string(), z.string()).optional(),
  deploy: z.object({
    replicas: z.number().optional(),
    placement: z.object({
      constraints: z.array(z.string()).optional(),
    }).optional(),
    resources: z.object({
      limits: z.object({
        cpus: z.string().optional(),
        memory: z.string().optional(),
      }).optional(),
      reservations: z.object({
        cpus: z.string().optional(),
        memory: z.string().optional(),
      }).optional(),
    }).optional(),
    restart_policy: z.object({
      condition: z.enum(['none', 'on-failure', 'any']).optional(),
      delay: z.string().optional(),
      max_attempts: z.number().optional(),
      window: z.string().optional(),
    }).optional(),
  }).optional(),
  healthcheck: z.object({
    test: z.union([z.string(), z.array(z.string())]).optional(),
    interval: z.string().optional(),
    timeout: z.string().optional(),
    retries: z.number().optional(),
    start_period: z.string().optional(),
  }).optional(),
  expose: z.array(z.string()).optional(),
  extra_hosts: z.array(z.string()).optional(),
  dns: z.union([z.string(), z.array(z.string())]).optional(),
  dns_search: z.union([z.string(), z.array(z.string())]).optional(),
  tmpfs: z.union([z.string(), z.array(z.string())]).optional(),
  logging: z.object({
    driver: z.string().optional(),
    options: z.record(z.string(), z.string()).optional(),
  }).optional(),
}).passthrough(); // Allow additional properties

/**
 * Zod Schema for Docker Compose Volume
 */
const volumeSchema = z.union([
  z.null(),
  z.object({
    driver: z.string().optional(),
    driver_opts: z.record(z.string(), z.string()).optional(),
    external: z.union([z.boolean(), z.object({ name: z.string() })]).optional(),
    labels: z.record(z.string(), z.string()).optional(),
    name: z.string().optional(),
  }).passthrough(),
]);

/**
 * Zod Schema for Docker Compose Network
 */
const networkSchema = z.union([
  z.null(),
  z.object({
    driver: z.string().optional(),
    driver_opts: z.record(z.string(), z.string()).optional(),
    attachable: z.boolean().optional(),
    external: z.union([z.boolean(), z.object({ name: z.string() })]).optional(),
    labels: z.record(z.string(), z.string()).optional(),
    name: z.string().optional(),
    ipam: z.object({
      driver: z.string().optional(),
      config: z.array(z.object({
        subnet: z.string().optional(),
        gateway: z.string().optional(),
        ip_range: z.string().optional(),
      })).optional(),
    }).optional(),
  }).passthrough(),
]);

/**
 * Zod Schema for Complete Docker Compose File
 */
const dockerComposeSchema = z.object({
  version: z.string().optional(),
  services: z.record(z.string(), serviceSchema),
  volumes: z.record(z.string(), volumeSchema).optional(),
  networks: z.record(z.string(), networkSchema).optional(),
}).passthrough();

/**
 * Docker Compose Parser Class
 */
export class DockerComposeParser {
  /**
   * Parse and validate Docker Compose YAML content
   */
  static parse(yamlContent: string): DockerComposeParseResult {
    const warnings: string[] = [];

    try {
      // Parse YAML
      const parsed = yaml.load(yamlContent) as any;

      if (!parsed || typeof parsed !== 'object') {
        return {
          success: false,
          error: 'Invalid YAML: Expected an object but got ' + typeof parsed,
        };
      }

      // Validate with Zod
      const validationResult = dockerComposeSchema.safeParse(parsed);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map((err) => {
          const path = err.path.join('.');

          // Create user-friendly error messages with specific guidance
          if (err.code === 'invalid_type') {
            return `Field '${path}': Expected ${(err as any).expected} but got ${(err as any).received}`;
          }

          if (err.code === 'invalid_union') {
            return `Field '${path}': Invalid format. Please check the Docker Compose specification`;
          }

          if (err.code === 'invalid_element') {
            return `Field '${path}': Contains invalid element. ${err.message}`;
          }

          return `Field '${path}': ${err.message}`;
        });

        return {
          success: false,
          error: 'Validation failed:\n' + errorMessages.map((msg, i) => `  ${i + 1}. ${msg}`).join('\n'),
        };
      }

      const dockerCompose: DockerCompose = validationResult.data;

      // Check for warnings
      if (!dockerCompose.services || Object.keys(dockerCompose.services).length === 0) {
        warnings.push('No services defined in Docker Compose file');
      }

      // Validate each service has image or build
      for (const [serviceName, service] of Object.entries(dockerCompose.services)) {
        if (!service.image && !service.build) {
          warnings.push(`Service '${serviceName}' has neither 'image' nor 'build' specified`);
        }
      }

      // Extract metadata
      const metadata = this.extractMetadata(dockerCompose);

      return {
        success: true,
        data: dockerCompose,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      if (error instanceof yaml.YAMLException) {
        return {
          success: false,
          error: `YAML parsing error at line ${error.mark?.line || 'unknown'}, column ${error.mark?.column || 'unknown'}: ${error.message}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Extract metadata from parsed Docker Compose
   */
  static extractMetadata(dockerCompose: DockerCompose) {
    const services: ServiceMetadata[] = [];

    for (const [serviceName, service] of Object.entries(dockerCompose.services)) {
      const ports = this.parsePorts(service.ports || []);
      const volumes = this.parseVolumes(service.volumes || []);
      const environmentVariables = this.parseEnvironment(service.environment);

      // Extract depends_on - support both short and long format
      const dependsOn = this.extractDependsOn(service.depends_on);

      services.push({
        name: serviceName,
        image: service.image,
        ports,
        volumes,
        environmentVariables,
        dependsOn,
        hasHealthCheck: !!service.healthcheck,
        replicas: service.deploy?.replicas,
      });
    }

    const volumeNames = dockerCompose.volumes ? Object.keys(dockerCompose.volumes) : [];
    const networkNames = dockerCompose.networks ? Object.keys(dockerCompose.networks) : [];

    return {
      services,
      volumeNames,
      networkNames,
    };
  }

  /**
   * Parse port mappings from Docker Compose format
   * Supports: "80:8080", "127.0.0.1:80:8080", "80:8080/tcp"
   */
  private static parsePorts(ports: string[]): PortMapping[] {
    const result: PortMapping[] = [];

    for (const portStr of ports) {
      const parts = portStr.split(':');
      let hostPort: number;
      let containerPort: number;
      let protocol: 'tcp' | 'udp' = 'tcp';

      // Extract protocol if present
      let lastPart = parts[parts.length - 1];
      if (lastPart.includes('/')) {
        const [port, proto] = lastPart.split('/');
        lastPart = port;
        protocol = proto.toLowerCase() as 'tcp' | 'udp';
      }

      if (parts.length === 2) {
        // Format: "hostPort:containerPort"
        hostPort = parseInt(parts[0], 10);
        containerPort = parseInt(lastPart, 10);
      } else if (parts.length === 3) {
        // Format: "ip:hostPort:containerPort"
        hostPort = parseInt(parts[1], 10);
        containerPort = parseInt(lastPart, 10);
      } else {
        // Single port (exposed but not published)
        containerPort = parseInt(lastPart, 10);
        hostPort = containerPort;
      }

      if (!isNaN(hostPort) && !isNaN(containerPort)) {
        result.push({ hostPort, containerPort, protocol });
      }
    }

    return result;
  }

  /**
   * Parse volume mounts from Docker Compose format
   * Supports: "host:container", "host:container:ro", "volumeName:container"
   */
  private static parseVolumes(volumes: string[]): VolumeMount[] {
    const result: VolumeMount[] = [];

    for (const volumeStr of volumes) {
      const parts = volumeStr.split(':');

      if (parts.length >= 2) {
        const source = parts[0];
        const target = parts[1];
        const readOnly = parts[2] === 'ro';

        // Determine if it's a bind mount or named volume
        const type: 'bind' | 'volume' = source.startsWith('/') || source.startsWith('.') ? 'bind' : 'volume';

        result.push({
          type,
          source,
          target,
          readOnly,
        });
      }
    }

    return result;
  }

  /**
   * Parse environment variables from Docker Compose format
   * Supports: object format and array format ("KEY=VALUE")
   * Converts boolean and number values to strings
   */
  private static parseEnvironment(
    environment?: Record<string, string | number | boolean> | string[]
  ): Record<string, string> {
    if (!environment) {
      return {};
    }

    if (Array.isArray(environment)) {
      const result: Record<string, string> = {};
      for (const envStr of environment) {
        const [key, ...valueParts] = envStr.split('=');
        if (key) {
          result[key] = valueParts.join('=') || '';
        }
      }
      return result;
    }

    // Convert all values to strings
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(environment)) {
      result[key] = String(value);
    }
    return result;
  }

  /**
   * Extract depends_on service names from both short and long format
   * Short format: ["postgres", "redis"]
   * Long format: { postgres: { condition: "service_healthy" }, redis: { condition: "service_started" } }
   */
  private static extractDependsOn(
    dependsOn?: string[] | Record<string, { condition?: string; restart?: boolean }>
  ): string[] {
    if (!dependsOn) {
      return [];
    }

    if (Array.isArray(dependsOn)) {
      return dependsOn;
    }

    // Extract service names from long format
    return Object.keys(dependsOn);
  }

  /**
   * Validate a service has required fields
   */
  static validateService(serviceName: string, service: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!service.image && !service.build) {
      errors.push(`Service '${serviceName}' must have either 'image' or 'build' specified`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
