import type {
  CommandOptions,
  HypertestConfig,
  HypertestPlugin,
  HypertestProviderCloud,
} from '@hypertest/hypertest-types';
import { loadConfig } from './config.js';

interface HypertestCore {
  deploy: () => Promise<void>;
  invoke: () => Promise<void>;
}

export const defineConfig = (config: HypertestConfig) => config;

export const setupHypertest = async ({ dryRun }: CommandOptions) => {
  const config = await loadConfig();

  const cloudProvider = config.plugins.cloudPlugin.handler(config, { dryRun });
  const plugin = config.plugins.testPlugin.handler(config, {
    dryRun,
  });

  return HypertestCore({
    cloudProvider,
    plugin,
  });
};

export const HypertestCore = <Context>(options: {
  plugin: HypertestPlugin<Context>;
  cloudProvider: HypertestProviderCloud<Context>;
}): HypertestCore => {
  return {
    invoke: async () => {
      const contexts = await options.plugin.getCloudFunctionContexts();

      // for (const context of contexts) {
      //   options.cloudProvider.invoke('', context);
      // }

      await options.cloudProvider.invoke('', contexts[0]);
    },
    deploy: async () => {
      await options.cloudProvider.pullBaseImage();
      await options.plugin.buildImage();
      await options.cloudProvider.pushImage();
    },
  };
};
