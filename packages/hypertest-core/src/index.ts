interface DockerImage {
  name: string
}

export interface HypertestConfig {
  testsPath: string;
}

export interface HypertestPlugin <CloudFunctionContext> {
  getCloudFunctionContexts: () => Promise<CloudFunctionContext[]>;
  buildImage: () => Promise<DockerImage>
}

export interface HypertestProviderCloud <CloudFunctionContext> {
  pushImage: (image: DockerImage) => Promise<string>;
  invoke: (imageReference: string, context: CloudFunctionContext) => Promise<void>;
  getStatus: (id: string) => Promise<void>
}

interface HypertestCore {
  run: () => Promise<void>;
}

export const HypertestCore = <Context>(options: {
  plugin: HypertestPlugin<Context>;
  cloudProvider: HypertestProviderCloud<Context>
}): HypertestCore => {
  return {
    run: async () => {
      const contexts = await options.plugin.getCloudFunctionContexts();

      const image = await options.plugin.buildImage();
      const imageReference = await options.cloudProvider.pushImage(image)

      for (const context of contexts) {
        options.cloudProvider.invoke(imageReference, context)
      }
    },
  };
};
