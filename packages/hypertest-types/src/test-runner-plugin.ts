import type {
  CommandOptions,
  InvokePayload,
  PluginDefinition,
  ResolvedHypertestConfig,
} from './index.js';

export interface TestRunnerPlugin<InvokePayloadContext> {
  getCloudFunctionContexts: () => Promise<
    InvokePayload<InvokePayloadContext>[]
  >;
  buildImage: () => Promise<void>;
}

export type TestRunnerPluginFactory<InvokePayloadContext> = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => TestRunnerPlugin<InvokePayloadContext>;

export type TestRunnerPluginDefinition<InvokePayloadContext> = PluginDefinition<
  TestRunnerPluginFactory<InvokePayloadContext>
>;
