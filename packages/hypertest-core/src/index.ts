export interface HypertestPluginReturnType {}

export interface TestDescription {
  directoryPath: string
  contextPath: string
  testName: string
}
export interface HypertestPlugin {
  getTestDescriptions: () => Promise<TestDescription[]>;
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
      const testDescriptions = await options.plugin.getTestDescriptions()
      console.log('[core] testDescriptions: ', testDescriptions)
      for (const testDescription of testDescriptions) {
        // odpalLambdęDla(testDescriptions)
      }
    },
  };
};
