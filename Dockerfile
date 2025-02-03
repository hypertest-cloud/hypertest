FROM node:slim

# Install Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

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
CMD ["node", "node_modules/@hypertest/hypertest-runner-playwright/dist/index.js"]
