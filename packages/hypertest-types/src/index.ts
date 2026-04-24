import type winston from 'winston';
import type { z } from 'zod';
import type { Check } from './cli-doctor.js';
import type { CloudProviderPluginDefinition } from './cloud-provider.js';
import type { ConfigSchema } from './config-schema.js';
import type { TestRunnerPluginDefinition } from './test-runner-plugin.js';

export type HypertestConfigInput = z.input<typeof ConfigSchema>;
export type HypertestConfigOutput = z.output<typeof ConfigSchema>;
// TODO Add comparing ConfigSchema and HypertestConfig, they should be in sync

export interface HypertestConfig<InvokePayloadContext> {
  imageName: string;
  localImageName?: string;
  localBaseImageName?: string;
  buildManifestFileName?: string;
  driftDetectionPolicy?: 'warning' | 'error' | 'silence';
  concurrency?: number;
  loggerOptions?: winston.LoggerOptions;
  testRunner: TestRunnerPluginDefinition<InvokePayloadContext>;
  cloudProvider: CloudProviderPluginDefinition;
}

export interface ResolvedHypertestConfig {
  imageName: string;
  localImageName: string;
  localBaseImageName: string;
  buildManifestFileName: string;
  driftDetectionPolicy: 'warning' | 'error' | 'silence';
  concurrency: number;
  logger: winston.Logger;
}

export interface CommandOptions {
  dryRun?: boolean;
}

export interface InvokePayload<Context> {
  runId: string;
  testId: string;
  context: Context;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export interface PluginDefinition<T extends (...args: any[]) => any> {
  name: string;
  version: string;
  validate: () => Promise<void>;
  getCliDoctorChecks?: (config: ResolvedHypertestConfig) => Check[];
  handler: T;
}

// biome-ignore lint/performance/noReExportAll lint/performance/noBarrelFile: intentional barrel file for package exports
export * from './cloud-provider.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './test-runner-plugin.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './config-schema.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './docker.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './cli-doctor.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './manifest-schema.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './manifest.js';
