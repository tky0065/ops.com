// Project Management Type Definitions

import { DockerCompose } from './dockerCompose';
import { KubernetesManifests } from './kubernetes';

/**
 * Target Platform for Conversion
 */
export type TargetPlatform = 'kubernetes' | 'swarm' | 'both';

/**
 * Reverse Proxy Type
 */
export type ProxyType = 'traefik' | 'nginx' | 'caddy' | 'none';

/**
 * Resource Profile for Limits
 */
export type ResourceProfile = 'small' | 'medium' | 'large' | 'custom';

/**
 * Conversion Options
 */
export interface ConversionOptions {
  targetPlatform: TargetPlatform;
  proxyType: ProxyType;
  addHealthChecks: boolean;
  addResourceLimits: boolean;
  resourceProfile?: ResourceProfile;
  addSecurity: boolean;
  letsEncryptEmail?: string;
  namespace?: string;
  customDomains?: Record<string, string>; // serviceName -> domain
  customResources?: {
    cpu?: {
      request?: string;
      limit?: string;
    };
    memory?: {
      request?: string;
      limit?: string;
    };
  };
}

/**
 * Conversion Results
 */
export interface ConversionResult {
  kubernetes?: {
    manifests: KubernetesManifests;
    yaml: Record<string, string>; // filename -> content
  };
  dockerStack?: {
    yaml: string;
  };
  proxy?: {
    type: ProxyType;
    config: string;
    filename: string;
  };
  helm?: {
    chartYaml: string;
    valuesYaml: string;
    templates: Record<string, string>; // template filename -> content
  };
  documentation?: {
    readme: string;
    envExample?: string;
  };
  warnings?: string[];
  errors?: string[];
}

/**
 * Project Stored in LocalStorage
 */
export interface Project {
  id: string;
  name: string;
  dockerCompose: {
    filename: string;
    content: string;
    parsed: DockerCompose;
  };
  options: ConversionOptions;
  results?: ConversionResult;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Project List Item (minimal data for list view)
 */
export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  targetPlatform: TargetPlatform;
  proxyType: ProxyType;
  serviceCount: number;
}

/**
 * LocalStorage Manager Response
 */
export interface StorageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Storage Space Info
 */
export interface StorageSpaceInfo {
  used: number; // bytes
  available: number; // bytes
  usagePercentage: number;
  limit: number; // bytes (typically 5-10MB)
  warning: boolean; // true if > 80%
}

/**
 * Export Options
 */
export interface ExportOptions {
  includeKubernetes?: boolean;
  includeDockerStack?: boolean;
  includeProxy?: boolean;
  includeHelm?: boolean;
  includeDocumentation?: boolean;
  format: 'zip' | 'tar.gz';
}

/**
 * Template Definition
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'database' | 'fullstack' | 'microservices' | 'other';
  icon?: string;
  dockerCompose: string; // YAML content
  previewImage?: string;
  defaultOptions: Partial<ConversionOptions>;
  customizableFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'select';
    defaultValue?: string | number;
    options?: string[]; // for select type
  }>;
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  info?: ValidationError[];
}
