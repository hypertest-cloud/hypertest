import { defineConfig } from "cypress";

const config = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {}
  },
});


export default config
