# 🚀 Prompt de Développement MVP : DevOps Deployment Accelerator

## 📋 Introduction & Contexte

Salut ! Je suis ravi de travailler avec toi sur ce projet ambitieux. Nous allons construire ensemble **DevOps Deployment Accelerator**, une application web qui va révolutionner la façon dont les développeurs déploient leurs applications conteneurisées en production.

### 🎯 L'Objectif

Tu vas créer une web app Next.js qui transforme automatiquement des configurations Docker Compose de développement en configurations production-ready pour Kubernetes et Docker Swarm. L'application doit être **intuitive**, **rapide** et **sans backend** (tout en LocalStorage).

### 🎭 Qui sont nos utilisateurs ?

- Développeurs full-stack qui connaissent Docker mais pas Kubernetes
- Équipes DevOps de startups qui veulent accélérer leurs déploiements
- Freelances gérant plusieurs projets clients
- Consultants techniques cherchant à automatiser les meilleures pratiques

### 💡 Le Problème Résolu

Aujourd'hui, convertir un `docker-compose.yml` en manifests Kubernetes production-ready prend **plusieurs jours** et nécessite une expertise pointue. Notre app va réduire ça à **quelques minutes** tout en garantissant sécurité et scalabilité.

### 📦 Stack Technique Complète

```
Frontend: Next.js 16+ (App Router), TypeScript, Tailwind CSS 4
UI Components: shadcn/ui, Lucide React (icônes)
Parsing/Validation: js-yaml, Zod
Éditeurs de Code: Monaco Editor (ou CodeMirror)
Utilitaires: JSZip (archives), React Hook Form
Persistance: LocalStorage API
Hébergement: Vercel (gratuit)
```

---

## 🏗️ PHASE 1 : Foundation & Core Architecture (Semaine 1-2)

### 🎯 Objectif de cette phase

Mettre en place l'infrastructure Next.js complète et créer le moteur de conversion de base capable de parser Docker Compose et générer des manifests Kubernetes/Swarm fonctionnels.

### 📝 Instructions Détaillées

#### Étape 1.1 : Setup Initial du Projet (Jour 1) (DEJA FAIT une partie)

```bash
# Commandes à exécuter
npx create-next-app@latest ops.com --typescript --tailwind --app
cd ops.com
```

**Configuration `package.json` à installer :**

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^4.0.0",
    "js-yaml": "^4.1.0",
    "zod": "^3.22.0",
    "jszip": "^3.10.1",
    "lucide-react": "^0.300.0",
    "@monaco-editor/react": "^4.6.0",
    "react-hook-form": "^7.49.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/js-yaml": "^4.0.9",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

**Installer shadcn/ui :**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea tabs select dropdown-menu
```

**Structure de dossiers à créer :**

```
app/
├── layout.tsx (layout principal)
├── page.tsx (page d'accueil)
├── convert/
│   └── page.tsx (page de conversion)
├── projects/
│   └── page.tsx (liste des projets)
components/
├── ui/ (composants shadcn)
├── FileUpload.tsx
├── YamlEditor.tsx
├── ManifestPreview.tsx
└── ProjectList.tsx
lib/
├── parsers/
│   ├── dockerComposeParser.ts
│   └── validators.ts
├── converters/
│   ├── kubernetesConverter.ts
│   ├── dockerStackConverter.ts
│   └── proxyConfigs.ts
├── storage/
│   └── localStorage.ts
└── utils/
    ├── yamlUtils.ts
    └── exportUtils.ts
types/
├── dockerCompose.ts
├── kubernetes.ts
└── project.ts
```

#### Étape 1.2 : Créer les Types TypeScript (Jour 1)

**Fichier `types/dockerCompose.ts` :**

```typescript
export interface DockerComposeService {
  image?: string;
  build?: string | { context: string; dockerfile?: string };
  ports?: string[];
  environment?: Record<string, string> | string[];
  volumes?: string[];
  depends_on?: string[];
  networks?: string[];
  command?: string | string[];
  entrypoint?: string | string[];
  healthcheck?: {
    test: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
  };
  deploy?: {
    replicas?: number;
    resources?: {
      limits?: { cpus?: string; memory?: string };
      reservations?: { cpus?: string; memory?: string };
    };
  };
}

export interface DockerCompose {
  version: string;
  services: Record<string, DockerComposeService>;
  networks?: Record<string, any>;
  volumes?: Record<string, any>;
}
```

**Fichier `types/kubernetes.ts` :**

```typescript
export interface KubernetesDeployment {
  apiVersion: string;
  kind: 'Deployment';
  metadata: {
    name: string;
    labels: Record<string, string>;
  };
  spec: {
    replicas: number;
    selector: { matchLabels: Record<string, string> };
    template: {
      metadata: { labels: Record<string, string> };
      spec: {
        containers: Array<{
          name: string;
          image: string;
          ports?: Array<{ containerPort: number }>;
          env?: Array<{ name: string; value: string }>;
          resources?: {
            requests?: { cpu: string; memory: string };
            limits?: { cpu: string; memory: string };
          };
          livenessProbe?: any;
          readinessProbe?: any;
        }>;
      };
    };
  };
}

export interface KubernetesService {
  apiVersion: string;
  kind: 'Service';
  metadata: { name: string };
  spec: {
    selector: Record<string, string>;
    ports: Array<{ port: number; targetPort: number; protocol?: string }>;
    type: 'ClusterIP' | 'LoadBalancer' | 'NodePort';
  };
}

export interface KubernetesManifests {
  deployments: KubernetesDeployment[];
  services: KubernetesService[];
  configMaps?: any[];
  pvcs?: any[];
}
```

**Fichier `types/project.ts` :**

```typescript
export interface Project {
  id: string;
  name: string;
  dockerCompose: string;
  createdAt: string;
  updatedAt: string;
  targetPlatform: 'kubernetes' | 'swarm' | 'both';
  proxyType?: 'traefik' | 'nginx' | 'caddy' | 'none';
}
```

#### Étape 1.3 : Parser Docker Compose (Jour 2-3)

**Fichier `lib/parsers/dockerComposeParser.ts` :**

```typescript
import yaml from 'js-yaml';
import { DockerCompose } from '@/types/dockerCompose';
import { z } from 'zod';

// Schéma Zod pour validation
const DockerComposeSchema = z.object({
  version: z.string(),
  services: z.record(z.object({
    image: z.string().optional(),
    build: z.union([z.string(), z.object({
      context: z.string(),
      dockerfile: z.string().optional()
    })]).optional(),
    ports: z.array(z.string()).optional(),
    environment: z.union([
      z.record(z.string()),
      z.array(z.string())
    ]).optional(),
    volumes: z.array(z.string()).optional(),
    depends_on: z.array(z.string()).optional(),
    networks: z.array(z.string()).optional(),
    command: z.union([z.string(), z.array(z.string())]).optional(),
    healthcheck: z.object({
      test: z.union([z.string(), z.array(z.string())]),
      interval: z.string().optional(),
      timeout: z.string().optional(),
      retries: z.number().optional()
    }).optional(),
    deploy: z.object({
      replicas: z.number().optional(),
      resources: z.object({
        limits: z.object({
          cpus: z.string().optional(),
          memory: z.string().optional()
        }).optional(),
        reservations: z.object({
          cpus: z.string().optional(),
          memory: z.string().optional()
        }).optional()
      }).optional()
    }).optional()
  })),
  networks: z.record(z.any()).optional(),
  volumes: z.record(z.any()).optional()
});

export class DockerComposeParser {
  /**
   * Parse un fichier docker-compose.yml en objet typé
   */
  static parse(yamlContent: string): { 
    success: boolean; 
    data?: DockerCompose; 
    error?: string;
    warnings?: string[];
  } {
    try {
      // Parser YAML
      const parsed = yaml.load(yamlContent) as any;
      
      // Valider avec Zod
      const validated = DockerComposeSchema.parse(parsed);
      
      // Vérifications supplémentaires et warnings
      const warnings: string[] = [];
      
      // Vérifier que chaque service a une image ou un build
      Object.entries(validated.services).forEach(([name, service]) => {
        if (!service.image && !service.build) {
          warnings.push(`Service "${name}" n'a ni image ni build défini`);
        }
        
        // Vérifier les ports
        if (service.ports && service.ports.length === 0) {
          warnings.push(`Service "${name}" a un tableau ports vide`);
        }
      });
      
      return { 
        success: true, 
        data: validated as DockerCompose,
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation échouée: ${error.errors.map(e => 
            `${e.path.join('.')}: ${e.message}`
          ).join(', ')}`
        };
      }
      
      return {
        success: false,
        error: `Erreur de parsing YAML: ${error.message}`
      };
    }
  }
  
  /**
   * Extrait les métadonnées du compose
   */
  static extractMetadata(compose: DockerCompose): {
    serviceCount: number;
    services: string[];
    hasNetworks: boolean;
    hasVolumes: boolean;
    exposedPorts: number[];
  } {
    const services = Object.keys(compose.services);
    const exposedPorts: number[] = [];
    
    services.forEach(serviceName => {
      const service = compose.services[serviceName];
      if (service.ports) {
        service.ports.forEach(portMapping => {
          const port = portMapping.split(':')[0];
          exposedPorts.push(parseInt(port, 10));
        });
      }
    });
    
    return {
      serviceCount: services.length,
      services,
      hasNetworks: !!compose.networks && Object.keys(compose.networks).length > 0,
      hasVolumes: !!compose.volumes && Object.keys(compose.volumes).length > 0,
      exposedPorts: [...new Set(exposedPorts)]
    };
  }
}
```

#### Étape 1.4 : Convertisseur Kubernetes (Jour 4-6)

**Fichier `lib/converters/kubernetesConverter.ts` :**

```typescript
import { DockerCompose, DockerComposeService } from '@/types/dockerCompose';
import { KubernetesDeployment, KubernetesService, KubernetesManifests } from '@/types/kubernetes';
import yaml from 'js-yaml';

export class KubernetesConverter {
  
  /**
   * Convertit un Docker Compose complet en manifests Kubernetes
   */
  static convert(compose: DockerCompose, options?: {
    namespace?: string;
    addHealthChecks?: boolean;
    addResourceLimits?: boolean;
  }): KubernetesManifests {
    const namespace = options?.namespace || 'default';
    const deployments: KubernetesDeployment[] = [];
    const services: KubernetesService[] = [];
    
    // Convertir chaque service
    Object.entries(compose.services).forEach(([serviceName, service]) => {
      // Créer le Deployment
      const deployment = this.createDeployment(
        serviceName, 
        service, 
        namespace,
        options
      );
      deployments.push(deployment);
      
      // Créer le Service si des ports sont exposés
      if (service.ports && service.ports.length > 0) {
        const k8sService = this.createService(serviceName, service, namespace);
        services.push(k8sService);
      }
    });
    
    return { deployments, services };
  }
  
  /**
   * Crée un Deployment Kubernetes
   */
  private static createDeployment(
    name: string,
    service: DockerComposeService,
    namespace: string,
    options?: any
  ): KubernetesDeployment {
    const labels = { app: name };
    const replicas = service.deploy?.replicas || 3;
    
    // Extraire l'image
    const image = service.image || `${name}:latest`;
    
    // Convertir les ports
    const ports = service.ports?.map(portMapping => {
      const [hostPort, containerPort] = portMapping.split(':');
      return { containerPort: parseInt(containerPort || hostPort, 10) };
    }) || [];
    
    // Convertir les variables d'environnement
    const env = this.convertEnvironment(service.environment);
    
    // Resources
    const resources = options?.addResourceLimits ? {
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '500m', memory: '512Mi' }
    } : undefined;
    
    // Health checks
    const livenessProbe = options?.addHealthChecks ? 
      this.createHealthCheck(service, ports[0]?.containerPort) : undefined;
    const readinessProbe = livenessProbe;
    
    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name, labels },
      spec: {
        replicas,
        selector: { matchLabels: labels },
        template: {
          metadata: { labels },
          spec: {
            containers: [{
              name,
              image,
              ports: ports.length > 0 ? ports : undefined,
              env: env.length > 0 ? env : undefined,
              resources,
              livenessProbe,
              readinessProbe
            }]
          }
        }
      }
    };
  }
  
  /**
   * Crée un Service Kubernetes
   */
  private static createService(
    name: string,
    service: DockerComposeService,
    namespace: string
  ): KubernetesService {
    const ports = service.ports?.map(portMapping => {
      const [hostPort, containerPort] = portMapping.split(':');
      const port = parseInt(hostPort, 10);
      const targetPort = parseInt(containerPort || hostPort, 10);
      return { port, targetPort, protocol: 'TCP' };
    }) || [];
    
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name },
      spec: {
        selector: { app: name },
        ports,
        type: 'ClusterIP'
      }
    };
  }
  
  /**
   * Convertit les variables d'environnement
   */
  private static convertEnvironment(
    env?: Record<string, string> | string[]
  ): Array<{ name: string; value: string }> {
    if (!env) return [];
    
    if (Array.isArray(env)) {
      return env.map(e => {
        const [name, value] = e.split('=');
        return { name, value };
      });
    }
    
    return Object.entries(env).map(([name, value]) => ({ name, value }));
  }
  
  /**
   * Crée un health check
   */
  private static createHealthCheck(
    service: DockerComposeService,
    port?: number
  ) {
    if (service.healthcheck) {
      // Utiliser le healthcheck existant
      return {
        httpGet: {
          path: '/health',
          port: port || 8080
        },
        initialDelaySeconds: 30,
        periodSeconds: 10
      };
    }
    
    // Health check par défaut
    if (port) {
      return {
        httpGet: {
          path: '/health',
          port
        },
        initialDelaySeconds: 30,
        periodSeconds: 10,
        timeoutSeconds: 5,
        failureThreshold: 3
      };
    }
    
    return undefined;
  }
  
  /**
   * Exporte les manifests en YAML
   */
  static exportToYaml(manifests: KubernetesManifests): Record<string, string> {
    const files: Record<string, string> = {};
    
    // Exporter les Deployments
    manifests.deployments.forEach(deployment => {
      const filename = `${deployment.metadata.name}-deployment.yaml`;
      files[filename] = yaml.dump(deployment);
    });
    
    // Exporter les Services
    manifests.services.forEach(service => {
      const filename = `${service.metadata.name}-service.yaml`;
      files[filename] = yaml.dump(service);
    });
    
    return files;
  }
}
```

#### Étape 1.5 : Convertisseur Docker Stack (Jour 7-8)

**Fichier `lib/converters/dockerStackConverter.ts` :**

```typescript
import { DockerCompose } from '@/types/dockerCompose';
import yaml from 'js-yaml';

export class DockerStackConverter {
  
  /**
   * Convertit Docker Compose en Docker Stack (Swarm)
   */
  static convert(compose: DockerCompose, options?: {
    addHealthChecks?: boolean;
    defaultReplicas?: number;
  }): string {
    const stack = JSON.parse(JSON.stringify(compose)); // Deep clone
    
    // Modifier chaque service pour Swarm
    Object.entries(stack.services).forEach(([name, service]: [string, any]) => {
      // Ajouter la section deploy si elle n'existe pas
      if (!service.deploy) {
        service.deploy = {};
      }
      
      // Définir les replicas
      if (!service.deploy.replicas) {
        service.deploy.replicas = options?.defaultReplicas || 3;
      }
      
      // Ajouter les contraintes de placement
      service.deploy.placement = {
        constraints: ['node.role == worker']
      };
      
      // Ajouter la politique de restart
      service.deploy.restart_policy = {
        condition: 'on-failure',
        delay: '5s',
        max_attempts: 3,
        window: '120s'
      };
      
      // Ajouter les resource limits si pas déjà présents
      if (!service.deploy.resources) {
        service.deploy.resources = {
          limits: {
            cpus: '0.5',
            memory: '512M'
          },
          reservations: {
            cpus: '0.1',
            memory: '128M'
          }
        };
      }
      
      // Ajouter health checks
      if (options?.addHealthChecks && !service.healthcheck) {
        service.healthcheck = {
          test: ['CMD', 'curl', '-f', 'http://localhost/health'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          start_period: '40s'
        };
      }
    });
    
    // Configurer les networks pour Swarm
    if (stack.networks) {
      Object.keys(stack.networks).forEach(networkName => {
        stack.networks[networkName] = {
          driver: 'overlay',
          attachable: true
        };
      });
    } else {
      stack.networks = {
        default: {
          driver: 'overlay',
          attachable: true
        }
      };
    }
    
    return yaml.dump(stack);
  }
}
```

#### Étape 1.6 : LocalStorage Manager (Jour 9)

**Fichier `lib/storage/localStorage.ts` :**

```typescript
import { Project } from '@/types/project';

const STORAGE_KEY = 'devops-accelerator-projects';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

export class LocalStorageManager {
  
  /**
   * Sauvegarde un projet
   */
  static saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const projects = this.getAllProjects();
    
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    projects.push(newProject);
    this.setProjects(projects);
    
    return newProject;
  }
  
  /**
   * Met à jour un projet existant
   */
  static updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.setProjects(projects);
    return projects[index];
  }
  
  /**
   * Récupère tous les projets
   */
  static getAllProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lecture LocalStorage:', error);
      return [];
    }
  }
  
  /**
   * Récupère un projet par ID
   */
  static getProject(id: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }
  
  /**
   * Supprime un projet
   */
  static deleteProject(id: string): boolean {
    const projects = this.getAllProjects();
    const filtered = projects.filter(p => p.id !== id);
    
    if (filtered.length === projects.length) return false;
    
    this.setProjects(filtered);
    return true;
  }
  
  /**
   * Vérifie l'espace disponible
   */
  static checkStorageSpace(): { used: number; available: number; percentage: number } {
    const projects = this.getAllProjects();
    const used = new Blob([JSON.stringify(projects)]).size;
    const available = MAX_STORAGE_SIZE - used;
    const percentage = (used / MAX_STORAGE_SIZE) * 100;
    
    return { used, available, percentage };
  }
  
  /**
   * Sauvegarde les projets
   */
  private static setProjects(projects: Project[]): void {
    try {
      const data = JSON.stringify(projects);
      const size = new Blob([data]).size;
      
      if (size > MAX_STORAGE_SIZE) {
        throw new Error('Limite de stockage dépassée');
      }
      
      localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
      console.error('Erreur sauvegarde LocalStorage:', error);
      throw error;
    }
  }
  
  /**
   * Génère un ID unique
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### ✅ User Stories Couvertes dans cette Phase

- **US-001** : Parser et valider Docker Compose ✅
- **US-002** : Conversion vers Kubernetes ✅
- **US-003** : Conversion vers Docker Stack ✅
- **US-009** : Sauvegarde dans LocalStorage ✅

### 🎯 Checklist de Validation Phase 1

Avant de passer à la Phase 2, vérifie que :

- [ ] Le projet Next.js démarre sans erreur (`npm run dev`)
- [ ] Tous les types TypeScript sont correctement définis sans erreurs
- [ ] Le parser Docker Compose peut parser un fichier YAML valide
- [ ] Le parser retourne des erreurs claires pour un YAML invalide
- [ ] La conversion Kubernetes génère des Deployments et Services valides
- [ ] La conversion Docker Stack génère un fichier compatible Swarm
- [ ] Le LocalStorage peut sauvegarder et récupérer des projets
- [ ] Le LocalStorage gère correctement la limite de 5MB
- [ ] Les tests manuels avec différents docker-compose.yml fonctionnent
- [ ] Le code est bien commenté et suit les conventions TypeScript

### 🧪 Tests à Effectuer

Crée un fichier `test-docker-compose.yml` pour tester :

```yaml
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
  
  api:
    image: node:18-alpine
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://localhost:5432/mydb
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

Teste que :
1. Le parser l'accepte sans erreur
2. La conversion Kubernetes génère 3 Deployments et 2 Services
3. La conversion Swarm ajoute les sections `deploy` correctement
4. Le projet peut être sauvegardé et rechargé depuis LocalStorage

---

## 🔧 PHASE 2 : Reverse Proxy & Production Hardening (Semaine 3)

### 🎯 Objectif de cette phase

Ajouter la génération automatique de configurations pour reverse proxies (Traefik, Nginx, Caddy) et implémenter les meilleures pratiques de production (health checks, resource limits, sécurité).

### 📝 Instructions Détaillées

#### Étape 2.1 : Générateur Traefik (Jour 1-2)

**Fichier `lib/converters/proxyConfigs/traefikGenerator.ts` :**

```typescript
import { DockerCompose } from '@/types/dockerCompose';
import yaml from 'js-yaml';

export class TraefikGenerator {
  
  /**
   * Génère la configuration Traefik pour Docker Compose
   */
  static generateDockerLabels(
    serviceName: string,
    domain: string,
    port: number,
    enableSSL: boolean = true
  ): Record<string, string> {
    const labels: Record<string, string> = {
      'traefik.enable': 'true',
      [`traefik.http.routers.${serviceName}.rule`]: `Host(\`${domain}\`)`,
      [`traefik.http.routers.${serviceName}.entrypoints`]: enableSSL ? 'websecure' : 'web',
      [`traefik.http.services.${serviceName}.loadbalancer.server.port`]: port.toString(),
    };
    
    if (enableSSL) {
      labels[`traefik.http.routers.${serviceName}.tls`] = 'true';
      labels[`traefik.http.routers.${serviceName}.tls.certresolver`] = 'letsencrypt';
    }
    
    return labels;
  }
  
  /**
   * Génère un IngressRoute Kubernetes pour Traefik
   */
  static generateKubernetesIngressRoute(
    serviceName: string,
    domain: string,
    port: number,
    namespace: string = 'default'
  ) {
    return {
      apiVersion: 'traefik.containo.us/v1alpha1',
      kind: 'IngressRoute',
      metadata: {
        name: `${serviceName}-ingress`,
        namespace
      },
      spec: {
        entryPoints: ['websecure'],
        routes: [{
          match: `Host(\`${domain}\`)`,
          kind: 'Rule',
          services: [{
            name: serviceName,
            port
          }]
        }],
        tls: {
          certResolver: 'letsencrypt'
        }
      }
    };
  }
  
  /**
   * Génère le fichier de configuration statique Traefik
   */
  static generateStaticConfig(email: string): string {
    const config = {
      api: {
        dashboard: true,
        insecure: true
      },
      entryPoints: {
        web: {
          address: ':80',
          http: {
            redirections: {
              entryPoint: {
                to: 'websecure',
                scheme: 'https'
              }
            }
          }
        },
        websecure: {
          address: ':443'
        }
      },
      certificatesResolvers: {
        letsencrypt: {
          acme: {
            email,
            storage: '/letsencrypt/acme.json',
            httpChallenge: {
              entryPoint: 'web'
            }
          }
        }
      },
      providers: {
        docker: {
          exposedByDefault: false
        },
        kubernetesCRD: {}
      }
    };
    
    return yaml.dump(config);
  }
  
  /**
   * Ajoute Traefik à un Docker Compose existant
   */
  static addToDockerCompose(
    compose: DockerCompose,
    email: string,
    domains: Record<string, string>
  ): DockerCompose {
    const enhanced = JSON.parse(JSON.stringify(compose));
    
    // Ajouter le service Traefik
    enhanced.services.traefik = {
      image: 'traefik:v2.10',
      command: [
        '--api.dashboard=true',
        '--providers.docker=true',
        '--providers.docker.exposedbydefault=false',
        '--entrypoints.web.address=:80',
        '--entrypoints.websecure.address=:443',
        `--certificatesresolvers.letsencrypt.acme.email=${email}`,
        '--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json',
        '--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web'
      ],
      ports: ['80:80', '443:443', '8080:8080'],
      volumes: [
        '/var/run/docker.sock:/var/run/docker.sock:ro',
        './letsencrypt:/letsencrypt'
      ]
    };
    
    // Ajouter les labels Traefik aux services existants
    Object.entries(domains).forEach(([serviceName, domain]) => {
      if (enhanced.services[serviceName]) {
        const service = enhanced.services[serviceName];
        const port = service.ports?.[0]?.split(':')[1] || '80';
        
        const labels = this.generateDockerLabels(
          serviceName,
          domain,
          parseInt(port, 10)
        );
        
        enhanced.services[serviceName].labels = {
          ...service.labels,
          ...labels
        };
      }
    });
    
    return enhanced;
  }
}
```

#### Étape 2.2 : Générateur Nginx (Jour 3)

**Fichier `lib/converters/proxyConfigs/nginxGenerator.ts` :**

```typescript
export class NginxGenerator {
  
  /**
   * Génère une configuration Nginx pour un service
   */
  static generateConfig(
    serviceName: string,
    domain: string,
    port: number,
    enableSSL: boolean = true
  ): string {
    let config = `
upstream ${serviceName}_backend {
    server ${serviceName}:${port};
}

server {
    listen 80;
    server_name ${domain};
    
    ${enableSSL ? `
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
    ` : `
    location / {
        proxy_pass http://${serviceName}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    `}
}
`;
    
    if (enableSSL) {
      config += `
server {
    listen 443 ssl http2;
    server_name ${domain};
    
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://${serviceName}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
`;
    }
    
    return config;
  }
  
  /**
   * Génère un ConfigMap Kubernetes pour Nginx
   */
  static generateKubernetesConfigMap(
    serviceName: string,
    domain: string,
    port: number,
    namespace: string = 'default'
  ) {
    const config = this.generateConfig(serviceName, domain, port, false);
    
    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${serviceName}-nginx-config`,
        namespace
      },
      data: {
        'nginx.conf': config
      }
    };
  }
}
```

#### Étape 2.3 : Générateur Caddy (Jour 4)

**Fichier `lib/converters/proxyConfigs/caddyGenerator.ts` :**

```typescript
export class CaddyGenerator {
  
  /**
   * Génère un Caddyfile pour un service
   */
  static generateCaddyfile(
    serviceName: string,
    domain: string,
    port: number,
    email: string
  ): string {
    return `
${domain} {
    reverse_proxy ${serviceName}:${port}
    
    encode gzip
    
    tls ${email}
    
    header {
        # Security headers
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
    }
    
    log {
        output file /var/log/caddy/${serviceName}.log
        format json
    }
}
`;
  }
  
  /**
   * Génère un Caddyfile global pour plusieurs services
   */
  static generateGlobalCaddyfile(
    services: Array<{ name: string; domain: string; port: number }>,
    email: string
  ): string {
    return services.map(s => 
      this.generateCaddyfile(s.name, s.domain, s.port, email)
    ).join('\n');
  }
}
```

#### Étape 2.4 : Production Hardening - Health Checks & Resources (Jour 5-6)

**Fichier `lib/converters/productionHardening.ts` :**

```typescript
import { KubernetesDeployment } from '@/types/kubernetes';
import { DockerCompose } from '@/types/dockerCompose';

export class ProductionHardening {
  
  /**
   * Ajoute des health checks intelligents
   */
  static addHealthChecks(
    deployment: KubernetesDeployment,
    port?: number
  ): KubernetesDeployment {
    const enhanced = JSON.parse(JSON.stringify(deployment));
    
    const container = enhanced.spec.template.spec.containers[0];
    const healthPort = port || container.ports?.[0]?.containerPort || 8080;
    
    // Liveness Probe
    container.livenessProbe = {
      httpGet: {
        path: '/health',
        port: healthPort
      },
      initialDelaySeconds: 30,
      periodSeconds: 10,
      timeoutSeconds: 5,
      failureThreshold: 3,
      successThreshold: 1
    };
    
    // Readiness Probe
    container.readinessProbe = {
      httpGet: {
        path: '/ready',
        port: healthPort
      },
      initialDelaySeconds: 10,
      periodSeconds: 5,
      timeoutSeconds: 3,
      failureThreshold: 3,
      successThreshold: 1
    };
    
    return enhanced;
  }
  
  /**
   * Ajoute des resource limits intelligents
   */
  static addResourceLimits(
    deployment: KubernetesDeployment,
    profile: 'small' | 'medium' | 'large' = 'medium'
  ): KubernetesDeployment {
    const enhanced = JSON.parse(JSON.stringify(deployment));
    
    const profiles = {
      small: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '500m', memory: '512Mi' }
      },
      medium: {
        requests: { cpu: '250m', memory: '256Mi' },
        limits: { cpu: '1000m', memory: '1Gi' }
      },
      large: {
        requests: { cpu: '500m', memory: '512Mi' },
        limits: { cpu: '2000m', memory: '2Gi' }
      }
    };
    
    enhanced.spec.template.spec.containers[0].resources = profiles[profile];
    
    return enhanced;
  }
  
  /**
   * Ajoute des bonnes pratiques de sécurité
   */
  static addSecurityBestPractices(
    deployment: KubernetesDeployment
  ): KubernetesDeployment {
    const enhanced = JSON.parse(JSON.stringify(deployment));
    
    const container = enhanced.spec.template.spec.containers[0];
    
    // Security Context
    container.securityContext = {
      runAsNonRoot: true,
      runAsUser: 1000,
      readOnlyRootFilesystem: true,
      allowPrivilegeEscalation: false,
      capabilities: {
        drop: ['ALL']
      }
    };
    
    // Pod Security Context
    enhanced.spec.template.spec.securityContext = {
      fsGroup: 1000,
      runAsNonRoot: true,
      seccompProfile: {
        type: 'RuntimeDefault'
      }
    };
    
    return enhanced;
  }
  
  /**
   * Applique toutes les optimisations production
   */
  static applyAllOptimizations(
    deployment: KubernetesDeployment,
    options?: {
      healthCheckPort?: number;
      resourceProfile?: 'small' | 'medium' | 'large';
      enableSecurity?: boolean;
    }
  ): KubernetesDeployment {
    let enhanced = deployment;
    
    enhanced = this.addHealthChecks(enhanced, options?.healthCheckPort);
    enhanced = this.addResourceLimits(enhanced, options?.resourceProfile);
    
    if (options?.enableSecurity !== false) {
      enhanced = this.addSecurityBestPractices(enhanced);
    }
    
    return enhanced;
  }
}
```

### ✅ User Stories Couvertes dans cette Phase

- **US-004** : Configuration Traefik automatique ✅
- **US-005** : Health checks automatiques ✅
- **US-006** : Resource limits automatiques ✅
- **US-011** : Choix entre Traefik/Nginx/Caddy ✅

### 🎯 Checklist de Validation Phase 2

- [ ] Le générateur Traefik crée des labels Docker valides
- [ ] Le générateur Traefik crée des IngressRoute Kubernetes valides
- [ ] Le générateur Nginx crée des configurations syntaxiquement correctes
- [ ] Le générateur Caddy crée des Caddyfile valides
- [ ] Les health checks sont ajoutés avec des paramètres sensés
- [ ] Les resource limits sont définis selon le profil choisi
- [ ] Les best practices de sécurité sont appliquées correctement
- [ ] Les configurations proxy incluent le SSL/TLS
- [ ] Les configurations sont testables manuellement

---

## 🎨 PHASE 3 : Interface Utilisateur & Export (Semaine 4)

### 🎯 Objectif de cette phase

Créer l'interface web complète avec upload de fichiers, éditeur YAML, prévisualisation des manifests, et système d'export en ZIP avec documentation.

### 📝 Instructions Détaillées

#### Étape 3.1 : Page d'Accueil & Layout (Jour 1)

**Fichier `app/layout.tsx` :**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevOps Deployment Accelerator',
  description: 'Transformez vos Docker Compose en configurations production-ready',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <h1 className="text-xl font-bold">DevOps Accelerator</h1>
            </div>
            <div className="flex gap-4">
              <a href="/" className="hover:underline">Accueil</a>
              <a href="/convert" className="hover:underline">Convertir</a>
              <a href="/projects" className="hover:underline">Projets</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
```

**Fichier `app/page.tsx` :**

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-5xl font-bold">
          Déployez en Production en <span className="text-blue-600">Minutes</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transformez vos Docker Compose de développement en configurations Kubernetes 
          et Docker Swarm production-ready, automatiquement.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/convert">
            <Button size="lg">Commencer Maintenant</Button>
          </Link>
          <Link href="/projects">
            <Button size="lg" variant="outline">Voir mes Projets</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>⚡ Conversion Automatique</CardTitle>
            <CardDescription>
              Docker Compose → Kubernetes et Docker Swarm en un clic
            </CardDescription>
          </CardHeader>
          <CardContent>
            Génération automatique de Deployments, Services, ConfigMaps et toutes 
            les ressources nécessaires.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔒 Production-Ready</CardTitle>
            <CardDescription>
              Health checks, resource limits et sécurité intégrés
            </CardDescription>
          </CardHeader>
          <CardContent>
            Toutes les meilleures pratiques appliquées automatiquement : probes, 
            security context, resource management.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🌐 Reverse Proxy</CardTitle>
            <CardDescription>
              Traefik, Nginx ou Caddy configurés automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            SSL/TLS, routing, load balancing configurés pour vous avec Let's Encrypt.
          </CardContent>
        </Card>
      </section>

      {/* How it Works */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Upload', desc: 'Uploadez votre docker-compose.yml' },
            { step: '2', title: 'Configure', desc: 'Choisissez vos options (proxy, sécurité)' },
            { step: '3', title: 'Preview', desc: 'Prévisualisez les manifests générés' },
            { step: '4', title: 'Export', desc: 'Téléchargez le ZIP avec tout' }
          ].map(item => (
            <Card key={item.step}>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-2">
                  {item.step}
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
```

#### Étape 3.2 : Composant Upload de Fichiers (Jour 2)

**Fichier `components/FileUpload.tsx` :**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  onFileUpload: (content: string, filename: string) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
      alert('Veuillez uploader un fichier .yml ou .yaml');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFile(file.name);
      onFileUpload(content, file.name);
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
  };

  return (
    <Card className="p-8">
      {!uploadedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors
            ${isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">
            Glissez-déposez votre docker-compose.yml
          </h3>
          <p className="text-muted-foreground mb-4">
            ou cliquez pour sélectionner un fichier
          </p>
          <input
            type="file"
            accept=".yml,.yaml"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild>
              <span>Choisir un fichier</span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold">{uploadedFile}</p>
              <p className="text-sm text-muted-foreground">Fichier chargé avec succès</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearFile}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
```

#### Étape 3.3 : Éditeur YAML avec Monaco (Jour 3)

**Fichier `components/YamlEditor.tsx` :**

```typescript
'use client';

import { Editor } from '@monaco-editor/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface YamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  title?: string;
  language?: string;
}

export function YamlEditor({ 
  value, 
  onChange, 
  readOnly = false,
  title = 'Éditeur YAML',
  language = 'yaml'
}: YamlEditorProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: 'Copié !',
      description: 'Le contenu a été copié dans le presse-papier',
    });
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copier
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Editor
            height="500px"
            language={language}
            value={value}
            onChange={(value) => onChange?.(value || '')}
            theme="vs-dark"
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Étape 3.4 : Prévisualisation des Manifests (Jour 4)

**Fichier `components/ManifestPreview.tsx` :**

```typescript
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YamlEditor } from './YamlEditor';
import { Badge } from '@/components/ui/badge';

interface ManifestPreviewProps {
  kubernetesManifests?: Record<string, string>;
  dockerStackManifest?: string;
  proxyConfig?: string;
  proxyType?: string;
}

export function ManifestPreview({ 
  kubernetesManifests,
  dockerStackManifest,
  proxyConfig,
  proxyType
}: ManifestPreviewProps) {
  
  const hasKubernetes = kubernetesManifests && Object.keys(kubernetesManifests).length > 0;
  const hasDockerStack = !!dockerStackManifest;
  const hasProxy = !!proxyConfig;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Manifests Générés</h2>
        <Badge variant="secondary">
          {Object.keys(kubernetesManifests || {}).length + (hasDockerStack ? 1 : 0)} fichiers
        </Badge>
      </div>

      <Tabs defaultValue={hasKubernetes ? 'kubernetes' : 'swarm'}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kubernetes" disabled={!hasKubernetes}>
            Kubernetes {hasKubernetes && `(${Object.keys(kubernetesManifests).length})`}
          </TabsTrigger>
          <TabsTrigger value="swarm" disabled={!hasDockerStack}>
            Docker Stack
          </TabsTrigger>
          <TabsTrigger value="proxy" disabled={!hasProxy}>
            {proxyType ? proxyType.charAt(0).toUpperCase() + proxyType.slice(1) : 'Proxy'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kubernetes" className="space-y-4">
          {hasKubernetes && (
            <Tabs defaultValue={Object.keys(kubernetesManifests)[0]}>
              <TabsList>
                {Object.keys(kubernetesManifests).map(filename => (
                  <TabsTrigger key={filename} value={filename}>
                    {filename}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(kubernetesManifests).map(([filename, content]) => (
                <TabsContent key={filename} value={filename}>
                  <YamlEditor
                    value={content}
                    readOnly
                    title={filename}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="swarm">
          {hasDockerStack && (
            <YamlEditor
              value={dockerStackManifest}
              readOnly
              title="docker-stack.yml"
            />
          )}
        </TabsContent>

        <TabsContent value="proxy">
          {hasProxy && (
            <YamlEditor
              value={proxyConfig}
              readOnly
              title={`${proxyType}.conf`}
              language={proxyType === 'nginx' ? 'nginx' : 'yaml'}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Étape 3.5 : Page de Conversion Principale (Jour 5-6)

**Fichier `app/convert/page.tsx` :**

```typescript
'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ManifestPreview } from '@/components/ManifestPreview';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DockerComposeParser } from '@/lib/parsers/dockerComposeParser';
import { KubernetesConverter } from '@/lib/converters/kubernetesConverter';
import { DockerStackConverter } from '@/lib/converters/dockerStackConverter';
import { TraefikGenerator } from '@/lib/converters/proxyConfigs/traefikGenerator';
import { useToast } from '@/hooks/use-toast';
import { Download, Settings } from 'lucide-react';
import JSZip from 'jszip';

export default function ConvertPage() {
  const { toast } = useToast();
  const [dockerCompose, setDockerCompose] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('my-project');
  
  // Options
  const [targetPlatform, setTargetPlatform] = useState<'kubernetes' | 'swarm' | 'both'>('both');
  const [proxyType, setProxyType] = useState<'traefik' | 'nginx' | 'caddy' | 'none'>('traefik');
  const [addHealthChecks, setAddHealthChecks] = useState(true);
  const [addResourceLimits, setAddResourceLimits] = useState(true);
  const [addSecurity, setAddSecurity] = useState(true);
  const [email, setEmail] = useState('admin@example.com');
  
  // Results
  const [kubernetesManifests, setKubernetesManifests] = useState<Record<string, string>>({});
  const [dockerStackManifest, setDockerStackManifest] = useState<string>('');
  const [proxyConfig, setProxyConfig] = useState<string>('');

  const handleFileUpload = (content: string, filename: string) => {
    setDockerCompose(content);
    setProjectName(filename.replace(/\.(yml|yaml)$/, ''));
    
    toast({
      title: 'Fichier chargé',
      description: `${filename} a été chargé avec succès`,
    });
  };

  const handleConvert = () => {
    //