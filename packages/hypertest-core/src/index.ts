import { loadConfig } from './config.js';
import type {
  HypertestProviderCloud,
  HypertestPlugin,
  HypertestConfig,
  CommandOptions,
} from '@hypertest/hypertest-types';

interface HypertestCore {
  deploy: () => Promise<void>;
  invoke: () => Promise<void>;
}

export const defineConfig = (config: HypertestConfig) => config;

export const setupHypertest = async ({ dryRun }: CommandOptions) => {
  const config = await loadConfig();

  // const { HypertestProviderCloudAWS } = await import(
  //   '@hypertest/hypertest-provider-cloud-aws'
  // );
  // const cloudProvider = HypertestProviderCloudAWS(config.cloudProvider, config);

  // const { Plugin } = await import('@hypertest/hypertest-plugin-playwright');
  // const plugin = Plugin({
  //   options: {},
  //   config,
  //   dryRun: process.env.DRY_RUN !== undefined,
  //   cloudProvider,
  // });

  const cloudProvider = config.plugins.cloudPlugin.handler(config, { dryRun });
  const plugin = config.plugins.testPlugin.handler(config, cloudProvider, {
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
      for (const context of contexts) {
        options.cloudProvider.invoke('', context);
      }
    },
    deploy: async () => {
      await options.cloudProvider.pullBaseImage();
      const image = await options.plugin.buildImage();
      const imageReference = await options.cloudProvider.pushImage(image);

      console.log({ imageReference });
    },
  };
};
