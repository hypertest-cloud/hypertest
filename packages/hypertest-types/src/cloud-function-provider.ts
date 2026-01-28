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
  updateLambdaImage: () => Promise<void>;
}

export type CloudFunctionProviderPluginFactory = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => CloudFunctionProviderPlugin;

export type CloudFunctionProviderPluginDefinition =
  PluginDefinition<CloudFunctionProviderPluginFactory>;
