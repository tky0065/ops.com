/**
 * Docker Compose v3.x JSON Schema for Monaco Editor
 *
 * This schema enables auto-completion and validation for Docker Compose YAML files
 */

export const dockerComposeSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Docker Compose Configuration',
  type: 'object',
  properties: {
    version: {
      type: 'string',
      description: 'Compose file format version',
      enum: ['3', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9'],
      default: '3.8',
    },
    services: {
      type: 'object',
      description: 'Service definitions',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/service',
        },
      },
    },
    networks: {
      type: 'object',
      description: 'Network definitions',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/network',
        },
      },
    },
    volumes: {
      type: 'object',
      description: 'Volume definitions',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/volume',
        },
      },
    },
    configs: {
      type: 'object',
      description: 'Config definitions',
    },
    secrets: {
      type: 'object',
      description: 'Secret definitions',
    },
  },
  definitions: {
    service: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: 'Docker image to use (e.g., nginx:latest)',
        },
        build: {
          oneOf: [
            { type: 'string', description: 'Path to build context' },
            { $ref: '#/definitions/build' },
          ],
        },
        container_name: {
          type: 'string',
          description: 'Custom container name',
        },
        ports: {
          type: 'array',
          description: 'Port mappings',
          items: {
            oneOf: [
              { type: 'string', pattern: '^\\d+:\\d+$' },
              { type: 'number' },
              { $ref: '#/definitions/port' },
            ],
          },
        },
        expose: {
          type: 'array',
          description: 'Expose ports without publishing them',
          items: {
            oneOf: [{ type: 'string' }, { type: 'number' }],
          },
        },
        environment: {
          oneOf: [
            {
              type: 'array',
              items: { type: 'string' },
            },
            {
              type: 'object',
              additionalProperties: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }] },
            },
          ],
          description: 'Environment variables',
        },
        env_file: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          description: 'Path to env file(s)',
        },
        volumes: {
          type: 'array',
          description: 'Volume mounts',
          items: {
            oneOf: [
              { type: 'string' },
              { $ref: '#/definitions/volumeMount' },
            ],
          },
        },
        depends_on: {
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'object', additionalProperties: { $ref: '#/definitions/dependency' } },
          ],
          description: 'Service dependencies',
        },
        command: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          description: 'Override default command',
        },
        entrypoint: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          description: 'Override default entrypoint',
        },
        restart: {
          type: 'string',
          enum: ['no', 'always', 'on-failure', 'unless-stopped'],
          description: 'Restart policy',
          default: 'unless-stopped',
        },
        networks: {
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            {
              type: 'object',
              additionalProperties: { $ref: '#/definitions/networkConfig' },
            },
          ],
          description: 'Networks to attach',
        },
        labels: {
          type: 'object',
          description: 'Metadata labels',
          additionalProperties: { type: 'string' },
        },
        healthcheck: {
          $ref: '#/definitions/healthcheck',
          description: 'Container health check',
        },
        deploy: {
          $ref: '#/definitions/deploy',
          description: 'Deploy configuration (Swarm mode)',
        },
        logging: {
          $ref: '#/definitions/logging',
          description: 'Logging configuration',
        },
        working_dir: {
          type: 'string',
          description: 'Working directory inside container',
        },
        user: {
          type: 'string',
          description: 'User to run as (uid:gid or username)',
        },
        hostname: {
          type: 'string',
          description: 'Container hostname',
        },
        domainname: {
          type: 'string',
          description: 'Container domain name',
        },
        mac_address: {
          type: 'string',
          description: 'Container MAC address',
        },
        privileged: {
          type: 'boolean',
          description: 'Run in privileged mode',
        },
        stdin_open: {
          type: 'boolean',
          description: 'Keep STDIN open',
        },
        tty: {
          type: 'boolean',
          description: 'Allocate pseudo-TTY',
        },
      },
    },
    build: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Build context path',
        },
        dockerfile: {
          type: 'string',
          description: 'Alternate Dockerfile',
        },
        args: {
          type: 'object',
          description: 'Build arguments',
          additionalProperties: { type: 'string' },
        },
        target: {
          type: 'string',
          description: 'Build target stage',
        },
        cache_from: {
          type: 'array',
          items: { type: 'string' },
          description: 'Images for cache resolution',
        },
      },
    },
    port: {
      type: 'object',
      properties: {
        target: { type: 'number', description: 'Container port' },
        published: { type: 'number', description: 'Host port' },
        protocol: {
          type: 'string',
          enum: ['tcp', 'udp'],
          default: 'tcp',
        },
        mode: {
          type: 'string',
          enum: ['host', 'ingress'],
          description: 'Swarm port mode',
        },
      },
      required: ['target'],
    },
    volumeMount: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['volume', 'bind', 'tmpfs'],
        },
        source: { type: 'string' },
        target: { type: 'string' },
        read_only: { type: 'boolean' },
      },
      required: ['type', 'target'],
    },
    dependency: {
      type: 'object',
      properties: {
        condition: {
          type: 'string',
          enum: ['service_started', 'service_healthy', 'service_completed_successfully'],
        },
      },
    },
    networkConfig: {
      type: 'object',
      properties: {
        aliases: {
          type: 'array',
          items: { type: 'string' },
        },
        ipv4_address: { type: 'string' },
        ipv6_address: { type: 'string' },
      },
    },
    healthcheck: {
      type: 'object',
      properties: {
        test: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          description: 'Health check command',
        },
        interval: {
          type: 'string',
          description: 'Time between checks (e.g., 30s)',
        },
        timeout: {
          type: 'string',
          description: 'Time to wait for check (e.g., 10s)',
        },
        retries: {
          type: 'number',
          description: 'Consecutive failures to be unhealthy',
        },
        start_period: {
          type: 'string',
          description: 'Grace period before checks start',
        },
      },
    },
    deploy: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['replicated', 'global'],
          description: 'Service mode',
        },
        replicas: {
          type: 'number',
          description: 'Number of replicas',
          minimum: 0,
        },
        placement: {
          type: 'object',
          properties: {
            constraints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Placement constraints',
            },
            preferences: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
        resources: {
          type: 'object',
          properties: {
            limits: {
              type: 'object',
              properties: {
                cpus: { type: 'string', description: 'CPU limit (e.g., 0.5)' },
                memory: { type: 'string', description: 'Memory limit (e.g., 512M)' },
              },
            },
            reservations: {
              type: 'object',
              properties: {
                cpus: { type: 'string', description: 'CPU reservation' },
                memory: { type: 'string', description: 'Memory reservation' },
              },
            },
          },
        },
        restart_policy: {
          type: 'object',
          properties: {
            condition: {
              type: 'string',
              enum: ['none', 'on-failure', 'any'],
            },
            delay: { type: 'string' },
            max_attempts: { type: 'number' },
            window: { type: 'string' },
          },
        },
        update_config: {
          type: 'object',
          properties: {
            parallelism: { type: 'number' },
            delay: { type: 'string' },
            failure_action: {
              type: 'string',
              enum: ['continue', 'pause', 'rollback'],
            },
            order: {
              type: 'string',
              enum: ['stop-first', 'start-first'],
            },
          },
        },
      },
    },
    logging: {
      type: 'object',
      properties: {
        driver: {
          type: 'string',
          enum: ['json-file', 'syslog', 'journald', 'gelf', 'fluentd', 'awslogs', 'splunk', 'none'],
          description: 'Logging driver',
        },
        options: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Driver-specific options',
        },
      },
    },
    network: {
      type: 'object',
      properties: {
        driver: {
          type: 'string',
          description: 'Network driver (bridge, overlay, etc.)',
        },
        driver_opts: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        attachable: {
          type: 'boolean',
          description: 'Enable manual container attachment',
        },
        external: {
          oneOf: [
            { type: 'boolean' },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
          description: 'Use pre-existing network',
        },
        labels: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    volume: {
      type: 'object',
      properties: {
        driver: {
          type: 'string',
          description: 'Volume driver',
        },
        driver_opts: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        external: {
          oneOf: [
            { type: 'boolean' },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
          description: 'Use pre-existing volume',
        },
        labels: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};

// Common completions for quick access
export const dockerComposeCompletions = [
  {
    label: 'service-template',
    kind: 13, // monaco.languages.CompletionItemKind.Snippet
    insertText: [
      '${1:service-name}:',
      '  image: ${2:nginx:latest}',
      '  ports:',
      '    - "${3:8080}:${4:80}"',
      '  environment:',
      '    - ${5:ENV_VAR}=${6:value}',
      '  networks:',
      '    - ${7:default}',
    ].join('\n'),
    insertTextRules: 4, // monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    documentation: 'Basic service template with common fields',
  },
  {
    label: 'healthcheck',
    kind: 13,
    insertText: [
      'healthcheck:',
      '  test: ["CMD", "${1:curl}", "-f", "http://localhost/${2:health}"]',
      '  interval: ${3:30s}',
      '  timeout: ${4:10s}',
      '  retries: ${5:3}',
      '  start_period: ${6:40s}',
    ].join('\n'),
    insertTextRules: 4,
    documentation: 'Health check configuration',
  },
  {
    label: 'deploy-swarm',
    kind: 13,
    insertText: [
      'deploy:',
      '  mode: ${1|replicated,global|}',
      '  replicas: ${2:3}',
      '  resources:',
      '    limits:',
      '      cpus: "${3:0.5}"',
      '      memory: ${4:512M}',
      '    reservations:',
      '      cpus: "${5:0.1}"',
      '      memory: ${6:128M}',
      '  restart_policy:',
      '    condition: ${7|on-failure,any,none|}',
      '    delay: ${8:5s}',
      '    max_attempts: ${9:3}',
    ].join('\n'),
    insertTextRules: 4,
    documentation: 'Docker Swarm deployment configuration',
  },
];
