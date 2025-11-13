/**
 * Kubernetes Validation Rules
 *
 * This module defines validation rules for Kubernetes manifests
 * to simulate kubectl dry-run behavior on the client side.
 */

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ResourceRequirement {
  apiVersion: string;
  kind: string;
  requiredFields: string[];
  optionalFields?: string[];
  metadataRules?: ValidationRule[];
  specRules?: ValidationRule[];
}

// DNS-1123 subdomain pattern (RFC 1123)
const DNS_SUBDOMAIN_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

// DNS-1123 label pattern
const DNS_LABEL_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

// Label value pattern
const LABEL_VALUE_PATTERN = /^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$/;

// Kubernetes resource name validation
export const validateResourceName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.length === 0) {
    return { valid: false, error: 'Resource name cannot be empty' };
  }

  if (name.length > 253) {
    return { valid: false, error: 'Resource name must be no more than 253 characters' };
  }

  if (!DNS_SUBDOMAIN_PATTERN.test(name)) {
    return {
      valid: false,
      error: 'Resource name must consist of lower case alphanumeric characters, "-" or ".", and must start and end with an alphanumeric character',
    };
  }

  return { valid: true };
};

// Label key/value validation
export const validateLabel = (key: string, value: string): { valid: boolean; error?: string } => {
  // Validate key
  const keyParts = key.split('/');
  if (keyParts.length > 2) {
    return { valid: false, error: 'Label key can have at most one "/" separator' };
  }

  if (keyParts.length === 2) {
    const [prefix, name] = keyParts;
    if (prefix.length > 253) {
      return { valid: false, error: 'Label key prefix must be no more than 253 characters' };
    }
    if (!DNS_SUBDOMAIN_PATTERN.test(prefix)) {
      return { valid: false, error: 'Label key prefix must be a valid DNS subdomain' };
    }
    if (name.length === 0 || name.length > 63) {
      return { valid: false, error: 'Label key name must be 1-63 characters' };
    }
    if (!DNS_LABEL_PATTERN.test(name)) {
      return { valid: false, error: 'Label key name must be a valid DNS label' };
    }
  } else {
    const name = keyParts[0];
    if (name.length === 0 || name.length > 63) {
      return { valid: false, error: 'Label key must be 1-63 characters' };
    }
    if (!DNS_LABEL_PATTERN.test(name)) {
      return { valid: false, error: 'Label key must be a valid DNS label' };
    }
  }

  // Validate value
  if (value.length > 63) {
    return { valid: false, error: 'Label value must be no more than 63 characters' };
  }

  if (value.length > 0 && !LABEL_VALUE_PATTERN.test(value)) {
    return {
      valid: false,
      error: 'Label value must be empty or consist of alphanumeric characters, "-", "_" or ".", and must start and end with an alphanumeric character',
    };
  }

  return { valid: true };
};

// Deployment validation rules
export const deploymentRules: ResourceRequirement = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  requiredFields: ['apiVersion', 'kind', 'metadata', 'spec'],
  metadataRules: [
    {
      field: 'metadata.name',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 253,
      pattern: DNS_SUBDOMAIN_PATTERN,
      message: 'Deployment name must be a valid DNS subdomain',
      severity: 'error',
    },
    {
      field: 'metadata.namespace',
      type: 'string',
      pattern: DNS_LABEL_PATTERN,
      message: 'Namespace must be a valid DNS label',
      severity: 'error',
    },
  ],
  specRules: [
    {
      field: 'spec.replicas',
      type: 'number',
      min: 0,
      message: 'Replicas must be a non-negative integer',
      severity: 'error',
    },
    {
      field: 'spec.selector',
      required: true,
      type: 'object',
      message: 'Deployment must have a selector',
      severity: 'error',
    },
    {
      field: 'spec.template',
      required: true,
      type: 'object',
      message: 'Deployment must have a pod template',
      severity: 'error',
    },
  ],
};

// Service validation rules
export const serviceRules: ResourceRequirement = {
  apiVersion: 'v1',
  kind: 'Service',
  requiredFields: ['apiVersion', 'kind', 'metadata', 'spec'],
  metadataRules: [
    {
      field: 'metadata.name',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 253,
      pattern: DNS_SUBDOMAIN_PATTERN,
      message: 'Service name must be a valid DNS subdomain',
      severity: 'error',
    },
  ],
  specRules: [
    {
      field: 'spec.selector',
      type: 'object',
      message: 'Service should have a selector (except for headless services)',
      severity: 'warning',
    },
    {
      field: 'spec.ports',
      required: true,
      type: 'array',
      message: 'Service must define at least one port',
      severity: 'error',
    },
  ],
};

// ConfigMap validation rules
export const configMapRules: ResourceRequirement = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  requiredFields: ['apiVersion', 'kind', 'metadata'],
  metadataRules: [
    {
      field: 'metadata.name',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 253,
      pattern: DNS_SUBDOMAIN_PATTERN,
      message: 'ConfigMap name must be a valid DNS subdomain',
      severity: 'error',
    },
  ],
};

// PersistentVolumeClaim validation rules
export const pvcRules: ResourceRequirement = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  requiredFields: ['apiVersion', 'kind', 'metadata', 'spec'],
  metadataRules: [
    {
      field: 'metadata.name',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 253,
      pattern: DNS_SUBDOMAIN_PATTERN,
      message: 'PVC name must be a valid DNS subdomain',
      severity: 'error',
    },
  ],
  specRules: [
    {
      field: 'spec.accessModes',
      required: true,
      type: 'array',
      message: 'PVC must define access modes',
      severity: 'error',
    },
    {
      field: 'spec.resources',
      required: true,
      type: 'object',
      message: 'PVC must define resource requirements',
      severity: 'error',
    },
  ],
};

// Ingress validation rules
export const ingressRules: ResourceRequirement = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'Ingress',
  requiredFields: ['apiVersion', 'kind', 'metadata', 'spec'],
  metadataRules: [
    {
      field: 'metadata.name',
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 253,
      pattern: DNS_SUBDOMAIN_PATTERN,
      message: 'Ingress name must be a valid DNS subdomain',
      severity: 'error',
    },
  ],
  specRules: [
    {
      field: 'spec.rules',
      type: 'array',
      message: 'Ingress should define routing rules',
      severity: 'warning',
    },
  ],
};

// Best practice checks
export interface BestPracticeCheck {
  id: string;
  name: string;
  description: string;
  check: (manifest: any) => boolean;
  severity: 'error' | 'warning' | 'info';
  recommendation: string;
}

export const bestPracticeChecks: BestPracticeCheck[] = [
  {
    id: 'bp-001',
    name: 'Resource Limits Defined',
    description: 'Containers should have resource limits defined',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      const containers = manifest.spec?.template?.spec?.containers || [];
      return containers.every((c: any) => c.resources?.limits);
    },
    severity: 'warning',
    recommendation: 'Define resource limits to prevent resource exhaustion',
  },
  {
    id: 'bp-002',
    name: 'Resource Requests Defined',
    description: 'Containers should have resource requests defined',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      const containers = manifest.spec?.template?.spec?.containers || [];
      return containers.every((c: any) => c.resources?.requests);
    },
    severity: 'warning',
    recommendation: 'Define resource requests for proper scheduling',
  },
  {
    id: 'bp-003',
    name: 'Liveness Probe Configured',
    description: 'Containers should have liveness probes',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      const containers = manifest.spec?.template?.spec?.containers || [];
      return containers.every((c: any) => c.livenessProbe);
    },
    severity: 'info',
    recommendation: 'Add liveness probes to detect and restart unhealthy containers',
  },
  {
    id: 'bp-004',
    name: 'Readiness Probe Configured',
    description: 'Containers should have readiness probes',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      const containers = manifest.spec?.template?.spec?.containers || [];
      return containers.every((c: any) => c.readinessProbe);
    },
    severity: 'info',
    recommendation: 'Add readiness probes to ensure traffic is sent only to ready pods',
  },
  {
    id: 'bp-005',
    name: 'Security Context Defined',
    description: 'Pods should have security context defined',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      return !!manifest.spec?.template?.spec?.securityContext;
    },
    severity: 'warning',
    recommendation: 'Define security context to follow security best practices',
  },
  {
    id: 'bp-006',
    name: 'Run As Non-Root',
    description: 'Containers should run as non-root user',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      const containers = manifest.spec?.template?.spec?.containers || [];
      return containers.every(
        (c: any) => c.securityContext?.runAsNonRoot === true
      );
    },
    severity: 'warning',
    recommendation: 'Configure containers to run as non-root for better security',
  },
  {
    id: 'bp-007',
    name: 'Image Tag Specified',
    description: 'Container images should have explicit tags (not :latest)',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      const containers = manifest.spec?.template?.spec?.containers || [];
      return containers.every((c: any) => {
        const image = c.image || '';
        return image.includes(':') && !image.endsWith(':latest');
      });
    },
    severity: 'warning',
    recommendation: 'Use explicit image tags instead of :latest for reproducibility',
  },
  {
    id: 'bp-008',
    name: 'Multiple Replicas',
    description: 'Production deployments should have multiple replicas',
    check: (manifest: any) => {
      if (manifest.kind !== 'Deployment') return true;
      const replicas = manifest.spec?.replicas || 1;
      return replicas >= 2;
    },
    severity: 'info',
    recommendation: 'Use at least 2 replicas for high availability',
  },
  {
    id: 'bp-009',
    name: 'Labels Defined',
    description: 'Resources should have meaningful labels',
    check: (manifest: any) => {
      const labels = manifest.metadata?.labels || {};
      return Object.keys(labels).length >= 2;
    },
    severity: 'info',
    recommendation: 'Add labels for better resource organization and selection',
  },
  {
    id: 'bp-010',
    name: 'Service Selector Matches Deployment',
    description: 'Service selector should match deployment labels',
    check: (manifest: any) => {
      // This check requires cross-resource validation
      // Will be implemented in the validator
      return true;
    },
    severity: 'error',
    recommendation: 'Ensure service selector matches deployment pod labels',
  },
];

// Resource name format validation
export const RESOURCE_NAME_RULES = {
  maxLength: 253,
  pattern: DNS_SUBDOMAIN_PATTERN,
  description: 'Must be a DNS-1123 subdomain (lowercase, alphanumeric, "-" or ".")',
};

// Get validation rules for a specific resource kind
export const getValidationRules = (kind: string): ResourceRequirement | null => {
  switch (kind) {
    case 'Deployment':
      return deploymentRules;
    case 'Service':
      return serviceRules;
    case 'ConfigMap':
      return configMapRules;
    case 'PersistentVolumeClaim':
      return pvcRules;
    case 'Ingress':
      return ingressRules;
    default:
      return null;
  }
};

// Validate resource references (ConfigMaps, Secrets, PVCs)
export interface ResourceReference {
  kind: 'ConfigMap' | 'Secret' | 'PersistentVolumeClaim';
  name: string;
  referencedBy: string; // Resource that references it
  field: string; // Field path where it's referenced
}

export const extractResourceReferences = (manifest: any): ResourceReference[] => {
  const references: ResourceReference[] = [];

  if (manifest.kind === 'Deployment') {
    const containers = manifest.spec?.template?.spec?.containers || [];
    const volumes = manifest.spec?.template?.spec?.volumes || [];

    // Check env vars from ConfigMaps
    containers.forEach((container: any, idx: number) => {
      container.env?.forEach((envVar: any, envIdx: number) => {
        if (envVar.valueFrom?.configMapKeyRef) {
          references.push({
            kind: 'ConfigMap',
            name: envVar.valueFrom.configMapKeyRef.name,
            referencedBy: `${manifest.metadata.name} (Deployment)`,
            field: `spec.template.spec.containers[${idx}].env[${envIdx}]`,
          });
        }
        if (envVar.valueFrom?.secretKeyRef) {
          references.push({
            kind: 'Secret',
            name: envVar.valueFrom.secretKeyRef.name,
            referencedBy: `${manifest.metadata.name} (Deployment)`,
            field: `spec.template.spec.containers[${idx}].env[${envIdx}]`,
          });
        }
      });

      // Check envFrom
      container.envFrom?.forEach((envFrom: any, envFromIdx: number) => {
        if (envFrom.configMapRef) {
          references.push({
            kind: 'ConfigMap',
            name: envFrom.configMapRef.name,
            referencedBy: `${manifest.metadata.name} (Deployment)`,
            field: `spec.template.spec.containers[${idx}].envFrom[${envFromIdx}]`,
          });
        }
        if (envFrom.secretRef) {
          references.push({
            kind: 'Secret',
            name: envFrom.secretRef.name,
            referencedBy: `${manifest.metadata.name} (Deployment)`,
            field: `spec.template.spec.containers[${idx}].envFrom[${envFromIdx}]`,
          });
        }
      });
    });

    // Check volumes
    volumes.forEach((volume: any, idx: number) => {
      if (volume.configMap) {
        references.push({
          kind: 'ConfigMap',
          name: volume.configMap.name,
          referencedBy: `${manifest.metadata.name} (Deployment)`,
          field: `spec.template.spec.volumes[${idx}]`,
        });
      }
      if (volume.secret) {
        references.push({
          kind: 'Secret',
          name: volume.secret.secretName,
          referencedBy: `${manifest.metadata.name} (Deployment)`,
          field: `spec.template.spec.volumes[${idx}]`,
        });
      }
      if (volume.persistentVolumeClaim) {
        references.push({
          kind: 'PersistentVolumeClaim',
          name: volume.persistentVolumeClaim.claimName,
          referencedBy: `${manifest.metadata.name} (Deployment)`,
          field: `spec.template.spec.volumes[${idx}]`,
        });
      }
    });
  }

  return references;
};
