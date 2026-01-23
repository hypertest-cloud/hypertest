import type {
  CloudFunctionProviderPlugin,
  CommandOptions,
  HypertestConfig,
  InvokePayload,
  ResolvedHypertestConfig,
  TestRunnerPlugin,
} from '@hypertest/hypertest-types';
import { loadConfig } from './config.js';
import { promiseMap } from './utils.js';

interface HypertestCore {
  deploy: () => Promise<void>;
  invoke: (grep?: string) => Promise<void>;
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
    // TODO grep param is only for internal dev testing, remove later
    invoke: async (grep?: string) => {
      options.config.logger.info('Invoking cloud functions');

      const runId = crypto.randomUUID();
      const functionInvokePayloads = grep
        ? ([
            {
              runId,
              testId: crypto.randomUUID(),
              context: { grep },
            },
          ] as InvokePayload<InvokePayloadContext>[])
        : await options.testRunner.getCloudFunctionContexts(runId);

      const results = await promiseMap(
        functionInvokePayloads,
        async (payload) => ({
          ...payload,
          result: await options.cloudFunctionProvider.invoke(payload),
        }),
        { concurrency: options.config.concurrency },
      );

      console.log('Run id: ', results[0].runId);
      for (const { result, testId } of results) {
        console.log('TestId: ', testId);
        console.log(`Test results: ${JSON.stringify(result, null, 2)}`);
      }

      options.config.logger.verbose(`Test results: ${results.toString()}`);
    },
    deploy: async () => {
      options.config.logger.info(
        'Deploying lambda image to the cloud infrastructure',
      );

      options.config.logger.info('Pulling base image');
      await options.cloudFunctionProvider.pullBaseImage();

      options.config.logger.info('Building container image');
      await options.testRunner.buildImage();

      options.config.logger.info('Pushing image to the cloud');
      await options.cloudFunctionProvider.pushImage();

      options.config.logger.info('Updating lambda image');
      await options.cloudFunctionProvider.updateLambdaImage();

      options.config.logger.info('Deploy successful');
    },
  };
};
