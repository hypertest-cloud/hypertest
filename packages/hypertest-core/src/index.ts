import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  CloudProviderPlugin,
  CommandOptions,
  HypertestConfig,
  HypertestRunResult,
  HypertestTestResult,
  ResolvedHypertestConfig,
  TestRunnerPlugin,
} from '@hypertest/hypertest-types';
import { loadConfig } from './config.js';
import { promiseMap } from './utils.js';
import { hashDirectory } from './hashDirectory.js';

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
  const getTestDirHash = async () =>
    hashDirectory(await options.testRunner.getTestDir());

  return {
    invoke: async () => {
      options.config.logger.info('Invoking cloud functions');

      const runId = crypto.randomUUID();
      const runStartDate = new Date();

      const manifest = await options.cloudProvider.pullManifest();
      const testDirHash = await getTestDirHash();

      if (manifest.testDirHash !== testDirHash) {
        const message =
          'Your local test code differ from what is deploying in cloud infrastructure';

        const policyActions = {
          warning: () => options.config.logger.warn(message),
          error: () => {
            throw new Error(message);
          },
          // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
          silence: () => {},
        };

        policyActions[options.config.driftDetectionPolicy]();
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
        async (payload) => {
          const invokeStart = new Date();
          const result = await options.cloudProvider.invoke(payload);
          const invokeEnd = new Date();
          return { ...payload, result, invokeStart, invokeEnd };
        },
        { concurrency: options.config.concurrency },
      );

      const runEndDate = new Date();

      const testResults: HypertestTestResult[] = results.map(
        ({ testId, result, invokeStart, invokeEnd }) => {
          return {
            testId,
            name: result.name ?? 'unknown',
            filePath: result.filePath ?? 'unknown',
            status:
              result.success === true
                ? 'success'
                : result.success === 'skipped'
                  ? 'skipped'
                  : 'failed',
            startDate: invokeStart.toISOString(),
            endDate: invokeEnd.toISOString(),
            duration:
              result.success === true
                ? result.duration
                : invokeEnd.getTime() - invokeStart.getTime(),
            error:
              result.success === false
                ? { message: result.message, stackTrace: result.stackTrace }
                : undefined,
          };
        },
      );

      const runResult: HypertestRunResult = {
        runId,
        startDate: runStartDate.toISOString(),
        endDate: runEndDate.toISOString(),
        duration: runEndDate.getTime() - runStartDate.getTime(),
        tests: {
          total: testResults.length,
          success: testResults.filter((t) => t.status === 'success').length,
          skipped: testResults.filter((t) => t.status === 'skipped').length,
          failed: testResults.filter((t) => t.status === 'failed').length,
        },
        results: testResults,
      };

      const json = JSON.stringify(runResult, null, 2);
      const localPath = path.join(process.cwd(), 'hypertest.results.json');

      await writeFile(localPath, json, 'utf-8');
      await options.cloudProvider.uploadRunResult(runId, json);

      options.config.logger.info(
        `Results written to ${localPath} and uploaded to cloud storage at ${runId}/hypertest.results.json`,
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
      const testDirHash = await getTestDirHash();
      await options.cloudProvider.updateManifest(
        invokePayloadContext,
        testDirHash,
      );

      options.config.logger.info(
        'Updating lambda image and waiting for deployment to complete',
      );
      await options.cloudProvider.updateLambdaImage();

      options.config.logger.info('Deploy successful');
    },
  };
};
