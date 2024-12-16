import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin } from "@hypertest/hypertest-plugin-cypress";
import { HypertestProviderCloudAWS } from "@hypertest/hypertest-provider-cloud-aws";

const projectPath = process.env.TEST_PROJECT_PATH
if (!projectPath) {
  throw new Error('Variable TEST_PROJECT_PATH is missing.')
}

const plugin = Plugin({
  projectPath,
});

const cloudProvider = HypertestProviderCloudAWS({})

const hypertest = HypertestCore({
  plugin,
  cloudProvider
});

hypertest.run();
