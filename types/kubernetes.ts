// Kubernetes Manifests Type Definitions

/**
 * Kubernetes Metadata
 */
export interface KubernetesMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * Kubernetes Container Definition
 */
export interface KubernetesContainer {
  name: string;
  image: string;
  ports?: Array<{
    containerPort: number;
    protocol?: 'TCP' | 'UDP';
    name?: string;
  }>;
  env?: Array<{
    name: string;
    value?: string;
    valueFrom?: {
      configMapKeyRef?: {
        name: string;
        key: string;
      };
      secretKeyRef?: {
        name: string;
        key: string;
      };
    };
  }>;
  volumeMounts?: Array<{
    name: string;
    mountPath: string;
    readOnly?: boolean;
  }>;
  resources?: {
    requests?: {
      cpu?: string;
      memory?: string;
    };
    limits?: {
      cpu?: string;
      memory?: string;
    };
  };
  livenessProbe?: KubernetesProbe;
  readinessProbe?: KubernetesProbe;
  command?: string[];
  args?: string[];
  workingDir?: string;
  securityContext?: {
    runAsUser?: number;
    runAsNonRoot?: boolean;
    readOnlyRootFilesystem?: boolean;
    allowPrivilegeEscalation?: boolean;
    capabilities?: {
      drop?: string[];
      add?: string[];
    };
  };
}

/**
 * Kubernetes Probe Definition
 */
export interface KubernetesProbe {
  httpGet?: {
    path: string;
    port: number | string;
    scheme?: 'HTTP' | 'HTTPS';
  };
  tcpSocket?: {
    port: number | string;
  };
  exec?: {
    command: string[];
  };
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

/**
 * Kubernetes Deployment
 */
export interface KubernetesDeployment {
  apiVersion: 'apps/v1';
  kind: 'Deployment';
  metadata: KubernetesMetadata;
  spec: {
    replicas: number;
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: {
        labels: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec: {
        containers: KubernetesContainer[];
        volumes?: Array<{
          name: string;
          persistentVolumeClaim?: {
            claimName: string;
          };
          configMap?: {
            name: string;
          };
          secret?: {
            secretName: string;
          };
          emptyDir?: Record<string, any>;
        }>;
        securityContext?: {
          fsGroup?: number;
          runAsNonRoot?: boolean;
          seccompProfile?: {
            type: string;
          };
        };
      };
    };
  };
}

/**
 * Kubernetes Service
 */
export interface KubernetesService {
  apiVersion: 'v1';
  kind: 'Service';
  metadata: KubernetesMetadata;
  spec: {
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
    selector: Record<string, string>;
    ports: Array<{
      name?: string;
      protocol?: 'TCP' | 'UDP';
      port: number;
      targetPort: number | string;
      nodePort?: number;
    }>;
    clusterIP?: string;
    externalIPs?: string[];
  };
}

/**
 * Kubernetes ConfigMap
 */
export interface KubernetesConfigMap {
  apiVersion: 'v1';
  kind: 'ConfigMap';
  metadata: KubernetesMetadata;
  data: Record<string, string>;
}

/**
 * Kubernetes Secret
 */
export interface KubernetesSecret {
  apiVersion: 'v1';
  kind: 'Secret';
  metadata: KubernetesMetadata;
  type: 'Opaque' | 'kubernetes.io/tls' | 'kubernetes.io/dockerconfigjson';
  data?: Record<string, string>; // Base64 encoded
  stringData?: Record<string, string>; // Plain text
}

/**
 * Kubernetes PersistentVolumeClaim
 */
export interface KubernetesPersistentVolumeClaim {
  apiVersion: 'v1';
  kind: 'PersistentVolumeClaim';
  metadata: KubernetesMetadata;
  spec: {
    accessModes: ('ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany')[];
    resources: {
      requests: {
        storage: string;
      };
    };
    storageClassName?: string;
    volumeMode?: 'Filesystem' | 'Block';
  };
}

/**
 * Kubernetes Ingress (networking.k8s.io/v1)
 */
export interface KubernetesIngress {
  apiVersion: 'networking.k8s.io/v1';
  kind: 'Ingress';
  metadata: KubernetesMetadata;
  spec: {
    ingressClassName?: string;
    rules: Array<{
      host?: string;
      http: {
        paths: Array<{
          path: string;
          pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
          backend: {
            service: {
              name: string;
              port: {
                number?: number;
                name?: string;
              };
            };
          };
        }>;
      };
    }>;
    tls?: Array<{
      hosts: string[];
      secretName: string;
    }>;
  };
}

/**
 * Complete Kubernetes Manifests Collection
 */
export interface KubernetesManifests {
  deployments: KubernetesDeployment[];
  services: KubernetesService[];
  configMaps?: KubernetesConfigMap[];
  secrets?: KubernetesSecret[];
  persistentVolumeClaims?: KubernetesPersistentVolumeClaim[];
  ingresses?: KubernetesIngress[];
}

/**
 * Kubernetes Conversion Result
 */
export interface KubernetesConversionResult {
  success: boolean;
  manifests?: KubernetesManifests;
  yaml?: Record<string, string>; // filename -> yaml content
  error?: string;
  warnings?: string[];
}
