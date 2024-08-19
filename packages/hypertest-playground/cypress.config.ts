import { defineConfig } from "cypress";

const config = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      let orderIndex = 0;

      on("task", {
        "order:index:get"() {
          return orderIndex;
        },
        "order:index:increment"() {
          orderIndex += 1;

          return orderIndex;
        },
        "order:index:reset"() {
          orderIndex = 0;

          return orderIndex;
        },
        log(message) {
          console.log(message);

          return null;
        },
      });
    },
  },
});

export default config;
