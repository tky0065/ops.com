import JSZip from 'jszip';
import { DocumentationGenerator } from './documentationGenerator';
import { DockerCompose } from '@/types/dockerCompose';
import { ConversionOptions } from '@/types/project';

/**
 * Export Utilities
 * Creates ZIP archives with generated configurations
 */
export class ExportUtils {
  /**
   * Create a ZIP archive with all generated files
   */
  static async createZipArchive(
    projectName: string,
    dockerCompose: DockerCompose,
    options: ConversionOptions,
    manifests: {
      kubernetesYaml?: Record<string, string>;
      dockerStackYaml?: string;
      proxyConfig?: string;
      proxyType?: string;
      helmChart?: {
        chartYaml?: string;
        valuesYaml?: string;
        templates?: Record<string, string>;
      };
    }
  ): Promise<Blob> {
    const zip = new JSZip();

    // Generate README.md
    const readme = DocumentationGenerator.generateREADME(
      projectName,
      dockerCompose,
      options
    );
    zip.file('README.md', readme);

    // Generate .env.example
    const envExample = DocumentationGenerator.generateEnvExample(dockerCompose);
    zip.file('.env.example', envExample);

    // Add Kubernetes manifests
    if (manifests.kubernetesYaml && Object.keys(manifests.kubernetesYaml).length > 0) {
      const k8sFolder = zip.folder('kubernetes');
      if (k8sFolder) {
        // Organize by type
        const deployments = k8sFolder.folder('deployments');
        const services = k8sFolder.folder('services');
        const configmaps = k8sFolder.folder('configmaps');
        const pvcs = k8sFolder.folder('pvcs');
        const ingress = k8sFolder.folder('ingress');

        Object.entries(manifests.kubernetesYaml).forEach(([filename, content]) => {
          if (filename.startsWith('deployment-')) {
            deployments?.file(filename, content);
          } else if (filename.startsWith('service-')) {
            services?.file(filename, content);
          } else if (filename.startsWith('configmap-')) {
            configmaps?.file(filename, content);
          } else if (filename.startsWith('pvc-')) {
            pvcs?.file(filename, content);
          } else if (filename.startsWith('ingress-') || filename.includes('ingressroute')) {
            ingress?.file(filename, content);
          } else {
            // Fallback: add to root kubernetes folder
            k8sFolder.file(filename, content);
          }
        });
      }
    }

    // Add Docker Stack manifest
    if (manifests.dockerStackYaml) {
      const swarmFolder = zip.folder('swarm');
      swarmFolder?.file('docker-stack.yml', manifests.dockerStackYaml);
    }

    // Add Proxy configuration
    if (manifests.proxyConfig && manifests.proxyType && manifests.proxyType !== 'none') {
      const proxyFolder = zip.folder('proxy');
      const filename =
        manifests.proxyType === 'nginx'
          ? 'nginx.conf'
          : manifests.proxyType === 'caddy'
          ? 'Caddyfile'
          : 'traefik.yml';

      proxyFolder?.file(filename, manifests.proxyConfig);

      // Add proxy README
      const proxyReadme = this.generateProxyREADME(manifests.proxyType);
      proxyFolder?.file('README.md', proxyReadme);
    }

    // Add Helm Chart
    if (manifests.helmChart) {
      const helmFolder = zip.folder('helm');
      const chartFolder = helmFolder?.folder(projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'));

      if (chartFolder && manifests.helmChart.chartYaml) {
        chartFolder.file('Chart.yaml', manifests.helmChart.chartYaml);
      }

      if (chartFolder && manifests.helmChart.valuesYaml) {
        chartFolder.file('values.yaml', manifests.helmChart.valuesYaml);
      }

      if (chartFolder && manifests.helmChart.templates) {
        const templatesFolder = chartFolder.folder('templates');
        Object.entries(manifests.helmChart.templates).forEach(([filename, content]) => {
          templatesFolder?.file(filename, content);
        });
      }
    }

    // Generate the ZIP file
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9,
      },
    });

    return blob;
  }

  /**
   * Download ZIP file
   */
  static downloadZip(blob: Blob, projectName: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${projectName}-${timestamp}.zip`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate proxy-specific README
   */
  private static generateProxyREADME(proxyType: string): string {
    const proxyName = proxyType.charAt(0).toUpperCase() + proxyType.slice(1);

    let readme = `# ${proxyName} Configuration\n\n`;

    switch (proxyType) {
      case 'traefik':
        readme += `## Using with Docker Compose\n\n`;
        readme += `Add the Traefik service to your docker-compose.yml:\n\n`;
        readme += `\`\`\`yaml\n`;
        readme += `services:\n`;
        readme += `  traefik:\n`;
        readme += `    image: traefik:v2.10\n`;
        readme += `    ports:\n`;
        readme += `      - "80:80"\n`;
        readme += `      - "443:443"\n`;
        readme += `      - "8080:8080"  # Dashboard\n`;
        readme += `    volumes:\n`;
        readme += `      - /var/run/docker.sock:/var/run/docker.sock:ro\n`;
        readme += `      - ./traefik.yml:/etc/traefik/traefik.yml:ro\n`;
        readme += `\`\`\`\n\n`;
        readme += `## Dashboard\n\n`;
        readme += `Access the Traefik dashboard at: http://localhost:8080\n\n`;
        break;

      case 'nginx':
        readme += `## Using with Docker Compose\n\n`;
        readme += `Add the Nginx service:\n\n`;
        readme += `\`\`\`yaml\n`;
        readme += `services:\n`;
        readme += `  nginx:\n`;
        readme += `    image: nginx:alpine\n`;
        readme += `    ports:\n`;
        readme += `      - "80:80"\n`;
        readme += `      - "443:443"\n`;
        readme += `    volumes:\n`;
        readme += `      - ./nginx.conf:/etc/nginx/nginx.conf:ro\n`;
        readme += `\`\`\`\n\n`;
        readme += `## SSL Certificates\n\n`;
        readme += `Place your SSL certificates in \`./ssl/\` and update the nginx.conf paths.\n\n`;
        break;

      case 'caddy':
        readme += `## Using with Docker Compose\n\n`;
        readme += `Add the Caddy service:\n\n`;
        readme += `\`\`\`yaml\n`;
        readme += `services:\n`;
        readme += `  caddy:\n`;
        readme += `    image: caddy:2-alpine\n`;
        readme += `    ports:\n`;
        readme += `      - "80:80"\n`;
        readme += `      - "443:443"\n`;
        readme += `    volumes:\n`;
        readme += `      - ./Caddyfile:/etc/caddy/Caddyfile:ro\n`;
        readme += `      - caddy_data:/data\n`;
        readme += `      - caddy_config:/config\n`;
        readme += `\`\`\`\n\n`;
        readme += `## Automatic HTTPS\n\n`;
        readme += `Caddy automatically handles SSL certificates via Let's Encrypt.\n\n`;
        break;
    }

    readme += `For more information, refer to the main README.md in the project root.\n`;

    return readme;
  }

  /**
   * Validate ZIP size (should be under 50MB for browser downloads)
   */
  static validateZipSize(blob: Blob): { valid: boolean; sizeMB: number; warning?: string } {
    const sizeMB = blob.size / (1024 * 1024);

    if (sizeMB > 50) {
      return {
        valid: false,
        sizeMB,
        warning: 'ZIP file is larger than 50MB. This may cause download issues.',
      };
    }

    if (sizeMB > 10) {
      return {
        valid: true,
        sizeMB,
        warning: 'ZIP file is larger than 10MB. Download may take some time.',
      };
    }

    return {
      valid: true,
      sizeMB,
    };
  }
}
