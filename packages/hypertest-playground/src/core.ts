import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin as playwrightPlugin } from "@hypertest/hypertest-plugin-playwright";

const projectPath = process.env.TEST_PROJECT_PATH;
if (!projectPath) {
  throw new Error("Variable TEST_PROJECT_PATH is missing.");
}

const plugin = playwrightPlugin({
  projectPath,
});

const hypertest = HypertestCore({
  plugin,
});

hypertest.run();
