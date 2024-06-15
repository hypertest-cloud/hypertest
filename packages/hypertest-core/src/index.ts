export interface HypertestPluginReturnType {}

export interface HypertestPlugin {
  getTestCount: () => Promise<number>;
}

interface HypertestCore {
  run: () => Promise<void>;
}

export type HypertestCoreFactory = (options: {
  plugin: HypertestPlugin;
}) => HypertestCore;

export const HypertestCore: HypertestCoreFactory = (options: {
  plugin: HypertestPlugin;
}): HypertestCore => {
  console.log(options.plugin);

  return {
    run: async () => {
      const count = await options.plugin.getTestCount()
      console.log('Counted tests: ', count);
    },
  };
};
