import { z } from 'zod';

export type HypertestProviderCloudAwsConfig = z.infer<
  typeof HypertestProviderCloudAwsConfigSchema
>;

export type CommandOptions = {
  dryRun?: boolean;
};

export type TestPlugin = {
  name: string;
  handler: (
    config: HypertestConfig,
    cloudProvider: HypertestProviderCloud<{
      grepString: string;
    }>,
    opts: CommandOptions,
  ) => HypertestPlugin<{
    grepString: string;
  }>;
};

export type CloudPlugin = {
  name: string;
  handler: (
    config: HypertestConfig,
    opts: CommandOptions,
  ) => HypertestProviderCloud<{
    grepString: string;
  }>;
};

export type HypertestConfig = z.infer<typeof ConfigSchema> & {
  plugins: {
    testPlugin: TestPlugin;
    cloudPlugin: CloudPlugin;
  };
};

export const HypertestProviderCloudAwsConfigSchema = z.object({
  type: z.literal('aws'),
  ecrRegistry: z.string(),
});

export const ConfigSchema = z.object({
  imageName: z.string(),
  localImageName: z.string().optional(),
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
