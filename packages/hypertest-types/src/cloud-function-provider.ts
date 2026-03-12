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
export interface CloudFunctionProviderPlugin<InvokePayloadContext = unknown> {
  pullBaseImage: () => Promise<void>;
  pushImage: () => Promise<void>;
  invoke: (
    payload: InvokePayload<InvokePayloadContext>,
  ) => Promise<TestInvokeResponse>;
  updateLambdaImage: () => Promise<void>;
  updateManifest: (
    invokePayloadContexts: InvokePayloadContext[],
    testDirHash: string,
  ) => Promise<void>;
  pullManifest: () => Promise<ImageBuildManifest<InvokePayloadContext>>;
}

type CloudFunctionProviderPluginFactory = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => CloudFunctionProviderPlugin;

export type CloudFunctionProviderPluginDefinition =
  PluginDefinition<CloudFunctionProviderPluginFactory>;
