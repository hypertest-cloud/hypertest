import {
  type CloudFunctionProviderPluginDefinition,
  ConfigSchema,
  type ResolvedHypertestConfig,
  type TestRunnerPluginDefinition,
} from '@hypertest/hypertest-types';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

export const getConfigFilepath = () =>
  pathToFileURL(path.resolve(process.cwd(), 'hypertest.config.js')).href;

export const loadConfig = async <T>(): Promise<{
  config: ResolvedHypertestConfig;
  testRunner: TestRunnerPluginDefinition<T>;
  cloudFunctionProvider: CloudFunctionProviderPluginDefinition;
}> => {
  const config: unknown = await import(getConfigFilepath());

  const module = await z
    .object({
      default: z.custom<unknown>((value) => value !== undefined, {
        message: 'hypertest.config.js is missing default export',
      }),
    })
    .parseAsync(config);

  const { testRunner, cloudFunctionProvider, ...parsedConfig } =
    await ConfigSchema.parseAsync(module.default);

  await testRunner.validate();
  await cloudFunctionProvider.validate();

  return {
    config: parsedConfig,
    testRunner: testRunner as TestRunnerPluginDefinition<T>,
    cloudFunctionProvider:
      cloudFunctionProvider as CloudFunctionProviderPluginDefinition,
  };
};
