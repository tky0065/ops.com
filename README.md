# 🚀 DevOps Deployment Accelerator

> Transform Docker Compose configurations to production-ready Kubernetes and Docker Swarm deployments in minutes

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Live Demo**: [https://ops-accelerator.vercel.app](https://ops-accelerator.vercel.app) *(Update with your URL)*

---

## 📌 Overview

**DevOps Deployment Accelerator** is a powerful web application that automates the conversion of Docker Compose files into production-ready configurations for:

- 🎯 **Kubernetes** (Deployments, Services, ConfigMaps, PVCs)
- 🐳 **Docker Swarm** (Stack files with production settings)
- ⎈ **Helm Charts** (Complete Helm v3 charts with best practices)
- 🔄 **Reverse Proxies** (Traefik, Nginx, Caddy with auto-SSL)

### The Problem

Converting a `docker-compose.yml` to production-ready Kubernetes manifests typically takes **days** and requires deep DevOps expertise. This tool reduces that time to **minutes** while applying security best practices automatically.

### The Solution

- ✅ Upload your Docker Compose file
- ✅ Configure deployment options (replicas, resources, proxy)
- ✅ Download a complete, production-ready deployment package
- ✅ Deploy to Kubernetes, Docker Swarm, or use Helm

---

## ✨ Features

### Core Conversion Engine
- 📝 **Docker Compose Parser**: Full support for Compose v3.x
- 🎯 **Kubernetes Converter**: Generates Deployments, Services, ConfigMaps, PVCs
- 🐳 **Docker Swarm Converter**: Stack files with deploy configurations
- ⎈ **Helm Chart Generator**: Complete Helm v3 charts with values.yaml
- 🔐 **Production Hardening**: Health checks, resource limits, security settings

### Reverse Proxy Configurations
- 🔄 **Traefik**: Automatic service discovery, Let's Encrypt SSL, labels
- 🌐 **Nginx**: Upstream configuration, SSL/TLS, WebSocket support
- ⚡ **Caddy**: Automatic HTTPS, JSON logging, reverse proxy

### User Experience
- 📤 **Drag & Drop Upload**: Easy file upload with validation
- ✏️ **Monaco Editor**: Syntax highlighting, copy, download
- 👁️ **Live Preview**: Multi-tab preview (K8s, Swarm, Proxy, Helm)
- 📦 **Export ZIP**: Organized folder structure with README
- 💾 **Project Management**: Save/load projects in LocalStorage
- 📚 **Templates**: Pre-built templates (MERN, LAMP, WordPress, etc.)

### Production Ready
- 🔒 **Security**: runAsNonRoot, readOnlyRootFilesystem, drop capabilities
- 📊 **Health Checks**: Liveness and readiness probes
- 🎛️ **Resource Limits**: CPU and memory (3 profiles: small, medium, large)
- 📖 **Auto Documentation**: README.md generated with deployment instructions
- 📱 **Responsive**: Works on mobile, tablet, and desktop

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ops.com.git
   cd ops.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm run start
```

---

## 📖 Usage Guide

### 1. Upload Docker Compose File

- Click **"Choose File"** or drag & drop your `docker-compose.yml`
- File is validated automatically (YAML syntax, size)

### 2. Configure Deployment Options

**Basic Settings**:
- **Project Name**: Identifier for your deployment
- **Namespace** (K8s): Kubernetes namespace
- **Stack Name** (Swarm): Docker stack name

**Resources**:
- **Resource Profile**: Small (0.5 CPU, 512MB) / Medium (1 CPU, 1GB) / Large (2 CPU, 2GB)
- **Replicas**: Number of pod/container replicas (default: 3)

**Reverse Proxy**:
- Choose: None, Traefik, Nginx, or Caddy
- **Email**: For Let's Encrypt SSL (required if proxy enabled)
- **Domain**: Your application domain

**Production Options**:
- ✅ **Health Checks**: Liveness and readiness probes
- ✅ **Resource Limits**: CPU and memory constraints
- ✅ **Security Hardening**: Non-root user, read-only filesystem

### 3. Preview Generated Manifests

Navigate through tabs to review:
- **Kubernetes**: Deployments, Services, ConfigMaps, PVCs
- **Docker Swarm**: Stack YAML with deploy configs
- **Proxy**: Traefik/Nginx/Caddy configurations
- **Helm**: Helm chart with values.yaml

### 4. Export & Deploy

**Download ZIP** containing:
```
my-project/
├── kubernetes/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── pvc.yaml
├── swarm/
│   └── docker-stack.yml
├── proxy/
│   ├── traefik.yml
│   ├── nginx.conf
│   └── Caddyfile
├── helm/
│   └── my-chart/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── .env.example
└── README.md
```

**Deploy to Kubernetes**:
```bash
kubectl apply -f kubernetes/
```

**Deploy to Docker Swarm**:
```bash
docker stack deploy -c swarm/docker-stack.yml myapp
```

**Deploy with Helm**:
```bash
helm install myapp helm/my-chart/
```

---

## 🏗️ Architecture

### Tech Stack

**Frontend**:
- **Next.js 16** (App Router, Server Components, Turbopack)
- **React 19** (Hooks, Suspense)
- **TypeScript 5** (Strict mode)

**Styling**:
- **Tailwind CSS 4** (Utility-first)
- **shadcn/ui** (Component library)
- **Lucide React** (Icons)

**Code Editor**:
- **Monaco Editor** (VS Code editor, lazy loaded)

**Parsing & Validation**:
- **js-yaml** (YAML parsing)
- **Zod** (Schema validation)

**Utilities**:
- **JSZip** (ZIP generation)
- **React Hook Form** (Form management)
- **Sonner** (Toast notifications)

**Storage**:
- **LocalStorage API** (Client-side persistence, 5MB limit)

**Deployment**:
- **Vercel** (Serverless, CDN, auto-scaling)

### Project Structure

```
ops.com/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── convert/           # Conversion page
│   ├── projects/          # Projects list
│   ├── templates/         # Templates library
│   └── docs/              # Documentation
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── FileUpload.tsx    # File upload with drag & drop
│   ├── YamlEditor.tsx    # Monaco editor wrapper
│   ├── ManifestPreview.tsx # Manifest tabs preview
│   └── ProjectList.tsx   # Projects management
├── lib/                   # Business logic
│   ├── parsers/          # Docker Compose parser
│   ├── converters/       # K8s, Swarm, Helm converters
│   │   └── proxyConfigs/ # Traefik, Nginx, Caddy
│   ├── storage/          # LocalStorage manager
│   ├── utils/            # Utilities
│   └── templates/        # Pre-built templates
├── types/                 # TypeScript types
└── public/                # Static assets
```

---

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Complete Vercel deployment guide
- **[LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)**: Pre-launch verification
- **[RESPONSIVE_DESIGN.md](RESPONSIVE_DESIGN.md)**: Mobile optimization
- **[ERROR_HANDLING.md](ERROR_HANDLING.md)**: Error management
- **[PERFORMANCE.md](PERFORMANCE.md)**: Performance optimization
- **[TESTING.md](TESTING.md)**: Testing documentation
- **[FINAL_TEST_REPORT.md](FINAL_TEST_REPORT.md)**: Test results
- **[CLAUDE.md](CLAUDE.md)**: Project reference (for Claude AI)

---

## 🧪 Testing

### Run Tests Locally

**Type Checking**:
```bash
npx tsc --noEmit
```

**Linting**:
```bash
npm run lint
```

**Build**:
```bash
npm run build
```

### Test Coverage

- ✅ TypeScript type checking
- ✅ ESLint validation
- ✅ Production build verification
- ✅ Page availability tests
- ⚠️ Manual testing required for full conversion flow

See **[FINAL_TEST_REPORT.md](FINAL_TEST_REPORT.md)** for detailed test results.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

#### Option 1: Vercel Dashboard

1. Push code to GitHub
2. Import repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Configure environment variables (optional)
4. Deploy

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Environment Variables

Create `.env.local` from `.env.local.example`:

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=false
NEXT_PUBLIC_MAX_STORAGE_MB=5
NEXT_PUBLIC_STORAGE_WARNING_THRESHOLD=80
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete deployment instructions.

---

## 🔧 Configuration

### Customize Resource Profiles

Edit `lib/converters/productionHardening.ts`:

```typescript
export const RESOURCE_PROFILES = {
  small: { cpu: '0.5', memory: '512Mi' },
  medium: { cpu: '1', memory: '1Gi' },
  large: { cpu: '2', memory: '2Gi' },
  // Add custom profile
  xlarge: { cpu: '4', memory: '4Gi' },
};
```

### Add New Templates

Create `lib/templates/your-template.json`:

```json
{
  "id": "your-template",
  "name": "Your Template",
  "description": "Description...",
  "dockerCompose": "version: '3.8'\nservices:\n  ..."
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Write clear commit messages
- Update documentation for new features
- Test locally before submitting PR

---

## 📝 Roadmap

### v1.0.0 (Current)
- ✅ Docker Compose parser
- ✅ Kubernetes converter
- ✅ Docker Swarm converter
- ✅ Helm Chart generator
- ✅ Traefik, Nginx, Caddy configs
- ✅ Production hardening
- ✅ LocalStorage persistence
- ✅ Responsive design

### v1.1.0 (Planned)
- ⬜ Docker Compose v3.9+ support
- ⬜ Secrets management (Kubernetes Secrets, Docker Swarm secrets)
- ⬜ Advanced YAML editor (diff viewer, syntax validation)
- ⬜ Project comparison
- ⬜ Export history
- ⬜ More templates (Django, Laravel, Spring Boot)

### v1.2.0 (Future)
- ⬜ Multi-file Docker Compose support
- ⬜ Custom resource templates
- ⬜ Terraform outputs
- ⬜ CI/CD pipeline generation
- ⬜ Cloud provider integrations (AWS EKS, GCP GKE, Azure AKS)

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Monaco Editor Not Loading

- Ensure `@monaco-editor/react` is installed
- Check browser console for errors
- Verify dynamic import with `ssr: false`

### LocalStorage Full

- Check storage usage in Projects page
- Delete old projects
- LocalStorage limit is 5-10MB (browser-dependent)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for more troubleshooting.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - Initial work - [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **shadcn** for the beautiful UI components
- **Monaco Editor** for the VS Code experience
- **Kubernetes** and **Docker** communities
- **Vercel** for free hosting

---

## 📞 Support

- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ops.com/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ops.com/discussions)

---

## ⭐ Star History

If you find this project helpful, please consider giving it a star on GitHub!

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**

**Ready to accelerate your DevOps workflows? [Try it now!](https://ops-accelerator.vercel.app)**
