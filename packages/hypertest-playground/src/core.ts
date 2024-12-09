import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin as playwrightPlugin } from "@hypertest/hypertest-plugin-playwright";

const plugin = playwrightPlugin({
  lambdaEnvironment: 'unix',
  playwrightConfig: {
    testDirectory: 'playwright/tests',
    projectName: 'chromium',
  }
});

const hypertest = HypertestCore({
  plugin,
});

hypertest.run();
