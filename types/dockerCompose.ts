// Docker Compose v3.x Type Definitions

/**
 * Docker Compose Service Definition
 */
export interface DockerComposeService {
  image?: string;
  build?: string | {
    context: string;
    dockerfile?: string;
    args?: Record<string, string>;
  };
  container_name?: string;
  ports?: string[];
  environment?: Record<string, string> | string[];
  env_file?: string | string[];
  volumes?: string[];
  networks?: string[];
  depends_on?: string[];
  command?: string | string[];
  entrypoint?: string | string[];
  working_dir?: string;
  user?: string;
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  labels?: Record<string, string>;
  deploy?: {
    replicas?: number;
    placement?: {
      constraints?: string[];
    };
    resources?: {
      limits?: {
        cpus?: string;
        memory?: string;
      };
      reservations?: {
        cpus?: string;
        memory?: string;
      };
    };
    restart_policy?: {
      condition?: 'none' | 'on-failure' | 'any';
      delay?: string;
      max_attempts?: number;
      window?: string;
    };
  };
  healthcheck?: {
    test?: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
  };
  expose?: string[];
  extra_hosts?: string[];
  dns?: string | string[];
  dns_search?: string | string[];
  tmpfs?: string | string[];
  logging?: {
    driver?: string;
    options?: Record<string, string>;
  };
  [key: string]: any; // Allow additional properties
}

/**
 * Docker Compose Volume Definition
 */
export interface DockerComposeVolume {
  driver?: string;
  driver_opts?: Record<string, string>;
  external?: boolean | { name: string };
  labels?: Record<string, string>;
  name?: string;
}

/**
 * Docker Compose Network Definition
 */
export interface DockerComposeNetwork {
  driver?: string;
  driver_opts?: Record<string, string>;
  attachable?: boolean;
  external?: boolean | { name: string };
  labels?: Record<string, string>;
  name?: string;
  ipam?: {
    driver?: string;
    config?: Array<{
      subnet?: string;
      gateway?: string;
      ip_range?: string;
    }>;
  };
}

/**
 * Complete Docker Compose File Structure
 */
export interface DockerCompose {
  version?: string;
  services: Record<string, DockerComposeService>;
  volumes?: Record<string, DockerComposeVolume | null>;
  networks?: Record<string, DockerComposeNetwork | null>;
}

/**
 * Port Mapping Parsed
 */
export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
}

/**
 * Volume Mount Parsed
 */
export interface VolumeMount {
  type: 'bind' | 'volume';
  source: string;
  target: string;
  readOnly?: boolean;
}

/**
 * Service Metadata Extracted
 */
export interface ServiceMetadata {
  name: string;
  image?: string;
  ports: PortMapping[];
  volumes: VolumeMount[];
  environmentVariables: Record<string, string>;
  dependsOn: string[];
  hasHealthCheck: boolean;
  replicas?: number;
}

/**
 * Docker Compose Parse Result
 */
export interface DockerComposeParseResult {
  success: boolean;
  data?: DockerCompose;
  metadata?: {
    services: ServiceMetadata[];
    volumeNames: string[];
    networkNames: string[];
  };
  error?: string;
  warnings?: string[];
}
