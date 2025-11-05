# Documentation - DevOps Deployment Accelerator

**Version**: 1.0.0
**Last Updated**: 2025-11-04

Welcome to the DevOps Deployment Accelerator documentation! This tool helps you transform Docker Compose configurations into production-ready Kubernetes and Docker Swarm deployments in minutes.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Features](#features)
3. [Configuration Options](#configuration-options)
4. [Best Practices](#best-practices)
5. [FAQ](#faq)
6. [Troubleshooting](#troubleshooting)
7. [Examples](#examples)

---

## Getting Started

### Quick Start (5 minutes)

1. **Upload Your Docker Compose File**
   - Navigate to the [Convert page](/convert)
   - Drag and drop your `docker-compose.yml` file, or click to browse
   - Supported formats: `.yml`, `.yaml`

2. **Review Validation**
   - The file is validated instantly
   - Green checkmark = valid and ready to convert
   - Red alert = errors to fix (see error details)
   - Yellow warnings = non-blocking issues

3. **Configure Options**
   - **Project Name**: Auto-generated from filename (editable)
   - **Target Platform**: Kubernetes, Docker Swarm, or Both
   - **Reverse Proxy**: Traefik (recommended), Nginx, Caddy, or None
   - **Resource Profile**: Small, Medium, or Large
   - Enable options: Health Checks, Resource Limits, Security Best Practices

4. **Convert**
   - Click the "Convert" button
   - Wait for manifests to generate (~2-5 seconds)
   - Review generated files in the preview tabs

5. **Export**
   - Click "Export ZIP" to download all files
   - ZIP includes: Kubernetes manifests, Swarm configs, Helm Chart, proxy configs, and README
   - Click "Save Project" to save in browser for later

### What Gets Generated

For **Kubernetes**:
- Deployment YAML for each service
- Service YAML (ClusterIP or LoadBalancer)
- ConfigMap for environment variables
- PersistentVolumeClaim for volumes
- Ingress (if proxy selected)

For **Docker Swarm**:
- docker-stack.yml with deploy configurations
- Overlay networks
- Health checks
- Resource limits and placement constraints

For **Helm Chart**:
- Chart.yaml with metadata
- values.yaml with configurable parameters
- templates/ directory with all Kubernetes manifests
- _helpers.tpl with template functions
- NOTES.txt with deployment instructions

For **Proxy** (if selected):
- Traefik: traefik.yml + IngressRoute
- Nginx: nginx.conf with upstream configs
- Caddy: Caddyfile with automatic HTTPS

---

## Features

### 1. Docker Compose Parser

**What it does**: Parses and validates your Docker Compose v3.x files

**Supported Features**:
- Services with images or build contexts
- Port mappings (host:container, with protocols)
- Environment variables (object or array format)
- Volumes (bind mounts and named volumes)
- Networks (bridge, overlay, custom)
- Depends_on service dependencies
- Health checks (test, interval, timeout, retries)
- Deploy configurations (replicas, resources, restart policies)
- Labels and metadata

**Validation**:
- YAML syntax checking with line/column error reporting
- Required fields validation (image or build)
- Type checking (arrays, strings, numbers)
- Docker Compose spec v3.x compliance

### 2. Kubernetes Converter

**What it does**: Generates production-ready Kubernetes manifests

**Generated Resources**:
- **Deployment**:
  - Default 3 replicas (configurable)
  - Container specs with image, ports, env vars
  - Volume mounts and config maps
  - Resource requests/limits (if enabled)
  - Security contexts (if enabled)
  - Liveness and readiness probes (if enabled)

- **Service**:
  - ClusterIP for internal services
  - LoadBalancer for external services
  - Port mappings from Docker Compose

- **ConfigMap**:
  - Environment variables from Docker Compose
  - Non-sensitive configuration data

- **PersistentVolumeClaim**:
  - For named volumes
  - Default 1Gi size (adjustable in generated YAML)

- **Ingress** (if proxy enabled):
  - HTTP/HTTPS routing rules
  - TLS configuration for SSL
  - Host-based routing

**Best Practices Applied**:
- Rolling update strategy (maxSurge: 1, maxUnavailable: 0)
- Pod disruption budgets for high availability
- Proper labels and selectors
- Annotations for metadata

### 3. Docker Swarm Converter

**What it does**: Generates docker-stack.yml for Docker Swarm deployment

**Features**:
- Deploy section with replicas (default: 3)
- Placement constraints (e.g., node.role == worker)
- Restart policy (on-failure, 5s delay, 3 max attempts)
- Resource limits and reservations
- Overlay networks with attachable flag
- Health checks compatible with Swarm
- Update configurations for rolling updates

**Deployment Command**:
```bash
docker stack deploy -c docker-stack.yml <project-name>
```

### 4. Reverse Proxy Configurations

#### Traefik (Recommended)

**Why Traefik?**
- Native Docker and Kubernetes support
- Automatic service discovery
- Let's Encrypt SSL automation
- Built-in dashboard
- WebSocket support

**Generated Files**:
- `traefik.yml`: Static configuration
- Kubernetes IngressRoute with TLS
- Docker labels for service routing

**Features**:
- Automatic HTTPS with Let's Encrypt
- HTTP to HTTPS redirect
- Custom routing rules
- Middleware support (compression, rate limiting)

#### Nginx

**Generated Files**:
- `nginx.conf`: Full Nginx configuration
- Kubernetes ConfigMap
- Upstream backend definitions

**Features**:
- SSL/TLS configuration (TLSv1.2, TLSv1.3)
- Load balancing algorithms
- WebSocket support
- Custom headers and caching

#### Caddy

**Generated Files**:
- `Caddyfile`: Simple configuration format

**Features**:
- Automatic HTTPS (built-in Let's Encrypt)
- Zero-config SSL
- HTTP/2 and HTTP/3 support
- Simple syntax

### 5. Production Hardening

#### Health Checks

**Liveness Probe**:
- Checks if container is alive
- Restarts container if fails
- Default: HTTP GET /health every 10s

**Readiness Probe**:
- Checks if container is ready for traffic
- Removes from service endpoints if fails
- Default: HTTP GET /ready every 10s

**Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

#### Resource Limits

**Profiles**:

**Small** (Microservices, background workers):
- CPU Request: 100m (0.1 cores)
- CPU Limit: 500m (0.5 cores)
- Memory Request: 128Mi
- Memory Limit: 512Mi

**Medium** (Web applications, APIs):
- CPU Request: 250m (0.25 cores)
- CPU Limit: 1000m (1 core)
- Memory Request: 256Mi
- Memory Limit: 1Gi

**Large** (Databases, data processing):
- CPU Request: 500m (0.5 cores)
- CPU Limit: 2000m (2 cores)
- Memory Request: 512Mi
- Memory Limit: 2Gi

**Why Resource Limits?**
- Prevents resource starvation
- Enables better scheduling
- Cost optimization
- Predictable performance

#### Security Best Practices

**Applied Configurations**:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  seccompProfile:
    type: RuntimeDefault
```

**Benefits**:
- Prevents privilege escalation attacks
- Reduces attack surface
- Complies with security standards
- Protects host system

### 6. Helm Chart Generator

**What it does**: Creates complete Helm Chart for easy deployment

**Generated Structure**:
```
helm/
└── <project-name>/
    ├── Chart.yaml          # Chart metadata
    ├── values.yaml         # Configurable values
    ├── templates/
    │   ├── _helpers.tpl    # Template helpers
    │   ├── NOTES.txt       # Post-install notes
    │   ├── deployment.yaml # Deployment templates
    │   ├── service.yaml    # Service templates
    │   └── ingress.yaml    # Ingress template
    └── README.md           # Chart documentation
```

**Values.yaml Features**:
- Per-service replicas configuration
- Image repository and tag
- Resource requests and limits
- Ingress enabled/disabled
- Autoscaling configuration
- Environment variables
- Service types and ports

**Deployment**:
```bash
helm install <release-name> ./helm/<project-name>
helm upgrade <release-name> ./helm/<project-name>
helm uninstall <release-name>
```

### 7. Project Management

**Save Projects**:
- Saved in browser LocalStorage (5MB limit)
- Includes Docker Compose, options, and results
- Access from Projects page
- No server required, 100% client-side

**Export Projects**:
- Download as ZIP archive
- Organized folder structure
- README with deployment instructions
- .env.example template

**Storage Management**:
- Usage indicator shows space used
- Warning at 80% capacity
- Auto-cleanup suggestions
- Export before delete recommended

---

## Configuration Options

### Target Platform

**Kubernetes Only**:
- Generates only Kubernetes manifests
- Use when deploying to K8s clusters (GKE, EKS, AKS, etc.)
- Includes Helm Chart

**Docker Swarm Only**:
- Generates only docker-stack.yml
- Use when deploying to Docker Swarm clusters
- Simpler than Kubernetes

**Both Platforms**:
- Generates both Kubernetes and Swarm configs
- Use when you want flexibility
- Slightly longer generation time

### Reverse Proxy

**Traefik** (Recommended):
- Best for both Docker and Kubernetes
- Automatic SSL with Let's Encrypt
- Service discovery
- Web dashboard

**Nginx**:
- Battle-tested and widely used
- High performance
- Extensive documentation
- Manual SSL setup

**Caddy**:
- Simplest configuration
- Automatic HTTPS
- Modern defaults
- Great for simple deployments

**None**:
- No proxy configuration generated
- Use if you have existing proxy
- Or for internal services only

### Resource Profile

Choose based on your service requirements:

**Small**:
- Low-traffic services
- Background workers
- Development environments
- Microservices with light load

**Medium** (Recommended):
- Web applications
- REST APIs
- Moderate traffic
- Production workloads

**Large**:
- Databases (PostgreSQL, MySQL, MongoDB)
- Data processing services
- High-traffic APIs
- Memory-intensive applications

### Options Toggles

**Health Checks**:
- ✅ Enable: Adds liveness and readiness probes
- ❌ Disable: No probes (use for simple services)
- Recommended: **Enabled** for production

**Resource Limits**:
- ✅ Enable: Adds CPU and memory limits
- ❌ Disable: No limits (cluster decides)
- Recommended: **Enabled** for production

**Security Best Practices**:
- ✅ Enable: Applies security contexts
- ❌ Disable: Default security settings
- Recommended: **Enabled** for production

---

## Best Practices

### Docker Compose Preparation

1. **Use Specific Image Tags**:
   ```yaml
   # Good
   image: nginx:1.25.3-alpine

   # Avoid
   image: nginx:latest
   ```

2. **Define Health Checks**:
   ```yaml
   services:
     web:
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

3. **Set Resource Constraints**:
   ```yaml
   services:
     web:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 1G
           reservations:
             cpus: '0.5'
             memory: 512M
   ```

4. **Use Named Volumes**:
   ```yaml
   services:
     db:
       volumes:
         - db_data:/var/lib/postgresql/data

   volumes:
     db_data:
   ```

### Kubernetes Deployment

1. **Review Generated Manifests**:
   - Check replica counts
   - Verify resource limits
   - Confirm health check paths
   - Review ingress hostnames

2. **Apply in Order**:
   ```bash
   kubectl apply -f kubernetes/configmaps/
   kubectl apply -f kubernetes/pvcs/
   kubectl apply -f kubernetes/deployments/
   kubectl apply -f kubernetes/services/
   kubectl apply -f kubernetes/ingress/
   ```

3. **Monitor Rollout**:
   ```bash
   kubectl rollout status deployment/<service-name>
   kubectl get pods -w
   kubectl logs -f deployment/<service-name>
   ```

4. **Use Namespaces**:
   ```bash
   kubectl create namespace production
   kubectl apply -f kubernetes/ -n production
   ```

### Docker Swarm Deployment

1. **Initialize Swarm** (if not done):
   ```bash
   docker swarm init
   ```

2. **Deploy Stack**:
   ```bash
   docker stack deploy -c docker-stack.yml myapp
   ```

3. **Monitor Services**:
   ```bash
   docker stack services myapp
   docker service logs myapp_web
   docker service ps myapp_web
   ```

4. **Update Services**:
   ```bash
   docker service update --image nginx:1.25.4-alpine myapp_web
   ```

### Helm Deployment

1. **Lint Chart**:
   ```bash
   helm lint ./helm/<project-name>
   ```

2. **Dry Run**:
   ```bash
   helm install --dry-run --debug <release> ./helm/<project-name>
   ```

3. **Install**:
   ```bash
   helm install <release> ./helm/<project-name>
   ```

4. **Customize Values**:
   ```bash
   helm install <release> ./helm/<project-name> \
     --set replicaCount=5 \
     --set image.tag=v2.0.0
   ```

### Security

1. **Scan Images**:
   ```bash
   docker scan nginx:1.25.3-alpine
   trivy image nginx:1.25.3-alpine
   ```

2. **Use Secrets** (not in ConfigMaps):
   ```bash
   kubectl create secret generic db-password --from-literal=password=mysecret
   ```

3. **Enable Network Policies**:
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: deny-all
   spec:
     podSelector: {}
     policyTypes:
     - Ingress
     - Egress
   ```

4. **Regular Updates**:
   - Update base images regularly
   - Monitor CVEs
   - Apply security patches

---

## FAQ

### General

**Q: Is this tool free to use?**
A: Yes, completely free. All processing happens in your browser.

**Q: Do you store my Docker Compose files?**
A: No. Everything runs client-side in your browser. No data is sent to servers.

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, Edge (latest versions). LocalStorage must be enabled.

**Q: Can I use this offline?**
A: After first load, yes (PWA support coming soon).

### Docker Compose

**Q: Which Docker Compose version is supported?**
A: v3.x (v3.0 through v3.8). v2.x may work but is not guaranteed.

**Q: My Docker Compose has custom extensions, will it work?**
A: Custom fields are passed through but may not be converted. Standard fields are fully supported.

**Q: Can I convert docker-compose.override.yml?**
A: Merge it with docker-compose.yml first using `docker-compose config`.

### Kubernetes

**Q: Which Kubernetes version is targeted?**
A: API v1.28+. Generated manifests work with v1.24 and newer.

**Q: Do I need to modify generated manifests?**
A: Usually no, but review:
- Ingress hostnames (replace example.com)
- PVC storage sizes (default 1Gi)
- Namespace (default: default)

**Q: How do I handle secrets?**
A: Create Kubernetes Secrets manually, then reference in Deployments:
```bash
kubectl create secret generic my-secret --from-env-file=.env
```

### Docker Swarm

**Q: Can I deploy to a single-node Swarm?**
A: Yes, but replicas may be limited. Adjust replicas in docker-stack.yml.

**Q: How do I scale services?**
A: `docker service scale myapp_web=5`

**Q: What about secrets in Swarm?**
A: Use Docker Secrets:
```bash
echo "mysecret" | docker secret create db_password -
```

### Storage

**Q: How much can I store in LocalStorage?**
A: 5-10MB depending on browser. App warns at 80% usage.

**Q: What happens if storage is full?**
A: You'll see an error with suggestions (delete old projects, export to ZIP).

**Q: Can I export my saved projects?**
A: Yes, each project can be exported as ZIP. Or export all projects as JSON.

### Errors

**Q: "Validation failed" error, what do I do?**
A: Read the error details. Common issues:
- Missing `image` or `build` field
- Invalid YAML syntax
- Wrong field types (string vs array)

**Q: "Storage quota exceeded" error?**
A: Delete old projects or export and clear. Each project with large compose files takes more space.

**Q: Generated manifests fail to apply?**
A: Check:
- Kubernetes version compatibility
- Image names and tags exist
- Namespace exists
- No port conflicts

---

## Troubleshooting

### File Upload Issues

**Problem**: File won't upload
**Solutions**:
- Check file extension (.yml or .yaml)
- Verify file is valid YAML
- Try smaller file (<1MB)
- Disable browser extensions
- Try different browser

**Problem**: "Invalid YAML" error
**Solutions**:
- Validate YAML syntax online (yamllint.com)
- Check indentation (spaces, not tabs)
- Verify quotes are balanced
- Look for special characters

### Conversion Issues

**Problem**: Missing services in output
**Solutions**:
- Check service has `image` or `build`
- Verify service is in `services:` section
- Review validation warnings

**Problem**: Ports not mapped correctly
**Solutions**:
- Use standard format: "8080:80"
- Specify protocol if needed: "8080:80/tcp"
- Check for port conflicts

**Problem**: Environment variables not converted
**Solutions**:
- Use object format: `KEY: value`
- Or array format: `- KEY=value`
- Avoid `env_file` (use inline env vars)

### Deployment Issues

**Problem**: Pods not starting (Kubernetes)
**Solutions**:
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```
- Check image pull errors
- Verify resource limits aren't too low
- Check health check endpoints exist

**Problem**: Services not reachable
**Solutions**:
- Verify Service selector matches Deployment labels
- Check port numbers match container ports
- Test from within cluster first: `kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://<service>:<port>`

**Problem**: Ingress not working
**Solutions**:
- Verify Ingress Controller is installed
- Check DNS points to LoadBalancer IP
- Review Ingress rules and hostnames
- Check TLS certificates if using HTTPS

### Performance Issues

**Problem**: Slow conversion
**Solutions**:
- Large files (>100 services) take longer
- Clear browser cache
- Try different browser
- Disable browser extensions

**Problem**: Monaco Editor laggy
**Solutions**:
- Large files (>10,000 lines) may be slow
- Use download instead of preview
- Close other browser tabs

---

## Examples

### Example 1: Simple Web Application

**Docker Compose**:
```yaml
version: '3.8'
services:
  web:
    image: nginx:1.25.3-alpine
    ports:
      - "80:80"
    environment:
      - NGINX_HOST=example.com
```

**Configuration**:
- Platform: Kubernetes
- Proxy: Traefik
- Resource Profile: Small
- All options enabled

**Generated**:
- Deployment with 3 replicas
- ClusterIP Service on port 80
- IngressRoute with TLS
- ConfigMap for NGINX_HOST

### Example 2: Multi-Tier Application

**Docker Compose**:
```yaml
version: '3.8'
services:
  frontend:
    image: myapp/frontend:latest
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://backend:5000
    depends_on:
      - backend

  backend:
    image: myapp/backend:latest
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://db:5432/myapp
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

**Configuration**:
- Platform: Both
- Proxy: Traefik
- Resource Profile: Medium (frontend, backend), Large (db)
- All options enabled

**Generated**:
- 3 Deployments with health checks
- 3 Services (ClusterIP)
- 1 ConfigMap for env vars
- 1 PersistentVolumeClaim (10Gi)
- IngressRoute for frontend
- docker-stack.yml for Swarm
- Helm Chart with values

### Example 3: Microservices Architecture

**Docker Compose**:
```yaml
version: '3.8'
services:
  api-gateway:
    image: myapp/gateway:v1
    ports:
      - "8080:8080"

  users-service:
    image: myapp/users:v1
    environment:
      - DB_HOST=postgres

  orders-service:
    image: myapp/orders:v1
    environment:
      - DB_HOST=postgres

  products-service:
    image: myapp/products:v1
    environment:
      - DB_HOST=postgres

  postgres:
    image: postgres:15
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  pg_data:
```

**Configuration**:
- Platform: Kubernetes
- Proxy: Traefik
- Resource Profile: Medium
- All options enabled

**Generated**:
- 6 Deployments
- 6 Services
- ConfigMaps for env vars
- PVC for postgres
- IngressRoute with routing to api-gateway
- Helm Chart with per-service configuration

---

## Additional Resources

### External Documentation

- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Helm Charts](https://helm.sh/docs/topics/charts/)
- [Traefik Proxy](https://doc.traefik.io/traefik/)

### Tools & Utilities

- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) - Kubernetes CLI
- [helm](https://helm.sh/docs/intro/install/) - Kubernetes package manager
- [docker](https://docs.docker.com/get-docker/) - Docker CLI
- [k9s](https://k9scli.io/) - Kubernetes TUI
- [lens](https://k8slens.dev/) - Kubernetes IDE

### Community

- GitHub Issues: [Report bugs or request features](https://github.com/anthropics/claude-code/issues)
- Discussions: Share your use cases and feedback

---

**Happy Deploying!** 🚀

If you have questions or need help, check the FAQ and Troubleshooting sections above.
