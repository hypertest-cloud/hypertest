import type {
  CommandOptions,
  InvokePayload,
  PluginDefinition,
  ResolvedHypertestConfig,
} from './index.js';

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
export interface CloudFunctionProviderPlugin {
  pullBaseImage: () => Promise<void>;
  pushImage: () => Promise<void>;
  invoke: (payload: InvokePayload<unknown>) => Promise<TestInvokeResponse>;
  /**
   * Updates the cloud function to a newly pushed image and waits until
   * the update is fully applied before resolving. Implementations should
   * poll or subscribe until the function is confirmed active.
   */
  updateLambdaImage: () => Promise<void>;
}

export type CloudFunctionProviderPluginFactory = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => CloudFunctionProviderPlugin;

export type CloudFunctionProviderPluginDefinition =
  PluginDefinition<CloudFunctionProviderPluginFactory>;
