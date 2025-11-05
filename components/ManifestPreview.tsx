'use client';

import { memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { YamlEditor } from './YamlEditor';

interface KubernetesManifests {
  deployments?: any[];
  services?: any[];
  configMaps?: any[];
  persistentVolumeClaims?: any[];
  ingresses?: any[];
}

interface ManifestPreviewProps {
  kubernetesYaml?: Record<string, string>;
  dockerStackYaml?: string;
  proxyConfig?: string;
  proxyType?: 'traefik' | 'nginx' | 'caddy' | 'none';
  helmChart?: {
    chartYaml?: string;
    valuesYaml?: string;
    templates?: Record<string, string>;
  };
}

export const ManifestPreview = memo(function ManifestPreview({
  kubernetesYaml,
  dockerStackYaml,
  proxyConfig,
  proxyType,
  helmChart,
}: ManifestPreviewProps) {
  const hasKubernetes = kubernetesYaml && Object.keys(kubernetesYaml).length > 0;
  const hasDockerStack = !!dockerStackYaml;
  const hasProxy = !!proxyConfig && proxyType && proxyType !== 'none';
  const hasHelm = !!helmChart && (helmChart.chartYaml || helmChart.valuesYaml);

  if (!hasKubernetes && !hasDockerStack && !hasProxy && !hasHelm) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">
          No manifests generated yet. Upload a Docker Compose file and click Convert to see the results.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Generated Manifests</h3>
          <p className="text-sm text-muted-foreground">
            Preview and download your production-ready configurations
          </p>
        </div>

        <Tabs defaultValue={hasKubernetes ? 'kubernetes' : hasDockerStack ? 'swarm' : hasHelm ? 'helm' : 'proxy'} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {hasKubernetes && (
              <TabsTrigger value="kubernetes" className="relative">
                Kubernetes
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(kubernetesYaml).length}
                </Badge>
              </TabsTrigger>
            )}
            {hasDockerStack && (
              <TabsTrigger value="swarm">
                Docker Swarm
              </TabsTrigger>
            )}
            {hasHelm && (
              <TabsTrigger value="helm" className="relative">
                Helm Chart
                <Badge variant="secondary" className="ml-2">
                  {(helmChart?.templates ? Object.keys(helmChart.templates).length : 0) + 2}
                </Badge>
              </TabsTrigger>
            )}
            {hasProxy && (
              <TabsTrigger value="proxy">
                {proxyType === 'traefik' && 'Traefik'}
                {proxyType === 'nginx' && 'Nginx'}
                {proxyType === 'caddy' && 'Caddy'}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Kubernetes Tab */}
          {hasKubernetes && (
            <TabsContent value="kubernetes" className="space-y-4">
              <Tabs defaultValue={Object.keys(kubernetesYaml)[0]} className="w-full">
                <TabsList className="w-full flex-wrap h-auto">
                  {Object.keys(kubernetesYaml).map((key) => (
                    <TabsTrigger key={key} value={key} className="text-xs">
                      {key}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(kubernetesYaml).map(([key, content]) => (
                  <TabsContent key={key} value={key}>
                    <YamlEditor
                      value={content}
                      readOnly
                      title={key}
                      fileName={key}
                      height="600px"
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          )}

          {/* Docker Swarm Tab */}
          {hasDockerStack && (
            <TabsContent value="swarm">
              <YamlEditor
                value={dockerStackYaml}
                readOnly
                title="Docker Stack Compose"
                fileName="docker-stack.yml"
                height="600px"
              />
            </TabsContent>
          )}

          {/* Helm Chart Tab */}
          {hasHelm && (
            <TabsContent value="helm" className="space-y-4">
              <Tabs defaultValue="chart" className="w-full">
                <TabsList>
                  <TabsTrigger value="chart">Chart.yaml</TabsTrigger>
                  <TabsTrigger value="values">values.yaml</TabsTrigger>
                  {helmChart?.templates && Object.keys(helmChart.templates).length > 0 && (
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="chart">
                  <YamlEditor
                    value={helmChart?.chartYaml || ''}
                    readOnly
                    title="Chart.yaml"
                    fileName="Chart.yaml"
                    height="600px"
                  />
                </TabsContent>

                <TabsContent value="values">
                  <YamlEditor
                    value={helmChart?.valuesYaml || ''}
                    readOnly
                    title="values.yaml"
                    fileName="values.yaml"
                    height="600px"
                  />
                </TabsContent>

                {helmChart?.templates && (
                  <TabsContent value="templates" className="space-y-4">
                    <Tabs defaultValue={Object.keys(helmChart.templates)[0]} className="w-full">
                      <TabsList className="w-full flex-wrap h-auto">
                        {Object.keys(helmChart.templates).map((key) => (
                          <TabsTrigger key={key} value={key} className="text-xs">
                            {key}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {Object.entries(helmChart.templates).map(([key, content]) => (
                        <TabsContent key={key} value={key}>
                          <YamlEditor
                            value={content}
                            readOnly
                            title={key}
                            fileName={key}
                            height="600px"
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </TabsContent>
                )}
              </Tabs>
            </TabsContent>
          )}

          {/* Proxy Tab */}
          {hasProxy && proxyConfig && (
            <TabsContent value="proxy">
              <YamlEditor
                value={proxyConfig}
                readOnly
                title={`${proxyType?.charAt(0).toUpperCase()}${proxyType?.slice(1)} Configuration`}
                fileName={
                  proxyType === 'nginx'
                    ? 'nginx.conf'
                    : proxyType === 'caddy'
                    ? 'Caddyfile'
                    : 'traefik.yml'
                }
                language={proxyType === 'nginx' ? 'nginx' : 'yaml'}
                height="600px"
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Card>
  );
});
