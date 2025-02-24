FROM node:slim

# Set working directory
WORKDIR /workspace

# Copy package files
COPY . ./

# TODO: By default we will work in playground lvl dir, now it is not possible because our sub packages are not exposed by npm registry.
WORKDIR /workspace/packages/hypertest-playground
RUN npm i

# TODO: Later when we go live this will be fetched from npm registry
WORKDIR /workspace/packages/hypertest-runner-playwright
RUN npm i
RUN npm run build

# Later, when we go live
# RUN npm i @hypertest/hypertest-runner-playwright

WORKDIR /workspace

# Install Chromium with dependencies
# TODO: Install Chrome with dependencies directly in image without playwright commands
# which is a temporary solution
# https://github.com/microsoft/playwright-dotnet/issues/2058
RUN PLAYWRIGHT_BROWSERS_PATH=/workspace/pw-browsers npx playwright install --with-deps chromium

CMD ["node", "node_modules/@hypertest/hypertest-runner-playwright/dist/index.js"]
