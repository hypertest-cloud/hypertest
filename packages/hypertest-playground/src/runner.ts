import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin } from "@hypertest/hypertest-plugin-cypress";

const plugin = Plugin({
  path: 'C://Praca//hypertest//packages//hypertest-playground'
});

const hypertest = HypertestCore({
  plugin,
});

hypertest.run().then(console.log);
