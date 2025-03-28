interface DockerImage {
  name: string;
}

export interface HypertestProviderCloudAwsConfig {
  type: 'aws';
  ecrRegistry: string;
}

export interface HypertestConfig {
  imageName: string;
  localImageName?: string;
  cloudProvider: HypertestProviderCloudAwsConfig;
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

interface HypertestCore {
  run: () => Promise<void>;
}

export const HypertestCore = <Context>(options: {
  plugin: HypertestPlugin<Context>;
  cloudProvider: HypertestProviderCloud<Context>;
}): HypertestCore => {
  return {
    run: async () => {
      const contexts = await options.plugin.getCloudFunctionContexts();

      const image = await options.plugin.buildImage();
      const imageReference = await options.cloudProvider.pushImage(image);

      for (const context of contexts) {
        options.cloudProvider.invoke(imageReference, context);
      }
    },
  };
};
