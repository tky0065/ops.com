# 🤖 CLAUDE.md - Documentation de Référence du Projet

> **Guide complet pour Claude lors des sessions de développement du DevOps Deployment Accelerator**

---

## 📌 Présentation du Projet

### Nom du Projet
**DevOps Deployment Accelerator** (ops.com)

### Description
Application web Next.js qui transforme automatiquement les configurations Docker Compose de développement en configurations production-ready pour Kubernetes et Docker Swarm. Elle génère également les configurations de reverse proxy (Traefik, Nginx, Caddy), injecte les health checks, resource limits, et applique les meilleures pratiques de sécurité.

### Problème Résolu
Actuellement, convertir un `docker-compose.yml` en manifests Kubernetes production-ready prend **plusieurs jours** et nécessite une expertise DevOps pointue. Cette application réduit ce temps à **quelques minutes** tout en garantissant sécurité et scalabilité.

### Utilisateurs Cibles
- Développeurs full-stack connaissant Docker mais pas Kubernetes
- Équipes DevOps de startups cherchant à accélérer les déploiements
- Freelances gérant plusieurs projets clients
- Consultants techniques automatisant les meilleures pratiques

### Valeur Ajoutée
- **Rapidité** : De plusieurs jours à quelques minutes
- **Sécurité** : Best practices appliquées automatiquement
- **Simplicité** : Pas besoin d'expertise Kubernetes/Helm
- **Gratuité** : Hébergement gratuit sur Vercel, pas de backend

---

## 🏗️ Architecture & Stack Technique

### Stack Technique Complète

**Frontend & Framework**
- Next.js 15+ (App Router, Server Components)
- TypeScript (strict mode)
- React 18.3+

**Styling & UI**
- Tailwind CSS 4
- shadcn/ui (composants UI)
- Lucide React (icônes)

**Parsing & Validation**
- js-yaml (parsing YAML)
- Zod (validation schémas)

**Éditeur de Code**
- Monaco Editor ou CodeMirror

**Utilitaires**
- JSZip (génération archives)
- React Hook Form (formulaires)

**Persistance**
- LocalStorage API (client-side, 5MB limit)

**Hébergement**
- Vercel (gratuit, serverless)

### Décisions Techniques Importantes

1. **Pas de Backend** : Tout le traitement est fait côté client
   - Pourquoi : Coût zéro, déploiement instantané
   - Conséquence : Limite de 5MB pour LocalStorage

2. **LocalStorage pour Persistance**
   - Pourquoi : Simplicité, pas de serveur nécessaire
   - Limite : 5-10MB selon navigateurs
   - Gestion : Warning à 80%, nettoyage possible

3. **Next.js 15+ (pas 16+)**
   - Version stable actuelle
   - App Router mature

4. **Client-side Processing**
   - Parser, conversion, génération : tout en JavaScript
   - Web Workers pour opérations lourdes (si nécessaire)

---

## 📂 Structure du Projet

### Arborescence

```
ops.com/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout principal avec navigation
│   ├── page.tsx                 # Page d'accueil (hero, features)
│   ├── convert/
│   │   └── page.tsx            # Page de conversion principale
│   ├── projects/
│   │   └── page.tsx            # Liste des projets sauvegardés
│   └── templates/
│       └── page.tsx            # Bibliothèque de templates
│
├── components/                   # Composants React
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── FileUpload.tsx          # Upload drag & drop
│   ├── YamlEditor.tsx          # Monaco Editor wrapper
│   ├── ManifestPreview.tsx     # Preview avec tabs
│   └── ProjectList.tsx         # Liste projets
│
├── lib/                         # Logique métier
│   ├── parsers/
│   │   ├── dockerComposeParser.ts     # Parser YAML avec Zod
│   │   └── validators.ts              # Validateurs
│   ├── converters/
│   │   ├── kubernetesConverter.ts     # Docker → Kubernetes
│   │   ├── dockerStackConverter.ts    # Docker → Swarm
│   │   ├── helmGenerator.ts           # Helm Chart generator
│   │   └── proxyConfigs/
│   │       ├── traefikGenerator.ts    # Config Traefik
│   │       ├── nginxGenerator.ts      # Config Nginx
│   │       └── caddyGenerator.ts      # Config Caddy
│   ├── storage/
│   │   └── localStorage.ts            # Gestion LocalStorage
│   ├── utils/
│   │   ├── yamlUtils.ts              # Utilitaires YAML
│   │   ├── exportUtils.ts            # Génération ZIP
│   │   └── documentationGenerator.ts # Génération README.md
│   └── templates/
│       ├── mern.json                 # Template MERN stack
│       ├── lamp.json                 # Template LAMP
│       ├── wordpress.json            # Template WordPress
│       └── ...
│
├── types/                       # Types TypeScript
│   ├── dockerCompose.ts        # Types Docker Compose
│   ├── kubernetes.ts           # Types Kubernetes
│   └── project.ts              # Types Project
│
├── public/                      # Assets statiques
│
├── TODO.md                      # Checklist complète des tâches
├── mvp-plan-2025-11-04 v2.md  # Plan MVP détaillé
├── agent-prompt-2025-11-04.md # Prompt agent avec instructions
└── CLAUDE.md                    # Ce fichier (doc de référence)
```

### Conventions de Nommage

**Fichiers**
- Composants React : PascalCase (`FileUpload.tsx`)
- Utilitaires : camelCase (`yamlUtils.ts`)
- Types : camelCase (`dockerCompose.ts`)

**Classes**
- PascalCase avec suffixe descriptif
- Exemples : `DockerComposeParser`, `KubernetesConverter`, `LocalStorageManager`

**Fonctions**
- camelCase, verbes descriptifs
- Exemples : `parse()`, `convert()`, `generateREADME()`

---

## ✨ Fonctionnalités Principales

### 1. Core Conversion Engine

#### Parser Docker Compose
- Parse YAML Docker Compose v3.x
- Validation avec Zod
- Extraction metadata (services, volumes, networks, ports)
- Détection erreurs avec ligne/colonne
- Warnings pour configs manquantes

#### Conversion Kubernetes
- Génère : Deployment, Service, ConfigMap, PersistentVolumeClaim
- Replicas default: 3
- Env vars → ConfigMap
- Volumes → PVC
- Ports → Service (ClusterIP ou LoadBalancer)

#### Conversion Docker Stack
- Compatible `docker stack deploy`
- Deploy section avec replicas, placement constraints
- Restart policy (on-failure, 5s delay, 3 attempts)
- Resource limits (0.5 CPU, 512M memory)
- Overlay networks

#### Export Helm Chart *(NOUVEAU v1.1.0)*
- Chart.yaml avec metadata
- values.yaml configurable (replicas, resources, ingress)
- templates/ avec manifests K8s
- _helpers.tpl avec labels standards
- NOTES.txt avec instructions
- Validation helm lint simulée

### 2. Reverse Proxy & Networking

#### Traefik (MUST-HAVE)
- Labels Docker pour routage
- IngressRoute Kubernetes avec TLS
- Let's Encrypt auto-SSL
- Configuration statique (traefik.yml)

#### Nginx (NICE-TO-HAVE)
- nginx.conf avec upstream backend
- ConfigMap Kubernetes
- SSL/TLS (TLSv1.2, TLSv1.3)
- WebSocket support

#### Caddy (NICE-TO-HAVE)
- Caddyfile simple
- Auto-SSL intégré
- Security headers
- JSON logging

### 3. Production Hardening

#### Health Checks
- Liveness probe : HTTP GET /health
- Readiness probe : HTTP GET /ready
- Délais configurables (initialDelay, period, timeout)
- Fallback TCP probe

#### Resource Limits
- 3 profils : small, medium, large
- Requests/Limits CPU et mémoire
- Warnings si limites trop basses

#### Security Best Practices
- runAsNonRoot: true
- readOnlyRootFilesystem: true
- drop ALL capabilities
- seccompProfile: RuntimeDefault

### 4. Interface Utilisateur

#### Upload
- Drag & drop zone
- File picker (.yml, .yaml)
- Validation instantanée

#### Éditeur YAML
- Monaco Editor
- Syntax highlighting
- Copy to clipboard
- Download

#### Preview
- Tabs : Kubernetes, Swarm, Proxy, Helm
- Nested tabs pour fichiers multiples
- Syntax highlighting
- Copy/Download par fichier

#### Export
- ZIP avec structure organisée
- kubernetes/, swarm/, proxy/, helm/
- README.md auto-généré
- .env.example

### 5. Gestion de Projets

- Sauvegarde auto dans LocalStorage
- Liste avec recherche/filtre
- Réouverture de projets
- Suppression avec confirmation
- Indicateur d'espace utilisé

---

## 📊 État Actuel du Projet

### ✅ Ce qui est Fait

- [x] Setup initial Next.js avec TypeScript et Tailwind CSS *(PARTIELLEMENT)*
- [x] Structure de dossiers créée
- [x] Fichiers de documentation (TODO.md, CLAUDE.md, MVP plan)

### 🔨 Ce qui Reste à Faire

**Phase 1 : Foundation & Core (2 semaines)**
- [ ] Installation dépendances complètes
- [ ] Types TypeScript (dockerCompose, kubernetes, project)
- [ ] Parser Docker Compose avec Zod
- [ ] Convertisseur Kubernetes
- [ ] Convertisseur Docker Stack
- [ ] LocalStorage Manager

**Phase 2 : Reverse Proxy & Hardening (1.5 semaines)**
- [ ] Générateur Traefik
- [ ] Générateur Nginx
- [ ] Générateur Caddy
- [ ] Production Hardening (health checks, resources, security)

**Phase 3 : Interface & Export (2 semaines)**
- [ ] Page d'accueil et layout
- [ ] Composant upload
- [ ] Éditeur YAML
- [ ] Preview manifests
- [ ] Page conversion principale
- [ ] Générateur documentation
- [ ] Page liste projets
- [ ] Export ZIP
- [ ] Templates
- [ ] **Générateur Helm Chart** *(NOUVEAU)*

**Phase 4 : Polish & Testing (1 semaine)**
- [ ] Tests end-to-end
- [ ] Optimisation performance
- [ ] Gestion d'erreurs
- [ ] Documentation utilisateur
- [ ] Responsive design
- [ ] Déploiement Vercel

### 📈 Progression Globale

- **Phase 1** : 0% (0/10 tâches)
- **Phase 2** : 0% (0/4 tâches)
- **Phase 3** : 0% (0/10 tâches)
- **Phase 4** : 0% (0/7 tâches)

**User Stories** : 0/16 complétées
**Features MUST-HAVE** : 0/13 implémentées
**Features NICE-TO-HAVE** : 0/8 implémentées

---

## 🚀 Guide de Développement

### Démarrer une Session de Développement

1. **Lire les documents de référence**
   - Ce fichier (CLAUDE.md) pour le contexte
   - TODO.md pour les tâches spécifiques
   - MVP plan pour les détails fonctionnels

2. **Vérifier l'état actuel**
   - Regarder la progression dans TODO.md
   - Identifier la prochaine tâche à compléter
   - Vérifier les dépendances

3. **Planifier**
   - Utiliser le mode Plan de Claude pour analyser
   - Présenter un plan clair avant exécution
   - Obtenir validation utilisateur

4. **Développer**
   - Suivre les conventions du projet
   - Commenter le code en anglais (inline)
   - Tester au fur et à mesure

5. **Valider**
   - Cocher les tâches dans TODO.md
   - Tester manuellement les fonctionnalités
   - Vérifier les critères d'acceptation

### Workflow de Développement

```
1. Lire CLAUDE.md + TODO.md
2. Identifier tâche suivante
3. Mode Plan → Analyse → Présentation
4. Validation utilisateur
5. Implémentation
6. Tests
7. Update TODO.md
8. Commit (si demandé)
```

### Standards de Code

**TypeScript**
- Mode strict activé
- Typage explicite pour fonctions publiques
- Interfaces pour structures de données
- Éviter `any`, préférer `unknown` si nécessaire

**React**
- Composants fonctionnels uniquement
- Hooks standards (useState, useEffect, useMemo, useCallback)
- Props typées avec interfaces
- Client components : `'use client'` en haut

**Styling**
- Tailwind CSS uniquement
- Classes utilitaires
- Pas de CSS custom (sauf cas extrêmes)
- Responsive mobile-first

**Commentaires**
- Anglais pour code inline
- Français OK pour TODOs/notes
- JSDoc pour fonctions publiques complexes

**Gestion d'Erreurs**
- Try-catch pour opérations risquées
- Messages d'erreur clairs et utilisables
- Toast notifications pour feedback utilisateur

### Tests à Effectuer

**Tests Manuels (Phase par Phase)**
1. Parser avec Docker Compose valide/invalide
2. Conversion K8s : vérifier manifests générés
3. Conversion Swarm : vérifier compatibilité
4. Health checks : vérifier injection
5. Resource limits : vérifier valeurs
6. Export ZIP : vérifier structure et contenu
7. LocalStorage : save/load/delete

**Tests End-to-End (Phase 4)**
- Docker Compose réels (single, multi-tier, microservices)
- Toutes combinaisons options
- Tous types de proxy
- Mobile/Tablet/Desktop

---

## 📚 Références Importantes

### Documents du Projet

- **TODO.md** : Checklist complète avec toutes les tâches
- **mvp-plan-2025-11-04 v2.md** : Plan MVP détaillé avec user stories
- **agent-prompt-2025-11-04.md** : Instructions détaillées pour implémentation

### Documentation Externe

**Docker & Docker Compose**
- [Docker Compose Spec v3.x](https://docs.docker.com/compose/compose-file/)
- [Docker Swarm](https://docs.docker.com/engine/swarm/)

**Kubernetes**
- [Kubernetes API v1.28+](https://kubernetes.io/docs/reference/)
- [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/)
- [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

**Helm**
- [Helm v3 Documentation](https://helm.sh/docs/)
- [Chart API v2](https://helm.sh/docs/topics/charts/)
- [Best Practices](https://helm.sh/docs/chart_best_practices/)

**Reverse Proxies**
- [Traefik v2.10](https://doc.traefik.io/traefik/)
- [Nginx](https://nginx.org/en/docs/)
- [Caddy v2](https://caddyserver.com/docs/)

**Next.js & React**
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 18 Docs](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)

**UI & Tools**
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Zod](https://zod.dev/)

---

## 💡 Notes Importantes pour Claude

### Priorités de Développement

1. **Phase 1 est critique** : Sans parser et convertisseurs, rien ne fonctionne
2. **Traefik avant Nginx/Caddy** : Traefik est MUST-HAVE
3. **Health checks + Resource limits** : Simples mais essentiels
4. **Interface minimaliste d'abord** : Fonctionnel avant joli
5. **Helm Chart** : Nouvelle priorité HIGH ajoutée en v1.1.0

### Patterns à Suivre

**Classes de Conversion**
```typescript
export class NameConverter {
  static convert(input: Type, options?: Options): Output {
    // Logique de conversion
  }

  static validate(input: Type): ValidationResult {
    // Validation
  }
}
```

**Gestion d'Erreurs**
```typescript
try {
  const result = parse(input);
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: error.message,
    details: error.stack
  };
}
```

**Composants React**
```typescript
'use client'; // Si besoin de hooks/state

interface Props {
  value: string;
  onChange?: (value: string) => void;
}

export function Component({ value, onChange }: Props) {
  // Composant
}
```

### Pièges à Éviter

1. **Ne pas oublier 'use client'** pour composants interactifs
2. **Vérifier limite LocalStorage** avant de sauvegarder
3. **Valider YAML avant conversion** pour éviter erreurs
4. **Tester avec Docker Compose réels** (pas que exemples simples)
5. **Next.js 15, pas 16** (version corrigée en v1.1.0)
6. **Ne pas utiliser d'emojis dans le code** sauf si demandé explicitement

### Utilisation de cette Documentation

**Au début de chaque session :**
1. Lire la section "État Actuel du Projet"
2. Consulter TODO.md pour tâche suivante
3. Revenir ici pour contexte/architecture si besoin

**Pendant le développement :**
1. Référencer "Structure du Projet" pour chemins
2. Suivre "Standards de Code"
3. Vérifier "Patterns à Suivre"

**Avant de terminer :**
1. Mettre à jour TODO.md
2. Vérifier critères d'acceptation
3. Documenter changements si majeurs

---

## 🔄 Changelog du Projet

### v1.1.0 - 2025-11-04

**Ajouts**
- Version Next.js corrigée : 16+ → 15+
- Nouvelle feature MUST-HAVE : Export Helm Chart
- US-016 : Exporter Helm Chart (HIGH, 3 jours)
- Day 35 : Générateur Helm Chart complet
- Dépendance : Helm v3+ (Chart API v2)
- Tests Helm Chart ajoutés

**Modifications**
- Phase 3 : 1.5 semaines → 2 semaines (+3 jours Helm)
- User Stories : 15 → 16
- Features MUST-HAVE : 12 → 13
- HIGH Priority : 8 → 9

### v1.0.0 - 2025-11-04

**Initial**
- Setup projet Next.js
- Documentation complète (TODO.md, MVP plan, agent prompt)
- Architecture définie
- Roadmap 4 phases planifiée

---

## 📞 Support & Aide

**En cas de blocage :**
1. Relire cette section du CLAUDE.md
2. Consulter TODO.md pour contexte
3. Vérifier MVP plan pour spécifications
4. Demander clarification à l'utilisateur

**En cas de doute sur une décision technique :**
1. Mode Plan pour présenter options
2. Expliquer avantages/inconvénients
3. Demander préférence utilisateur
4. Documenter décision prise

---

**Dernière mise à jour** : 2025-11-04
**Version** : 1.1.0
**Auteur** : Documentation générée pour Claude par Claude 🤖

---

> 💡 **Conseil** : Garde ce fichier ouvert dans un onglet pendant le développement pour référence rapide !
