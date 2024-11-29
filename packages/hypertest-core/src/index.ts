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
      console.log('[core] first test description: ', testDescriptions[0])
      console.log('[core] second test description: ', testDescriptions[1])
      console.log('[core] descriptions.length: ', testDescriptions.length)
      for (const testDescription of testDescriptions) {
        const grep = `^chromium\\s${testDescription.directoryPath.replace('tests\\\\', '')}\\s${testDescription.contextPath}\\s${testDescription.testName}$`.replace(/\./g, '\\.')
        console.log(grep)
        // odpalLambdęDla(testDescriptions)
      }
    },
  };
};
