/**
 * Manifest Validator
 *
 * Validates Kubernetes manifests client-side to simulate kubectl dry-run
 * Provides quality score, error detection, and improvement suggestions
 */

import yaml from 'js-yaml';
import {
  getValidationRules,
  validateResourceName,
  validateLabel,
  bestPracticeChecks,
  extractResourceReferences,
  type ValidationRule,
  type BestPracticeCheck,
  type ResourceReference,
} from './kubernetesRules';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  resource: string; // Resource name (e.g., "my-app-deployment")
  kind: string; // Resource kind (e.g., "Deployment")
  field?: string; // Field path (e.g., "spec.replicas")
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  suggestions: string[];
  summary: {
    totalResources: number;
    validResources: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

export interface ValidatedManifests {
  kubernetes?: ValidationResult;
  dockerStack?: ValidationResult;
  helm?: ValidationResult;
}

/**
 * Validate a single Kubernetes manifest
 */
export const validateKubernetesManifest = (manifest: any): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Check required top-level fields
  if (!manifest.apiVersion) {
    issues.push({
      severity: 'error',
      resource: manifest.metadata?.name || 'unknown',
      kind: manifest.kind || 'unknown',
      field: 'apiVersion',
      message: 'Missing required field: apiVersion',
    });
  }

  if (!manifest.kind) {
    issues.push({
      severity: 'error',
      resource: manifest.metadata?.name || 'unknown',
      kind: 'unknown',
      field: 'kind',
      message: 'Missing required field: kind',
    });
  }

  if (!manifest.metadata) {
    issues.push({
      severity: 'error',
      resource: manifest.metadata?.name || 'unknown',
      kind: manifest.kind || 'unknown',
      field: 'metadata',
      message: 'Missing required field: metadata',
    });
    return issues;
  }

  // Validate resource name
  const resourceName = manifest.metadata.name;
  if (!resourceName) {
    issues.push({
      severity: 'error',
      resource: 'unnamed',
      kind: manifest.kind || 'unknown',
      field: 'metadata.name',
      message: 'Missing required field: metadata.name',
    });
  } else {
    const nameValidation = validateResourceName(resourceName);
    if (!nameValidation.valid) {
      issues.push({
        severity: 'error',
        resource: resourceName,
        kind: manifest.kind || 'unknown',
        field: 'metadata.name',
        message: nameValidation.error || 'Invalid resource name',
      });
    }
  }

  // Validate namespace (if present)
  if (manifest.metadata.namespace) {
    const namespaceValidation = validateResourceName(manifest.metadata.namespace);
    if (!namespaceValidation.valid) {
      issues.push({
        severity: 'error',
        resource: resourceName || 'unknown',
        kind: manifest.kind || 'unknown',
        field: 'metadata.namespace',
        message: namespaceValidation.error || 'Invalid namespace',
      });
    }
  }

  // Validate labels
  const labels = manifest.metadata.labels || {};
  Object.entries(labels).forEach(([key, value]) => {
    const labelValidation = validateLabel(key, String(value));
    if (!labelValidation.valid) {
      issues.push({
        severity: 'error',
        resource: resourceName || 'unknown',
        kind: manifest.kind || 'unknown',
        field: `metadata.labels.${key}`,
        message: labelValidation.error || 'Invalid label',
      });
    }
  });

  // Get resource-specific validation rules
  const rules = getValidationRules(manifest.kind);
  if (rules) {
    // Validate required fields
    rules.requiredFields.forEach((field) => {
      const value = getNestedValue(manifest, field);
      if (value === undefined || value === null) {
        issues.push({
          severity: 'error',
          resource: resourceName || 'unknown',
          kind: manifest.kind,
          field,
          message: `Missing required field: ${field}`,
        });
      }
    });

    // Apply metadata rules
    rules.metadataRules?.forEach((rule) => {
      validateField(manifest, rule, issues);
    });

    // Apply spec rules
    rules.specRules?.forEach((rule) => {
      validateField(manifest, rule, issues);
    });
  }

  // Run best practice checks
  bestPracticeChecks.forEach((check) => {
    if (!check.check(manifest)) {
      issues.push({
        severity: check.severity,
        resource: resourceName || 'unknown',
        kind: manifest.kind || 'unknown',
        message: check.description,
        suggestion: check.recommendation,
      });
    }
  });

  return issues;
};

/**
 * Validate a field against a validation rule
 */
const validateField = (
  manifest: any,
  rule: ValidationRule,
  issues: ValidationIssue[]
): void => {
  const value = getNestedValue(manifest, rule.field);
  const resourceName = manifest.metadata?.name || 'unknown';
  const kind = manifest.kind || 'unknown';

  // Check if required
  if (rule.required && (value === undefined || value === null)) {
    issues.push({
      severity: rule.severity,
      resource: resourceName,
      kind,
      field: rule.field,
      message: rule.message,
    });
    return;
  }

  // Skip validation if field is not present and not required
  if (value === undefined || value === null) return;

  // Type validation
  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      issues.push({
        severity: rule.severity,
        resource: resourceName,
        kind,
        field: rule.field,
        message: `${rule.field} must be of type ${rule.type}, got ${actualType}`,
      });
      return;
    }
  }

  // String validations
  if (rule.type === 'string' && typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      issues.push({
        severity: rule.severity,
        resource: resourceName,
        kind,
        field: rule.field,
        message: `${rule.field} must be at least ${rule.minLength} characters`,
      });
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      issues.push({
        severity: rule.severity,
        resource: resourceName,
        kind,
        field: rule.field,
        message: `${rule.field} must be no more than ${rule.maxLength} characters`,
      });
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      issues.push({
        severity: rule.severity,
        resource: resourceName,
        kind,
        field: rule.field,
        message: rule.message,
      });
    }
  }

  // Number validations
  if (rule.type === 'number' && typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      issues.push({
        severity: rule.severity,
        resource: resourceName,
        kind,
        field: rule.field,
        message: `${rule.field} must be at least ${rule.min}`,
      });
    }

    if (rule.max !== undefined && value > rule.max) {
      issues.push({
        severity: rule.severity,
        resource: resourceName,
        kind,
        field: rule.field,
        message: `${rule.field} must be no more than ${rule.max}`,
      });
    }
  }
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Parse YAML string into manifests array
 */
const parseYamlManifests = (yamlString: string): any[] => {
  try {
    const docs = yaml.loadAll(yamlString);
    return docs.filter((doc) => doc && typeof doc === 'object');
  } catch (error) {
    throw new Error(`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validate all Kubernetes manifests from YAML string
 */
export const validateKubernetesManifests = (yamlString: string): ValidationResult => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  try {
    // Parse YAML
    const manifests = parseYamlManifests(yamlString);

    if (manifests.length === 0) {
      return {
        valid: false,
        score: 0,
        errors: [
          {
            severity: 'error',
            resource: 'N/A',
            kind: 'N/A',
            message: 'No valid manifests found in YAML',
          },
        ],
        warnings: [],
        info: [],
        suggestions: ['Ensure your YAML contains valid Kubernetes resource definitions'],
        summary: {
          totalResources: 0,
          validResources: 0,
          errorCount: 1,
          warningCount: 0,
          infoCount: 0,
        },
      };
    }

    // Validate each manifest
    manifests.forEach((manifest) => {
      const issues = validateKubernetesManifest(manifest);
      issues.forEach((issue) => {
        if (issue.severity === 'error') errors.push(issue);
        else if (issue.severity === 'warning') warnings.push(issue);
        else info.push(issue);
      });
    });

    // Check for missing resource references
    const allReferences: ResourceReference[] = [];
    const availableResources = new Map<string, Set<string>>();

    manifests.forEach((manifest) => {
      const kind = manifest.kind;
      const name = manifest.metadata?.name;
      if (kind && name) {
        if (!availableResources.has(kind)) {
          availableResources.set(kind, new Set());
        }
        availableResources.get(kind)!.add(name);
      }

      const refs = extractResourceReferences(manifest);
      allReferences.push(...refs);
    });

    // Check if referenced resources exist
    allReferences.forEach((ref) => {
      const available = availableResources.get(ref.kind);
      if (!available || !available.has(ref.name)) {
        warnings.push({
          severity: 'warning',
          resource: ref.referencedBy,
          kind: ref.kind,
          field: ref.field,
          message: `Referenced ${ref.kind} "${ref.name}" not found in manifests`,
          suggestion: `Create a ${ref.kind} resource named "${ref.name}" or ensure it exists in your cluster`,
        });
      }
    });

    // Calculate quality score
    const score = calculateQualityScore(manifests.length, errors.length, warnings.length, info.length);

    // Generate suggestions
    const suggestions = generateSuggestions(errors, warnings, info);

    return {
      valid: errors.length === 0,
      score,
      errors,
      warnings,
      info,
      suggestions,
      summary: {
        totalResources: manifests.length,
        validResources: manifests.length - errors.filter((e) => e.severity === 'error').length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: info.length,
      },
    };
  } catch (error) {
    return {
      valid: false,
      score: 0,
      errors: [
        {
          severity: 'error',
          resource: 'N/A',
          kind: 'N/A',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        },
      ],
      warnings: [],
      info: [],
      suggestions: ['Fix YAML syntax errors and try again'],
      summary: {
        totalResources: 0,
        validResources: 0,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
      },
    };
  }
};

/**
 * Calculate quality score (0-100)
 */
const calculateQualityScore = (
  totalResources: number,
  errorCount: number,
  warningCount: number,
  infoCount: number
): number => {
  if (totalResources === 0) return 0;

  // Start with perfect score
  let score = 100;

  // Deduct points for errors (critical)
  score -= errorCount * 15;

  // Deduct points for warnings (moderate)
  score -= warningCount * 5;

  // Deduct points for info issues (minor)
  score -= infoCount * 2;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
};

/**
 * Generate improvement suggestions
 */
const generateSuggestions = (
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  info: ValidationIssue[]
): string[] => {
  const suggestions: string[] = [];

  // Group issues by type
  const issuesByType = new Map<string, number>();
  [...errors, ...warnings, ...info].forEach((issue) => {
    const key = issue.message.split(':')[0]; // Get first part of message
    issuesByType.set(key, (issuesByType.get(key) || 0) + 1);
  });

  // Generate suggestions based on common issues
  if (errors.length > 0) {
    suggestions.push(`Fix ${errors.length} critical error${errors.length > 1 ? 's' : ''} before deploying`);
  }

  if (warnings.length > 5) {
    suggestions.push('Consider addressing warnings to improve production readiness');
  }

  if (info.length > 10) {
    suggestions.push('Review informational items to follow Kubernetes best practices');
  }

  // Specific suggestions
  const hasResourceLimitWarnings = [...warnings, ...info].some((i) =>
    i.message.toLowerCase().includes('resource')
  );
  if (hasResourceLimitWarnings) {
    suggestions.push('Define resource requests and limits for better cluster management');
  }

  const hasProbeWarnings = [...warnings, ...info].some(
    (i) => i.message.toLowerCase().includes('probe') || i.message.toLowerCase().includes('health')
  );
  if (hasProbeWarnings) {
    suggestions.push('Add health checks (liveness/readiness probes) for improved reliability');
  }

  const hasSecurityWarnings = [...warnings, ...info].some((i) =>
    i.message.toLowerCase().includes('security')
  );
  if (hasSecurityWarnings) {
    suggestions.push('Apply security best practices (non-root user, read-only filesystem)');
  }

  return suggestions;
};

/**
 * Validate Docker Stack configuration (Swarm)
 */
export const validateDockerStack = (yamlString: string): ValidationResult => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  try {
    const config = yaml.load(yamlString) as any;

    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        score: 0,
        errors: [
          {
            severity: 'error',
            resource: 'docker-stack.yml',
            kind: 'DockerCompose',
            message: 'Invalid Docker Compose YAML',
          },
        ],
        warnings: [],
        info: [],
        suggestions: ['Check YAML syntax'],
        summary: {
          totalResources: 0,
          validResources: 0,
          errorCount: 1,
          warningCount: 0,
          infoCount: 0,
        },
      };
    }

    // Check version
    if (!config.version) {
      warnings.push({
        severity: 'warning',
        resource: 'docker-stack.yml',
        kind: 'DockerCompose',
        field: 'version',
        message: 'Docker Compose version not specified',
        suggestion: 'Add version: "3.8" or higher',
      });
    }

    // Check services
    if (!config.services || Object.keys(config.services).length === 0) {
      errors.push({
        severity: 'error',
        resource: 'docker-stack.yml',
        kind: 'DockerCompose',
        field: 'services',
        message: 'No services defined',
      });
    } else {
      const serviceCount = Object.keys(config.services).length;

      // Validate each service
      Object.entries(config.services).forEach(([serviceName, service]: [string, any]) => {
        // Check image
        if (!service.image && !service.build) {
          errors.push({
            severity: 'error',
            resource: serviceName,
            kind: 'Service',
            field: 'image',
            message: 'Service must define either image or build',
          });
        }

        // Check deploy section for Swarm
        if (!service.deploy) {
          info.push({
            severity: 'info',
            resource: serviceName,
            kind: 'Service',
            field: 'deploy',
            message: 'No deploy configuration specified',
            suggestion: 'Add deploy section with replicas, resources, and restart_policy',
          });
        } else {
          // Check replicas
          if (service.deploy.replicas === undefined) {
            info.push({
              severity: 'info',
              resource: serviceName,
              kind: 'Service',
              field: 'deploy.replicas',
              message: 'Replicas not specified (defaults to 1)',
              suggestion: 'Specify replicas for production deployments',
            });
          }

          // Check resources
          if (!service.deploy.resources) {
            warnings.push({
              severity: 'warning',
              resource: serviceName,
              kind: 'Service',
              field: 'deploy.resources',
              message: 'No resource limits defined',
              suggestion: 'Define resource limits to prevent resource exhaustion',
            });
          }
        }

        // Check healthcheck
        if (!service.healthcheck) {
          info.push({
            severity: 'info',
            resource: serviceName,
            kind: 'Service',
            message: 'No healthcheck defined',
            suggestion: 'Add healthcheck for better reliability',
          });
        }
      });

      const score = calculateQualityScore(serviceCount, errors.length, warnings.length, info.length);
      const suggestions = generateSuggestions(errors, warnings, info);

      return {
        valid: errors.length === 0,
        score,
        errors,
        warnings,
        info,
        suggestions,
        summary: {
          totalResources: serviceCount,
          validResources: serviceCount - errors.length,
          errorCount: errors.length,
          warningCount: warnings.length,
          infoCount: info.length,
        },
      };
    }
  } catch (error) {
    return {
      valid: false,
      score: 0,
      errors: [
        {
          severity: 'error',
          resource: 'docker-stack.yml',
          kind: 'DockerCompose',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        },
      ],
      warnings: [],
      info: [],
      suggestions: ['Fix YAML syntax errors'],
      summary: {
        totalResources: 0,
        validResources: 0,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
      },
    };
  }

  return {
    valid: false,
    score: 0,
    errors,
    warnings,
    info,
    suggestions: [],
    summary: {
      totalResources: 0,
      validResources: 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: info.length,
    },
  };
};
