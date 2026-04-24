import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  CloudProviderPlugin,
  CommandOptions,
  HypertestConfig,
  HypertestRunResult,
  HypertestTestResult,
  ResolvedHypertestConfig,
  TestInvokeResponse,
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

const parseTestResult = (
  testId: string,
  invokeResponse: TestInvokeResponse,
  invokeStart: Date,
  invokeEnd: Date,
): HypertestTestResult => ({
  testId,
  name: invokeResponse.name ?? 'unknown',
  filePath: invokeResponse.filePath ?? 'unknown',
  status:
    invokeResponse.success === true
      ? 'success'
      : invokeResponse.success === 'skipped'
        ? 'skipped'
        : 'failed',
  startDate: invokeStart.toISOString(),
  endDate: invokeEnd.toISOString(),
  duration:
    invokeResponse.success === true
      ? invokeResponse.duration
      : invokeEnd.getTime() - invokeStart.getTime(),
  error:
    invokeResponse.success === false
      ? { message: invokeResponse.message, stackTrace: invokeResponse.stackTrace }
      : undefined,
});

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

      const invokeResponses = await promiseMap(
        functionInvokePayloads,
        async (payload) => {
          const invokeStart = new Date();
          const invokeResponse = await options.cloudProvider.invoke(payload);
          const invokeEnd = new Date();
          return { ...payload, invokeResponse, invokeStart, invokeEnd };
        },
        { concurrency: options.config.concurrency },
      );

      const runEndDate = new Date();

      const testResults: HypertestTestResult[] = invokeResponses.map(
        ({ testId, invokeResponse, invokeStart, invokeEnd }) =>
          parseTestResult(testId, invokeResponse, invokeStart, invokeEnd),
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
      const localPath = path.join(process.cwd(), options.config.resultsFileName);

      await writeFile(localPath, json, 'utf-8');
      await options.cloudProvider.uploadRunResult(runId, json);

      options.config.logger.info(
        `Results written to ${localPath} and uploaded to cloud storage at ${runId}/${options.config.resultsFileName}`,
      );

      options.config.logger.info(
        `Functions invoked successfully. Run id: ${invokeResponses[0].runId}`,
      );
      for (const { invokeResponse, testId } of invokeResponses) {
        options.config.logger.verbose(`TestId: ${testId}`);
        options.config.logger.verbose(
          `Invoke response: ${JSON.stringify(invokeResponse, null, 2)}`,
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
