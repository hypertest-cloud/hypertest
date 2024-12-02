export interface HypertestPluginReturnType {}

export interface HypertestPlugin <LambdaContext> {
  getLambdaContexts: () => Promise<LambdaContext[]>;
  getLambda: (context: LambdaContext) => Promise<void>
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
        console.log(options.plugin.getLambda(context));
      }
    },
  };
};
