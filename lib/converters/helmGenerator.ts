import * as yaml from 'js-yaml';
import { DockerCompose, DockerComposeService } from '@/types/dockerCompose';

/**
 * Helm Chart Generator
 * Generates Helm v3 Charts with best practices
 */
export class HelmGenerator {
  /**
   * Generate complete Helm Chart
   */
  static generateHelmChart(
    projectName: string,
    dockerCompose: DockerCompose,
    options: {
      version?: string;
      appVersion?: string;
      description?: string;
      namespace?: string;
    } = {}
  ): {
    chartYaml: string;
    valuesYaml: string;
    templates: Record<string, string>;
  } {
    const chartName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const version = options.version || '0.1.0';
    const appVersion = options.appVersion || '1.0.0';
    const description = options.description || `Helm chart for ${projectName}`;

    // Generate Chart.yaml
    const chartYaml = this.generateChart(chartName, version, appVersion, description);

    // Generate values.yaml
    const valuesYaml = this.generateValues(dockerCompose);

    // Generate templates
    const templates = this.generateTemplates(dockerCompose, chartName);

    return {
      chartYaml,
      valuesYaml,
      templates,
    };
  }

  /**
   * Generate Chart.yaml
   */
  static generateChart(
    name: string,
    version: string,
    appVersion: string,
    description: string
  ): string {
    const chart = {
      apiVersion: 'v2',
      name,
      description,
      type: 'application',
      version,
      appVersion,
      keywords: ['docker-compose', 'kubernetes', 'deployment'],
      maintainers: [
        {
          name: 'DevOps Team',
          email: 'devops@example.com',
        },
      ],
    };

    return yaml.dump(chart, { indent: 2, lineWidth: -1 });
  }

  /**
   * Generate values.yaml
   */
  static generateValues(dockerCompose: DockerCompose): string {
    const services = Object.entries(dockerCompose.services);
    const values: any = {};

    services.forEach(([serviceName, service]) => {
      const cleanName = serviceName.replace(/[^a-zA-Z0-9]/g, '');

      values[cleanName] = {
        enabled: true,
        replicaCount: service.deploy?.replicas || 1,

        image: {
          repository: service.image?.split(':')[0] || 'nginx',
          tag: service.image?.split(':')[1] || 'latest',
          pullPolicy: 'IfNotPresent',
        },

        service: {
          type: 'ClusterIP',
          port: service.ports && service.ports.length > 0
            ? (typeof service.ports[0] === 'string'
              ? parseInt(service.ports[0].split(':')[1] || service.ports[0])
              : service.ports[0])
            : 80,
        },

        resources: {
          requests: {
            cpu: '100m',
            memory: '128Mi',
          },
          limits: {
            cpu: '500m',
            memory: '512Mi',
          },
        },

        autoscaling: {
          enabled: false,
          minReplicas: 1,
          maxReplicas: 10,
          targetCPUUtilizationPercentage: 80,
        },

        ingress: {
          enabled: false,
          className: 'nginx',
          annotations: {},
          hosts: [
            {
              host: `${serviceName}.example.com`,
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                },
              ],
            },
          ],
          tls: [],
        },
      };

      // Add environment variables if present
      if (service.environment) {
        const env: Record<string, any> = {};
        if (Array.isArray(service.environment)) {
          service.environment.forEach((envStr: string) => {
            const [key, value] = envStr.split('=');
            env[key] = value || '';
          });
        } else {
          Object.assign(env, service.environment);
        }
        values[cleanName].env = env;
      }
    });

    // Global values
    values.global = {
      storageClass: 'standard',
    };

    return yaml.dump(values, { indent: 2, lineWidth: -1 });
  }

  /**
   * Generate Helm templates
   */
  static generateTemplates(
    dockerCompose: DockerCompose,
    chartName: string
  ): Record<string, string> {
    const templates: Record<string, string> = {};

    // _helpers.tpl
    templates['_helpers.tpl'] = this.generateHelpers(chartName);

    // NOTES.txt
    templates['NOTES.txt'] = this.generateNotes(chartName, dockerCompose);

    // Generate templates for each service
    Object.keys(dockerCompose.services).forEach((serviceName) => {
      const cleanName = serviceName.replace(/[^a-zA-Z0-9]/g, '');

      // Deployment
      templates[`${serviceName}-deployment.yaml`] = this.generateDeploymentTemplate(
        serviceName,
        cleanName
      );

      // Service
      if (dockerCompose.services[serviceName].ports?.length) {
        templates[`${serviceName}-service.yaml`] = this.generateServiceTemplate(
          serviceName,
          cleanName
        );
      }

      // Ingress
      templates[`${serviceName}-ingress.yaml`] = this.generateIngressTemplate(
        serviceName,
        cleanName
      );
    });

    return templates;
  }

  /**
   * Generate _helpers.tpl
   */
  private static generateHelpers(chartName: string): string {
    return `{{/*
Expand the name of the chart.
*/}}
{{- define "${chartName}.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "${chartName}.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "${chartName}.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "${chartName}.labels" -}}
helm.sh/chart: {{ include "${chartName}.chart" . }}
{{ include "${chartName}.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "${chartName}.selectorLabels" -}}
app.kubernetes.io/name: {{ include "${chartName}.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
`;
  }

  /**
   * Generate NOTES.txt
   */
  private static generateNotes(chartName: string, dockerCompose: DockerCompose): string {
    const services = Object.keys(dockerCompose.services);

    let notes = `Thank you for installing {{ .Chart.Name }}!

Your release is named {{ .Release.Name }}.

To learn more about the release, try:

  $ helm status {{ .Release.Name }}
  $ helm get all {{ .Release.Name }}

`;

    notes += `Services deployed:\n`;
    services.forEach((service) => {
      notes += `  - ${service}\n`;
    });

    notes += `\nTo access your services:\n\n`;
    services.forEach((service) => {
      const cleanName = service.replace(/[^a-zA-Z0-9]/g, '');
      notes += `{{- if .Values.${cleanName}.ingress.enabled }}
  Service ${service}:
    {{- range .Values.${cleanName}.ingress.hosts }}
    http{{ if $.Values.${cleanName}.ingress.tls }}s{{ end }}://{{ .host }}
    {{- end }}
{{- else }}
  Service ${service}:
    kubectl port-forward service/{{ include "${chartName}.fullname" . }}-${service} {{ if index .Values "${cleanName}" }}{{ .Values.${cleanName}.service.port }}{{ else }}80{{ end }}:{{ if index .Values "${cleanName}" }}{{ .Values.${cleanName}.service.port }}{{ else }}80{{ end }}
{{- end }}

`;
    });

    return notes;
  }

  /**
   * Generate Deployment template
   */
  private static generateDeploymentTemplate(serviceName: string, cleanName: string): string {
    return `{{- if .Values.${cleanName}.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "${cleanName}.fullname" . }}-${serviceName}
  labels:
    {{- include "${cleanName}.labels" . | nindent 4 }}
    app.kubernetes.io/component: ${serviceName}
spec:
  {{- if not .Values.${cleanName}.autoscaling.enabled }}
  replicas: {{ .Values.${cleanName}.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "${cleanName}.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: ${serviceName}
  template:
    metadata:
      labels:
        {{- include "${cleanName}.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: ${serviceName}
    spec:
      containers:
      - name: ${serviceName}
        image: "{{ .Values.${cleanName}.image.repository }}:{{ .Values.${cleanName}.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.${cleanName}.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.${cleanName}.service.port }}
          protocol: TCP
        {{- if .Values.${cleanName}.env }}
        env:
        {{- range $key, $value := .Values.${cleanName}.env }}
        - name: {{ $key }}
          value: {{ $value | quote }}
        {{- end }}
        {{- end }}
        resources:
          {{- toYaml .Values.${cleanName}.resources | nindent 10 }}
{{- end }}
`;
  }

  /**
   * Generate Service template
   */
  private static generateServiceTemplate(serviceName: string, cleanName: string): string {
    return `{{- if .Values.${cleanName}.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "${cleanName}.fullname" . }}-${serviceName}
  labels:
    {{- include "${cleanName}.labels" . | nindent 4 }}
    app.kubernetes.io/component: ${serviceName}
spec:
  type: {{ .Values.${cleanName}.service.type }}
  ports:
  - port: {{ .Values.${cleanName}.service.port }}
    targetPort: http
    protocol: TCP
    name: http
  selector:
    {{- include "${cleanName}.selectorLabels" . | nindent 4 }}
    app.kubernetes.io/component: ${serviceName}
{{- end }}
`;
  }

  /**
   * Generate Ingress template
   */
  private static generateIngressTemplate(serviceName: string, cleanName: string): string {
    return `{{- if and .Values.${cleanName}.enabled .Values.${cleanName}.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "${cleanName}.fullname" . }}-${serviceName}
  labels:
    {{- include "${cleanName}.labels" . | nindent 4 }}
    app.kubernetes.io/component: ${serviceName}
  {{- with .Values.${cleanName}.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.${cleanName}.ingress.className }}
  ingressClassName: {{ .Values.${cleanName}.ingress.className }}
  {{- end }}
  {{- if .Values.${cleanName}.ingress.tls }}
  tls:
    {{- range .Values.${cleanName}.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.${cleanName}.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "${cleanName}.fullname" $ }}-${serviceName}
                port:
                  number: {{ $.Values.${cleanName}.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
`;
  }

  /**
   * Validate Helm Chart (simulation of helm lint)
   */
  static validateHelmChart(chart: { chartYaml: string; valuesYaml: string; templates: Record<string, string> }): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate Chart.yaml
      const chartObj = yaml.load(chart.chartYaml) as any;
      if (!chartObj.apiVersion) errors.push('Chart.yaml: apiVersion is required');
      if (!chartObj.name) errors.push('Chart.yaml: name is required');
      if (!chartObj.version) errors.push('Chart.yaml: version is required');
      if (chartObj.apiVersion !== 'v2') warnings.push('Chart.yaml: apiVersion should be v2 for Helm 3');

      // Validate values.yaml
      yaml.load(chart.valuesYaml);

      // Validate templates
      Object.entries(chart.templates).forEach(([filename, content]) => {
        if (!content || content.trim() === '') {
          warnings.push(`Template ${filename} is empty`);
        }
      });

      // Check for required templates
      const hasDeployment = Object.keys(chart.templates).some(k => k.includes('deployment'));
      if (!hasDeployment) {
        warnings.push('No deployment template found');
      }

      const hasHelpers = '_helpers.tpl' in chart.templates;
      if (!hasHelpers) {
        warnings.push('_helpers.tpl not found - recommended for label management');
      }

    } catch (error) {
      errors.push(`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Apply Helm best practices
   */
  static applyHelmBestPractices(chartName: string): {
    labels: Record<string, string>;
    annotations: Record<string, string>;
  } {
    return {
      labels: {
        'app.kubernetes.io/name': chartName,
        'app.kubernetes.io/instance': '{{ .Release.Name }}',
        'app.kubernetes.io/version': '{{ .Chart.AppVersion }}',
        'app.kubernetes.io/managed-by': '{{ .Release.Service }}',
        'helm.sh/chart': '{{ include "chart" . }}',
      },
      annotations: {
        'meta.helm.sh/release-name': '{{ .Release.Name }}',
        'meta.helm.sh/release-namespace': '{{ .Release.Namespace }}',
      },
    };
  }
}
