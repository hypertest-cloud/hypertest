import type {
  CommandOptions,
  InvokePayload,
  PluginDefinition,
  ResolvedHypertestConfig,
} from './index.js';

interface TestInvokeResponseBase {
  name: string;
  filePath: string;
  duration: number; //in ms
}
export type TestInvokeResponse =
  | (TestInvokeResponseBase & {
      success: true;
    })
  | (TestInvokeResponseBase & {
      success: false;
      stackTrace: string;
    });

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
