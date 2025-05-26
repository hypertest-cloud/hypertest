import type {
  CommandOptions,
  InvokePayload,
  PluginDefinition,
  ResolvedHypertestConfig,
} from './index.js';

export interface CloudFunctionProviderPlugin {
  pullBaseImage: () => Promise<void>;
  pushImage: () => Promise<void>;
  invoke: (payload: InvokePayload<unknown>) => Promise<string>;
  updateLambdaImage: () => Promise<void>;
}

export type CloudFunctionProviderPluginFactory = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => CloudFunctionProviderPlugin;

export type CloudFunctionProviderPluginDefinition =
  PluginDefinition<CloudFunctionProviderPluginFactory>;
