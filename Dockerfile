FROM mcr.microsoft.com/playwright:v1.49.0
# FROM node:20

# RUN apt-get update && apt-get install -y \
#     g++ \
#     make \
#     cmake \
#     unzip \
#     libcurl4-openssl-dev \
#     autoconf \
#     libtool

ENV NPM_CONFIG_CACHE=/tmp/.npm

# # To cache the npm install step
# RUN npm install -g aws-lambda-ric

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

# WORKDIR /workspace
WORKDIR /workspace/packages/hypertest-playground

# Install Chromium with dependencies
# TODO: Install Chrome with dependencies directly in image without playwright commands
# which is a temporary solution
# https://github.com/microsoft/playwright-dotnet/issues/2058
# RUN PLAYWRIGHT_BROWSERS_PATH=/workspace/pw-browsers npx playwright install --with-deps chromium

# ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]

# CMD ["node_modules/@hypertest/hypertest-runner-playwright/dist/index.handler"]

ENTRYPOINT [ "npx", "playwright" ]

CMD [ "test" ]
