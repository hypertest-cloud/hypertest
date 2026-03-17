import type {
  CloudProviderPlugin,
  CommandOptions,
  HypertestConfig,
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

  const cloudProvider = providers.cloudProvider.handler(config, {
    dryRun,
  });
  const testRunner = providers.testRunner.handler(config, {
    dryRun,
  });

  return HypertestCore({
    config,
    cloudProvider,
    testRunner,
  });
};

export const HypertestCore = <InvokePayloadContext>(options: {
  config: ResolvedHypertestConfig;
  testRunner: TestRunnerPlugin<InvokePayloadContext>;
  cloudProvider: CloudProviderPlugin<InvokePayloadContext>;
}): HypertestCore => {
  const getTestDirHash = () => {
    return 'TODO This needs to be implemented in separated PR';
  };

  return {
    invoke: async () => {
      options.config.logger.info('Invoking cloud functions');

      const runId = crypto.randomUUID();
      const manifest = await options.cloudProvider.pullManifest();
      const testDirHash = getTestDirHash();

      if (manifest.testDirHash !== testDirHash) {
        options.config.logger.warning(
          'Your local test code differ from what is deploying in cloud infrastructure',
        );
      }

      const functionInvokePayloads = manifest.invokePayloadContexts.map(
        (context) => ({
          runId,
          testId: crypto.randomUUID(),
          context,
        }),
      );

      const results = await promiseMap(
        functionInvokePayloads,
        async (payload) => ({
          ...payload,
          result: await options.cloudProvider.invoke(payload),
        }),
        { concurrency: options.config.concurrency },
      );

      options.config.logger.info(
        `Functions invoked successfully. Run id: ${results[0].runId}`,
      );
      for (const { result, testId } of results) {
        options.config.logger.verbose(`TestId: ${testId}`);
        options.config.logger.verbose(
          `Test results: ${JSON.stringify(result, null, 2)}`,
        );
      }
    },
    deploy: async () => {
      options.config.logger.info(
        'Deploying lambda image to the cloud infrastructure',
      );

      options.config.logger.info('Pulling base image');
      await options.cloudProvider.pullBaseImage();

      options.config.logger.info('Building container image');
      await options.testRunner.buildImage();

      options.config.logger.info('Pushing image to the cloud');
      await options.cloudProvider.pushImage();

      options.config.logger.info('Building and storing manifest');
      const invokePayloadContext =
        await options.testRunner.getInvokePayloadContext();
      const testDirHash = getTestDirHash();
      await options.cloudProvider.updateManifest(
        invokePayloadContext,
        testDirHash,
      );

      options.config.logger.info('Updating lambda image and waiting for deployment to complete');
      await options.cloudProvider.updateLambdaImage();

      options.config.logger.info('Deploy successful');
    },
  };
};
