import { z } from 'zod';
import type {
  CommandOptions,
  InvokePayload,
  PluginDefinition,
  ResolvedHypertestConfig,
} from './index.js';
import type { ImageBuildManifest } from './manifest.js';

export const TestInvokeResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    name: z.string(),
    filePath: z.string(),
    duration: z.number(),
  }),
  z.object({
    success: z.literal('skipped'),
    name: z.string(),
    filePath: z.string(),
  }),
  z.object({
    success: z.literal(false),
    message: z.string(),
    name: z.string().optional(),
    filePath: z.string().optional(),
    stackTrace: z.string().optional(),
  }),
]);

export type TestInvokeResponse = z.infer<typeof TestInvokeResponseSchema>;

export interface CloudProviderPlugin<InvokePayloadContext = unknown> {
  pullBaseImage: () => Promise<void>;
  pushImage: () => Promise<void>;
  invoke: (
    payload: InvokePayload<InvokePayloadContext>,
  ) => Promise<TestInvokeResponse>;
  /**
   * Uploads the serialized results file content to cloud storage for durable,
   * cross-run access. The file is stored alongside per-test artifacts at
   * `{runId}/{resultsFileName}`.
   *
   * @param runId - The unique identifier for the invoke run.
   * @param content - The serialized JSON string of {@link HypertestRunResult}.
   */
  uploadRunResult: (runId: string, content: string) => Promise<void>;
  /**
   * Updates the cloud function to a newly pushed image and waits until
   * the update is fully applied before resolving. Implementations should
   * poll or subscribe until the function is confirmed active.
   */
  updateLambdaImage: () => Promise<void>;
  updateManifest: (
    invokePayloadContexts: InvokePayloadContext[],
    testDirHash: string,
  ) => Promise<void>;
  pullManifest: () => Promise<ImageBuildManifest<InvokePayloadContext>>;
}

type CloudProviderPluginFactory = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => CloudProviderPlugin;

export type CloudProviderPluginDefinition =
  PluginDefinition<CloudProviderPluginFactory>;
