import type { z } from 'zod';
import type winston from 'winston';
import type { CloudFunctionProviderPluginDefinition } from './cloud-function-provider.js';
import type { ConfigSchema } from './config-schema.js';
import type { TestRunnerPluginDefinition } from './test-runner-plugin.js';

export type HypertestConfigInput = z.input<typeof ConfigSchema>;
export type HypertestConfigOutput = z.output<typeof ConfigSchema>;

export interface HypertestConfig<InvokePayloadContext> {
  imageName: string;
  localImageName?: string;
  localBaseImageName?: string;
  concurrency?: number;
  logger?: winston.LoggerOptions;
  testRunner: TestRunnerPluginDefinition<InvokePayloadContext>;
  cloudFunctionProvider: CloudFunctionProviderPluginDefinition;
}

export interface ResolvedHypertestConfig {
  imageName: string;
  localImageName: string;
  localBaseImageName: string;
  concurrency: number;
  logger: winston.Logger;
}

export interface CommandOptions {
  dryRun?: boolean;
}

export interface InvokePayload<Context> {
  context: Context;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export interface PluginDefinition<T extends (...args: any[]) => any> {
  name: string;
  version: string;
  validate: () => Promise<void>;
  handler: T;
}

// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './cloud-function-provider.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './test-runner-plugin.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './config-schema.js';
// biome-ignore lint/performance/noReExportAll: <explanation>
export * from './docker.js';
