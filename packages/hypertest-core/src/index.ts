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
} from '@hypertest/hypertest-types';
import { loadConfig } from './config.js';
import { createEventBus } from './events.js';
import { createDevCore } from './dev/index.js';
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

export const setupHypertest = async ({
  dryRun,
  events,
}: {
  dryRun?: boolean;
  events?: HypertestEvents;
}) => {
  const bus = events ?? createEventBus();

  if (process.env.HYPERTEST_DEV === 'true') {
    return createDevCore(bus);
  }

  const { config, ...providers } = await loadConfig();
  const opts: CommandOptions = { dryRun };

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
          warning: () =>
            options.events.emit({ type: 'log', level: 'warn', message }),
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
          const invokeStart = new Date();
          const invokeResponse = await options.cloudProvider.invoke(payload);
          const invokeEnd = new Date();
          const result = parseTestResult(
            payload.testId,
            invokeResponse,
            invokeStart,
            invokeEnd,
          );
          options.events.emit({ type: 'test:end', testId: payload.testId, result });
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
      const localPath = path.join(process.cwd(), options.config.resultsFileName);

      await writeFile(localPath, json, 'utf-8');
      await options.cloudProvider.uploadRunResult(runId, json);

      options.events.emit({ type: 'run:end', runId, result: runResult });
    },

    deploy: async () => {
      const step = async (name: DeployStep, fn: () => Promise<void>) => {
        const start = Date.now();
        options.events.emit({ type: 'deploy:step', step: name, status: 'start' });
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

      await step('pullBase', () => options.cloudProvider.pullBaseImage());
      await step('build', () => options.testRunner.buildImage());
      await step('push', () => options.cloudProvider.pushImage());
      await step('manifest', async () => {
        const invokePayloadContext =
          await options.testRunner.getInvokePayloadContext();
        const testDirHash = await getTestDirHash();
        await options.cloudProvider.updateManifest(
          invokePayloadContext,
          testDirHash,
        );
      });
      await step('updateLambda', () => options.cloudProvider.updateLambdaImage());
    },
  };
};
