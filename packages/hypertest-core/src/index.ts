import type {
  CloudFunctionProviderPlugin,
  CommandOptions,
  HypertestConfig,
  ResolvedHypertestConfig,
  TestRunnerPlugin,
} from '@hypertest/hypertest-types';
import { loadConfig } from './config.js';
import { promiseMap } from './utils.js';

interface HypertestCore {
  deploy: () => Promise<void>;
  invoke: () => Promise<void>;
}

export const defineConfig = <T>(config: HypertestConfig<T>) => config;

export const setupHypertest = async ({ dryRun }: CommandOptions) => {
  const { config, ...providers } = await loadConfig();

  const cloudFunctionProvider = providers.cloudFunctionProvider.handler(
    config,
    {
      dryRun,
    },
  );
  const testRunner = providers.testRunner.handler(config, {
    dryRun,
  });

  return HypertestCore({
    config,
    cloudFunctionProvider,
    testRunner,
  });
};

export const HypertestCore = <InvokePayloadContext>(options: {
  config: ResolvedHypertestConfig;
  testRunner: TestRunnerPlugin<InvokePayloadContext>;
  cloudFunctionProvider: CloudFunctionProviderPlugin;
}): HypertestCore => {
  return {
    invoke: async () => {
      const functionInvokePayloads =
        await options.testRunner.getCloudFunctionContexts();

      const results = await promiseMap(
        functionInvokePayloads,
        async (payload) => ({
          ...payload,
          result: await options.cloudFunctionProvider.invoke(payload),
        }),
        { concurrency: options.config.concurrency },
      );

      console.log(results);
    },
    deploy: async () => {
      await options.cloudFunctionProvider.pullBaseImage();
      await options.testRunner.buildImage();
      await options.cloudFunctionProvider.pushImage();
      await options.cloudFunctionProvider.updateLambdaImage();
    },
  };
};
