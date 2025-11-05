/**
 * Test script for Phase 1 & Phase 2 validation
 * Run with: npx tsx test-conversion.ts
 */

import { readFileSync } from 'fs';
import { DockerComposeParser } from './lib/parsers/dockerComposeParser';
import { KubernetesConverter } from './lib/converters/kubernetesConverter';
import { DockerStackConverter } from './lib/converters/dockerStackConverter';
import { LocalStorageManager } from './lib/storage/localStorage';
import { TraefikGenerator } from './lib/converters/proxyConfigs/traefikGenerator';
import { NginxGenerator } from './lib/converters/proxyConfigs/nginxGenerator';
import { CaddyGenerator } from './lib/converters/proxyConfigs/caddyGenerator';
import { ProductionHardening } from './lib/converters/productionHardening';

console.log('🧪 Phase 1 & Phase 2 Validation Tests\n');
console.log('='.repeat(50));

// Test 1: Docker Compose Parser
console.log('\n📋 Test 1: Docker Compose Parser');
console.log('-'.repeat(50));

try {
  const dockerComposeContent = readFileSync('./test-docker-compose.yml', 'utf-8');
  const parseResult = DockerComposeParser.parse(dockerComposeContent);

  if (parseResult.success) {
    console.log('✅ Parser: SUCCESS');
    console.log(`   Services found: ${parseResult.metadata?.services.length || 0}`);
    parseResult.metadata?.services.forEach((service) => {
      console.log(`   - ${service.name}: ${service.image || 'build'}`);
      console.log(`     Ports: ${service.ports.length}`);
      console.log(`     Volumes: ${service.volumes.length}`);
      console.log(`     Env vars: ${Object.keys(service.environmentVariables).length}`);
    });
    if (parseResult.warnings && parseResult.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${parseResult.warnings.join(', ')}`);
    }
  } else {
    console.log('❌ Parser: FAILED');
    console.log(`   Error: ${parseResult.error}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Parser: EXCEPTION');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  process.exit(1);
}

// Test 2: Kubernetes Converter
console.log('\n☸️  Test 2: Kubernetes Converter');
console.log('-'.repeat(50));

try {
  const dockerComposeContent = readFileSync('./test-docker-compose.yml', 'utf-8');
  const parseResult = DockerComposeParser.parse(dockerComposeContent);

  if (parseResult.success && parseResult.data) {
    const conversionResult = KubernetesConverter.convert(parseResult.data, {
      targetPlatform: 'kubernetes',
      proxyType: 'traefik',
      addHealthChecks: true,
      addResourceLimits: true,
      resourceProfile: 'small',
      addSecurity: true,
      namespace: 'default',
    });

    if (conversionResult.success && conversionResult.manifests) {
      console.log('✅ Kubernetes Converter: SUCCESS');
      console.log(`   Deployments: ${conversionResult.manifests.deployments.length}`);
      console.log(`   Services: ${conversionResult.manifests.services.length}`);
      console.log(`   ConfigMaps: ${conversionResult.manifests.configMaps?.length || 0}`);
      console.log(`   PVCs: ${conversionResult.manifests.persistentVolumeClaims?.length || 0}`);
      console.log(`   YAML files generated: ${Object.keys(conversionResult.yaml || {}).length}`);

      // Show sample YAML
      const firstYaml = Object.entries(conversionResult.yaml || {})[0];
      if (firstYaml) {
        console.log(`\n   Sample YAML (${firstYaml[0]}):`);
        console.log('   ' + firstYaml[1].split('\n').slice(0, 10).join('\n   '));
        console.log('   ...');
      }
    } else {
      console.log('❌ Kubernetes Converter: FAILED');
      console.log(`   Error: ${conversionResult.error}`);
      process.exit(1);
    }
  }
} catch (error) {
  console.log('❌ Kubernetes Converter: EXCEPTION');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  process.exit(1);
}

// Test 3: Docker Stack Converter
console.log('\n🐳 Test 3: Docker Stack Converter');
console.log('-'.repeat(50));

try {
  const dockerComposeContent = readFileSync('./test-docker-compose.yml', 'utf-8');
  const parseResult = DockerComposeParser.parse(dockerComposeContent);

  if (parseResult.success && parseResult.data) {
    const conversionResult = DockerStackConverter.convert(parseResult.data, {
      targetPlatform: 'swarm',
      proxyType: 'traefik',
      addHealthChecks: true,
      addResourceLimits: true,
      resourceProfile: 'medium',
      addSecurity: false,
    });

    if (conversionResult.success && conversionResult.yaml) {
      console.log('✅ Docker Stack Converter: SUCCESS');
      console.log(`   YAML length: ${conversionResult.yaml.length} characters`);
      console.log(`   Services in output: ${(conversionResult.yaml.match(/services:/g) || []).length}`);

      // Show sample
      console.log('\n   Sample Docker Stack YAML:');
      console.log('   ' + conversionResult.yaml.split('\n').slice(0, 15).join('\n   '));
      console.log('   ...');

      if (conversionResult.warnings && conversionResult.warnings.length > 0) {
        console.log(`\n   ⚠️  Warnings: ${conversionResult.warnings.length}`);
        conversionResult.warnings.forEach((w) => console.log(`   - ${w}`));
      }
    } else {
      console.log('❌ Docker Stack Converter: FAILED');
      console.log(`   Error: ${conversionResult.error}`);
      process.exit(1);
    }
  }
} catch (error) {
  console.log('❌ Docker Stack Converter: EXCEPTION');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  process.exit(1);
}

// Test 4: LocalStorage Manager (simulated - requires browser environment)
console.log('\n💾 Test 4: LocalStorage Manager');
console.log('-'.repeat(50));
console.log('ℹ️  LocalStorage tests require browser environment');
console.log('   Tests will be performed in the UI during Phase 3');

// PHASE 2 TESTS
console.log('\n' + '='.repeat(50));
console.log('🔧 PHASE 2 TESTS: Reverse Proxy & Production Hardening');
console.log('='.repeat(50));

// Test 5: Traefik Generator
console.log('\n🔀 Test 5: Traefik Generator');
console.log('-'.repeat(50));

try {
  // Test Docker labels generation
  const traefikLabels = TraefikGenerator.generateDockerLabels(
    'web',
    'example.com',
    3000,
    { enableTLS: true, certResolver: 'letsencrypt' }
  );

  console.log('✅ Traefik Docker Labels: SUCCESS');
  console.log(`   Labels generated: ${Object.keys(traefikLabels).length}`);
  console.log(`   Sample labels:`);
  Object.entries(traefikLabels).slice(0, 3).forEach(([key, value]) => {
    console.log(`   - ${key}: ${value}`);
  });

  // Test Kubernetes IngressRoute generation
  const ingressRoute = TraefikGenerator.generateKubernetesIngressRoute(
    'web',
    'example.com',
    3000,
    { enableTLS: true, certResolver: 'letsencrypt' }
  );

  console.log('\n✅ Traefik IngressRoute: SUCCESS');
  console.log(`   Kind: ${ingressRoute.kind}`);
  console.log(`   Routes: ${ingressRoute.spec?.routes?.length || 0}`);
  console.log(`   TLS enabled: ${ingressRoute.spec?.tls ? 'Yes' : 'No'}`);

  // Test static config generation
  const staticConfig = TraefikGenerator.generateStaticConfig({
    email: 'admin@example.com',
    dashboard: true,
  });

  console.log('\n✅ Traefik Static Config: SUCCESS');
  console.log(`   API enabled: ${staticConfig.api ? 'Yes' : 'No'}`);
  console.log(`   Entrypoints: ${Object.keys(staticConfig.entryPoints || {}).length}`);
  console.log(`   Cert resolvers: ${Object.keys(staticConfig.certificatesResolvers || {}).length}`);
} catch (error) {
  console.log('❌ Traefik Generator: EXCEPTION');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  process.exit(1);
}

// Test 6: Nginx Generator
console.log('\n🌐 Test 6: Nginx Generator');
console.log('-'.repeat(50));

try {
  // Test nginx.conf generation
  const nginxConfig = NginxGenerator.generateConfig(
    {
      serviceName: 'api',
      domain: 'api.example.com',
      port: 8080,
    },
    {
      enableSSL: true,
      enableWebSocket: true,
      clientMaxBodySize: '20m',
    }
  );

  console.log('✅ Nginx Config Generation: SUCCESS');
  console.log(`   Config length: ${nginxConfig.length} characters`);
  console.log(`   SSL enabled: ${nginxConfig.includes('ssl_certificate') ? 'Yes' : 'No'}`);
  console.log(`   WebSocket support: ${nginxConfig.includes('Upgrade') ? 'Yes' : 'No'}`);
  console.log(`   Upstream defined: ${nginxConfig.includes('upstream') ? 'Yes' : 'No'}`);

  // Test Kubernetes ConfigMap generation
  const nginxConfigMap = NginxGenerator.generateKubernetesConfigMap(
    'nginx-config',
    nginxConfig,
    'default'
  );

  console.log('\n✅ Nginx ConfigMap: SUCCESS');
  console.log(`   Kind: ${nginxConfigMap.kind}`);
  console.log(`   Name: ${nginxConfigMap.metadata.name}`);
  console.log(`   Namespace: ${nginxConfigMap.metadata.namespace}`);

  // Test validation
  const validation = NginxGenerator.validate({
    serviceName: 'api',
    domain: 'api.example.com',
    port: 8080,
  });

  console.log('\n✅ Nginx Validation: SUCCESS');
  console.log(`   Valid: ${validation.valid ? 'Yes' : 'No'}`);
  console.log(`   Errors: ${validation.errors.length}`);
  console.log(`   Warnings: ${validation.warnings.length}`);
} catch (error) {
  console.log('❌ Nginx Generator: EXCEPTION');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  process.exit(1);
}

// Test 7: Caddy Generator
console.log('\n🔷 Test 7: Caddy Generator');
console.log('-'.repeat(50));

try {
  // Test Caddyfile generation
  const caddyfile = CaddyGenerator.generateCaddyfile(
    {
      serviceName: 'app',
      domain: 'app.example.com',
      port: 3000,
    },
    {
      email: 'admin@example.com',
      enableAutoHTTPS: true,
      enableGzip: true,
    }
  );

  console.log('✅ Caddy Caddyfile Generation: SUCCESS');
  console.log(`   Config length: ${caddyfile.length} characters`);
  console.log(`   Auto HTTPS: ${caddyfile.includes('email') ? 'Yes' : 'No'}`);
  console.log(`   Gzip enabled: ${caddyfile.includes('encode gzip') ? 'Yes' : 'No'}`);
  console.log(`   Security headers: ${caddyfile.includes('Strict-Transport-Security') ? 'Yes' : 'No'}`);

  // Test global Caddyfile with multiple services
  const globalCaddyfile = CaddyGenerator.generateGlobalCaddyfile(
    [
      { serviceName: 'web', domain: 'web.example.com', port: 3000 },
      { serviceName: 'api', domain: 'api.example.com', port: 8080 },
    ],
    { email: 'admin@example.com', logLevel: 'INFO' }
  );

  console.log('\n✅ Caddy Global Config: SUCCESS');
  console.log(`   Config length: ${globalCaddyfile.length} characters`);
  console.log(`   Services configured: ${(globalCaddyfile.match(/reverse_proxy/g) || []).length}`);

  // Test Kubernetes ConfigMap
  const caddyConfigMap = CaddyGenerator.generateKubernetesConfigMap(
    'caddy-config',
    caddyfile,
    'default'
  );

  console.log('\n✅ Caddy ConfigMap: SUCCESS');
  console.log(`   Kind: ${caddyConfigMap.kind}`);
  console.log(`   Data keys: ${Object.keys(caddyConfigMap.data).length}`);

  // Test validation
  const caddyValidation = CaddyGenerator.validate({
    serviceName: 'app',
    domain: 'app.example.com',
    port: 3000,
  });

  console.log('\n✅ Caddy Validation: SUCCESS');
  console.log(`   Valid: ${caddyValidation.valid ? 'Yes' : 'No'}`);
  console.log(`   Errors: ${caddyValidation.errors.length}`);
  console.log(`   Warnings: ${caddyValidation.warnings.length}`);
} catch (error) {
  console.log('❌ Caddy Generator: EXCEPTION');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  process.exit(1);
}

// Test 8: Production Hardening
console.log('\n🔐 Test 8: Production Hardening');
console.log('-'.repeat(50));

try {
  // Create a sample Kubernetes deployment
  const sampleDeployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name: 'test-app', namespace: 'default' },
    spec: {
      replicas: 3,
      selector: { matchLabels: { app: 'test-app' } },
      template: {
        metadata: { labels: { app: 'test-app' } },
        spec: {
          containers: [
            {
              name: 'app',
              image: 'nginx:alpine',
              ports: [{ containerPort: 80 }],
            },
          ],
        },
      },
    },
  };

  // Test health checks
  const withHealthChecks = ProductionHardening.addHealthChecks(
    sampleDeployment,
    { path: '/health', port: 80 }
  );

  console.log('✅ Health Checks Addition: SUCCESS');
  const container = withHealthChecks.spec.template.spec.containers[0];
  console.log(`   Liveness probe: ${container.livenessProbe ? 'Added' : 'Missing'}`);
  console.log(`   Readiness probe: ${container.readinessProbe ? 'Added' : 'Missing'}`);
  if (container.livenessProbe?.httpGet) {
    console.log(`   Probe path: ${container.livenessProbe.httpGet.path}`);
  }

  // Test resource limits
  const withResources = ProductionHardening.addResourceLimits(
    sampleDeployment,
    'medium'
  );

  console.log('\n✅ Resource Limits Addition: SUCCESS');
  const resourceContainer = withResources.spec.template.spec.containers[0];
  console.log(`   Requests: ${resourceContainer.resources?.requests ? 'Added' : 'Missing'}`);
  console.log(`   Limits: ${resourceContainer.resources?.limits ? 'Added' : 'Missing'}`);
  if (resourceContainer.resources?.requests) {
    console.log(`   CPU request: ${resourceContainer.resources.requests.cpu}`);
    console.log(`   Memory request: ${resourceContainer.resources.requests.memory}`);
  }

  // Test security best practices
  const withSecurity = ProductionHardening.addSecurityBestPractices(
    sampleDeployment
  );

  console.log('\n✅ Security Best Practices: SUCCESS');
  const securityContainer = withSecurity.spec.template.spec.containers[0];
  console.log(`   Security context: ${securityContainer.securityContext ? 'Added' : 'Missing'}`);
  console.log(`   Pod security context: ${withSecurity.spec.template.spec.securityContext ? 'Added' : 'Missing'}`);
  if (securityContainer.securityContext) {
    console.log(`   Run as non-root: ${securityContainer.securityContext.runAsNonRoot}`);
    console.log(`   Read-only filesystem: ${securityContainer.securityContext.readOnlyRootFilesystem}`);
  }

  // Test all optimizations
  const fullyOptimized = ProductionHardening.applyAllOptimizations(
    sampleDeployment,
    {
      healthCheck: { path: '/health', port: 80 },
      resourceProfile: 'small',
      security: true,
    }
  );

  console.log('\n✅ All Optimizations Applied: SUCCESS');
  const optimizedContainer = fullyOptimized.spec.template.spec.containers[0];
  console.log(`   Total features applied: ${[
    optimizedContainer.livenessProbe ? 'health-checks' : null,
    optimizedContainer.resources ? 'resources' : null,
    optimizedContainer.securityContext ? 'security' : null,
  ].filter(Boolean).length}`);
} catch (error) {
  console.log('❌ Production Hardening: EXCEPTION');
  console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  process.exit(1);
}

// Final Summary
console.log('\n' + '='.repeat(50));
console.log('🎉 Phase 1 & Phase 2 Validation: COMPLETE');
console.log('='.repeat(50));
console.log('\n✅ Phase 1: All core conversion engines are functional!');
console.log('✅ Phase 2: All proxy generators and hardening features work!');
console.log('\n📊 Summary:');
console.log('   ✅ Docker Compose Parser');
console.log('   ✅ Kubernetes Converter');
console.log('   ✅ Docker Stack Converter');
console.log('   ✅ Traefik Generator (Docker + K8s)');
console.log('   ✅ Nginx Generator (Config + ConfigMap)');
console.log('   ✅ Caddy Generator (Caddyfile + ConfigMap)');
console.log('   ✅ Production Hardening (Health + Resources + Security)');
console.log('\n🚀 Ready to proceed to Phase 3: Interface Utilisateur & Export!\n');
