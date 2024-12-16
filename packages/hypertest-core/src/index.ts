interface DockerImage <LambdaContext> {}

export interface HypertestPlugin <LambdaContext> {
  getLambdaContexts: () => Promise<LambdaContext[]>;
  buildImage: () => DockerImage<LambdaContext>
}

export interface HypertestProviderCloud <LambdaContext>{
  pushImage: (image: DockerImage<LambdaContext>) => Promise<string>;
  invoke: (imageReference: string, context: LambdaContext) => Promise<void>;
  getStatus: (id: string) => Promise<void>
}

interface HypertestCore {
  run: () => Promise<void>;
}

export type HypertestCoreFactory = <LambdaContext>(options: {
  plugin: HypertestPlugin<LambdaContext>;
  cloudProvider: HypertestProviderCloud<LambdaContext>
}) => HypertestCore;

export const HypertestCore: HypertestCoreFactory = <LambdaContext>(options: {
  plugin: HypertestPlugin<LambdaContext>;
  cloudProvider: HypertestProviderCloud<LambdaContext>
}): HypertestCore => {
  return {
    run: async () => {
      const lambdaContexts = await options.plugin.getLambdaContexts();

      const image = await options.plugin.buildImage();
      const imageReference = await options.cloudProvider.pushImage(image)

      for (const context of lambdaContexts) {
        options.cloudProvider.invoke(imageReference, context)
      }
    },
  };
};
