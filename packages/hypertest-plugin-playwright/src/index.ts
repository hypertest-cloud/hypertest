import {
  HypertestPlugin,
} from "@hypertest/hypertest-core";
import { PlaywrightPluginOptions } from "./types.js";

export const Plugin = (options: PlaywrightPluginOptions): HypertestPlugin => ({
  getTestDescription: async () => new Promise(async (resolve, reject) => {


    resolve([])
  }),
});
