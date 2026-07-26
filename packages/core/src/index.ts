import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  CloudProviderPlugin,
  CommandOptions,
  DeployStep,
  HypertestConfig,
  HypertestEvents,
  HypertestRunResult,
  HypertestTestResult,
  ResolvedHypertestConfig,
  TestInvokeResponse,
  TestRunnerPlugin,
} from '@hypertest-cloud/types';
import { loadConfig } from './config.js';
import { createDevCore } from './dev/index.js';
import { createEventBus } from './events.js';
import { hashDirectory } from './hashDirectory.js';
import { promiseMap } from './utils.js';

interface HypertestCore {
  deploy: () => Promise<void>;
  invoke: (grep?: string) => Promise<void>;
}

export const defineConfig = <T>(config: HypertestConfig<T>) => config;

export const parseTestResult = (
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
      ? {
          message: invokeResponse.message,
          stackTrace: invokeResponse.stackTrace,
        }
      : undefined,
});

export const setupHypertest = async ({
  dryRun,
  silent,
  events,
}: {
  dryRun?: boolean;
  silent?: boolean;
  events?: HypertestEvents;
}) => {
  const bus = events ?? createEventBus();

  if (process.env.HYPERTEST_DEV === 'true') {
    return createDevCore(bus);
  }

  const { config: baseConfig, ...providers } = await loadConfig();
  const config: ResolvedHypertestConfig = { ...baseConfig, events: bus };
  if (silent) {
    config.logger.silent = true;
  }
  const opts: CommandOptions = { dryRun, silent };

  const cloudProvider = providers.cloudProvider.handler(config, opts);
  const testRunner = providers.testRunner.handler(config, opts);

  return HypertestCore({
    config,
    cloudProvider,
    testRunner,
    events: bus,
  });
};

export const HypertestCore = <InvokePayloadContext>(options: {
  config: ResolvedHypertestConfig;
  testRunner: TestRunnerPlugin<InvokePayloadContext>;
  cloudProvider: CloudProviderPlugin<InvokePayloadContext>;
  events: HypertestEvents;
}): HypertestCore => {
  const getTestDirHash = async () =>
    hashDirectory(await options.testRunner.getTestDir());

  return {
    invoke: async () => {
      const runId = crypto.randomUUID();
      const runStartDate = new Date();

      const manifest = await options.cloudProvider.pullManifest();
      const testDirHash = await getTestDirHash();

      if (manifest.testDirHash !== testDirHash) {
        const message =
          'Your local test code differ from what is deploying in cloud infrastructure';

        const policyActions = {
          warning: () => {
            // TODO Implement TUI solution for warnings
            options.config.logger.warn(message);
          },
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

      options.events.emit({
        type: 'run:start',
        runId,
        testCount: functionInvokePayloads.length,
        concurrency: options.config.concurrency,
      });

      const testResults: HypertestTestResult[] = await promiseMap(
        functionInvokePayloads,
        async (payload) => {
          options.events.emit({ type: 'test:start', testId: payload.testId });
          options.config.logger.verbose(`TestId: ${payload.testId}`);
          const invokeStart = new Date();
          const invokeResponse = await options.cloudProvider.invoke(payload);
          const invokeEnd = new Date();
          const result = parseTestResult(
            payload.testId,
            invokeResponse,
            invokeStart,
            invokeEnd,
          );
          options.events.emit({
            type: 'test:end',
            testId: payload.testId,
            result,
          });
          options.config.logger.verbose(
            `Invoke response: ${JSON.stringify(invokeResponse, null, 2)}`,
          );
          return result;
        },
        { concurrency: options.config.concurrency },
      );

      const runEndDate = new Date();

      const counts = testResults.reduce(
        (acc, testResult) => {
          acc[testResult.status]++;
          return acc;
        },
        { success: 0, skipped: 0, failed: 0 },
      );

      const runResult: HypertestRunResult = {
        runId,
        startDate: runStartDate.toISOString(),
        endDate: runEndDate.toISOString(),
        duration: runEndDate.getTime() - runStartDate.getTime(),
        tests: {
          total: testResults.length,
          ...counts,
        },
        testResults,
      };

      const json = JSON.stringify(runResult, null, 2);
      const localPath = path.join(
        process.cwd(),
        options.config.resultsFileName,
      );

      await writeFile(localPath, json, 'utf-8');
      options.config.logger.info(
        `Results written to ${localPath} and uploaded to cloud storage at ${runId}/${options.config.resultsFileName}`,
      );
      const { artifactsBaseUrl } = await options.cloudProvider.uploadRunResult(
        runId,
        json,
      );

      options.events.emit({
        type: 'run:end',
        runId,
        result: runResult,
        localPath,
        artifactsBaseUrl,
      });
      options.config.logger.info(
        `Functions invoked successfully. Run id: ${runId}`,
      );
    },

    deploy: async () => {
      const step = async (name: DeployStep, fn: () => Promise<void>) => {
        const start = Date.now();
        options.events.emit({
          type: 'deploy:step',
          step: name,
          status: 'start',
        });
        try {
          await fn();
          options.events.emit({
            type: 'deploy:step',
            step: name,
            status: 'end',
            durationMs: Date.now() - start,
          });
        } catch (err) {
          options.events.emit({
            type: 'deploy:step',
            step: name,
            status: 'error',
            durationMs: Date.now() - start,
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      };

      options.config.logger.info(
        'Deploying lambda image to the cloud infrastructure',
      );
      options.config.logger.info('Pulling base image');
      await step('pullBase', () => options.cloudProvider.pullBaseImage());

      options.config.logger.info('Building container image');
      await step('build', () => options.testRunner.buildImage());

      options.config.logger.info('Pushing image to the cloud');
      await step('push', () => options.cloudProvider.pushImage());

      options.config.logger.info('Building and storing manifest');
      await step('manifest', async () => {
        const invokePayloadContext =
          await options.testRunner.getInvokePayloadContext();
        const testDirHash = await getTestDirHash();
        await options.cloudProvider.updateManifest(
          invokePayloadContext,
          testDirHash,
        );
      });

      options.config.logger.info(
        'Updating lambda image and waiting for deployment to complete',
      );
      await step('updateLambda', () =>
        options.cloudProvider.updateLambdaImage(),
      );
    },
  };
};
