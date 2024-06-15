import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin as CypressPlugin } from "@hypertest/hypertest-plugin-cypress";

const plugin = CypressPlugin({
  path: 'C://Praca//hypertest//packages//hypertest-playground'
});

const hypertest = HypertestCore({
  plugin,
});

hypertest.run();
