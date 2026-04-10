import type {
  CommandOptions,
  PluginDefinition,
  ResolvedHypertestConfig,
} from './index.js';

export interface TestRunnerPlugin<InvokePayloadContext> {
  getInvokePayloadContext: () => Promise<InvokePayloadContext[]>;
  getTestDir: () => Promise<string>;
  buildImage: () => Promise<void>;
}

export type TestRunnerPluginFactory<InvokePayloadContext> = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => TestRunnerPlugin<InvokePayloadContext>;

export type TestRunnerPluginDefinition<InvokePayloadContext> = PluginDefinition<
  TestRunnerPluginFactory<InvokePayloadContext>
>;
