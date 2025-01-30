FROM node:latest

COPY . /workspace

# TODO By default we will work in playground lvl dir, now it is not possible because our sub packages are not exposed by npm registry.
WORKDIR /workspace/packages/hypertest-playground
RUN npm i

# TODO Later when we go live this will be fetched from npm registry
WORKDIR /workspace/packages/hypertest-runner-playwright
RUN npm i
RUN npm run build

# Later, when we go live
# RUN npm i @hypertest/hypertest-runner-playwright

WORKDIR /workspace
CMD ["node", "node_modules/@hypertest/hypertest-runner-playwright/dist/index.js"]
