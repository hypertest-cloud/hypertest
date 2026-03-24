import type {
  CommandOptions,
  InvokePayload,
  PluginDefinition,
  ResolvedHypertestConfig,
} from './index.js';
import type { ImageBuildManifest } from './manifest.js';

export type TestInvokeResponse =
  | {
      success: true;
      name: string;
      filePath: string;
      duration: number; //in ms
    }
  | {
      success: false;
      message: string;
      name?: string;
      filePath?: string;
      stackTrace?: string;
    };
export interface CloudProviderPlugin<InvokePayloadContext = unknown> {
  pullBaseImage: () => Promise<void>;
  pushImage: () => Promise<void>;
  invoke: (
    payload: InvokePayload<InvokePayloadContext>,
  ) => Promise<TestInvokeResponse>;
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
