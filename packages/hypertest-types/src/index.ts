import { z } from 'zod';

export type CommandOptions = {
  dryRun?: boolean;
};

export type PluginBase = {
  name: string;
  validate: () => Promise<void>;
};

export type TestPluginHandler = (
  config: HypertestConfig,
  cloudProvider: HypertestProviderCloud<{
    grepString: string;
  }>,
  opts: CommandOptions,
) => HypertestPlugin<{
  grepString: string;
}>;

export type TestPlugin = z.infer<typeof TestPluginSchema>;

export type CloudPluginHandler = (
  config: HypertestConfig,
  opts: CommandOptions,
) => HypertestProviderCloud<{
  grepString: string;
}>;

export type CloudPlugin = z.infer<typeof CloudPluginSchema>;

export type HypertestConfig = z.infer<typeof ConfigSchema>;

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

export const ConfigSchema = z.object({
  imageName: z.string(),
  localImageName: z.string().optional(),
  plugins: z.object({
    testPlugin: TestPluginSchema,
    cloudPlugin: CloudPluginSchema,
  }),
});

interface DockerImage {
  name: string;
}

export interface HypertestPlugin<CloudFunctionContext> {
  getCloudFunctionContexts: () => Promise<CloudFunctionContext[]>;
  buildImage: () => Promise<DockerImage>;
}

export interface HypertestProviderCloud<CloudFunctionContext> {
  pullBaseImage: () => Promise<void>;
  pushImage: (image: DockerImage) => Promise<string>;
  invoke: (
    imageReference: string,
    context: CloudFunctionContext,
  ) => Promise<void>;
  getStatus: (id: string) => Promise<void>;
  getTargetImageName: () => string;
}
