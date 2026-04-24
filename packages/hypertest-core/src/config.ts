import {
  type CloudProviderPluginDefinition,
  ConfigSchema,
  type ResolvedHypertestConfig,
  type TestRunnerPluginDefinition,
} from '@hypertest/hypertest-types';
import type winston from 'winston';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { initializeLogger } from './logger.js';

export const getConfigFileUrl = () =>
  pathToFileURL(path.resolve(process.cwd(), 'hypertest.config.js')).href;

export const loadConfig = async <T>(): Promise<{
  config: ResolvedHypertestConfig;
  testRunner: TestRunnerPluginDefinition<T>;
  cloudProvider: CloudProviderPluginDefinition;
}> => {
  const config: unknown = await import(getConfigFileUrl());

  const module = await z
    .object({
      default: z.custom<unknown>((value) => value !== undefined, {
        message: 'hypertest.config.js is missing default export',
      }),
    })
    .parseAsync(config);

  const { testRunner, cloudProvider, loggerOptions, ...parsedConfig } =
    await ConfigSchema.parseAsync(module.default);

  await testRunner.validate();
  await cloudProvider.validate();

  return {
    config: {
      ...parsedConfig,
      logger: initializeLogger(
        loggerOptions as unknown as winston.LoggerOptions,
      ),
    },
    testRunner: testRunner as TestRunnerPluginDefinition<T>,
    cloudProvider:
      cloudProvider as CloudProviderPluginDefinition,
  };
};
