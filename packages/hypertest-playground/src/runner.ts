import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin } from "@hypertest/hypertest-plugin-cypress";

const projectPath = process.env.TEST_PROJECT_PATH
if (!projectPath) {
  throw new Error('Variable TEST_PROJECT_PATH is missing.')
}

const plugin = Plugin({
  projectPath
});

const hypertest = HypertestCore({
  plugin,
});

hypertest.run();
