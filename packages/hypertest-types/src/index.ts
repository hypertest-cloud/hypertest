import { z } from 'zod';

export type CommandOptions = {
  dryRun?: boolean;
};

export type PluginBase = {
  name: string;
  validate: () => Promise<void>;
};

export type TestPluginHandler = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => HypertestPlugin<{
  grepString: string;
}>;

export type TestPlugin = z.infer<typeof TestPluginSchema>;

export type CloudPluginHandler = (
  config: ResolvedHypertestConfig,
  opts: CommandOptions,
) => HypertestProviderCloud<{
  grepString: string;
}>;

export type CloudPlugin = z.infer<typeof CloudPluginSchema>;

export type ResolvedHypertestConfig = z.output<typeof ConfigSchema>;
export type HypertestConfig = z.input<typeof ConfigSchema>;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const FunctionSchema = <T extends (...args: any[]) => any>() =>
  z.function() as unknown as z.ZodType<T>;

const PluginSchema = z.object({
  name: z.string(),
  version: z.string(),
  validate: z.function(),
});

const TestPluginSchema = PluginSchema.extend({
  handler: FunctionSchema<TestPluginHandler>(),
});

const CloudPluginSchema = PluginSchema.extend({
  handler: FunctionSchema<CloudPluginHandler>(),
});

export const ConfigSchema = z
  .object({
    imageName: z.string(),
    localImageName: z.string().optional(),
    plugins: z.object({
      testPlugin: TestPluginSchema,
      cloudPlugin: CloudPluginSchema,
    }),
  })
  .transform((config) => {
    return {
      ...config,
      localImageName:
        config.localImageName ?? `hypertest-image/${config.imageName}`,
    };
  });

export interface HypertestPlugin<CloudFunctionContext> {
  getCloudFunctionContexts: () => Promise<CloudFunctionContext[]>;
  buildImage: () => Promise<void>;
}

export interface HypertestProviderCloud<CloudFunctionContext> {
  pullBaseImage: () => Promise<void>;
  pushImage: () => Promise<void>;
  invoke: (
    imageReference: string,
    context: CloudFunctionContext,
  ) => Promise<void>;
  getStatus: (id: string) => Promise<void>;
}
