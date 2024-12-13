export interface HypertestPlugin <LambdaContext> {
  getLambdaContexts: () => Promise<LambdaContext[]>;
  getLambda: (context: LambdaContext) => Promise<void>
}

export interface HypertestProviderCloud {
  setImage: () => Promise<void>;
  spawn: () => Promise<void>;
  getStatus: (id: string) => Promise<void>
}

interface HypertestCore {
  run: () => Promise<void>;
}

export type HypertestCoreFactory = (options: {
  plugin: HypertestPlugin<any>;
}) => HypertestCore;

export const HypertestCore: HypertestCoreFactory = (options: {
  plugin: HypertestPlugin<any>;
}): HypertestCore => {
  return {
    run: async () => {
      const lambdaContexts = await options.plugin.getLambdaContexts();

      for (const context of lambdaContexts) {
        // TODO: Remove console.log
        console.log(context)
        // options.plugin.getLambda(context)
      }
    },
  };
};
