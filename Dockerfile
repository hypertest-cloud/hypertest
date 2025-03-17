FROM node:20-bookworm

ARG FUNCTION_DIR="/workspace"

# Copy function code
RUN mkdir -p ${FUNCTION_DIR}
WORKDIR ${FUNCTION_DIR}

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ make cmake unzip libcurl4-openssl-dev poppler-utils \
	build-essential autoconf automake libtool m4 python3 libssl-dev

RUN npm install -g aws-lambda-ric

# Fixes browser binaries not being found
ENV PLAYWRIGHT_BROWSERS_PATH=0
# ENV PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1

# Install Node.js dependencies
COPY package.json ${FUNCTION_DIR}

RUN npm update & npm install

RUN npm install @playwright/test
RUN npm install playwright
# As per the Playwright documentation, we need to install the browsers
RUN npm install playwright-core
RUN npm install @sparticuz/chromium

# RUN npx -y playwright install --with-deps --force --no-shell chromium

# Required for Node runtimes which use npm@8.6.0+ because
# by default npm writes logs under /home/.npm and Lambda fs is read-only
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Do this last so code changes don't cause a full rebuild
COPY index.js ${FUNCTION_DIR}
COPY playwright.config.ts ${FUNCTION_DIR}
COPY playwright ${FUNCTION_DIR}/playwright
RUN ls
RUN cat package.json
ENV DEBUG=pw:browser,pw:protocol

RUN apt-get install -y fontconfig
ENV FONTCONFIG_PATH=/tmp/fonts
ENV FONTCONFIG_FILE=/tmp/fonts/fonts.conf

RUN npm i fs-extra

# Set runtime interface client as default command for the container runtime
# and for some reason /usr/local/bin/npx is a symbolic link to /usr/local/lib/node_modules/npm/bin/npx-cli.js
ENTRYPOINT ["/usr/local/lib/node_modules/npm/bin/npx-cli.js", "aws-lambda-ric"]
# Pass the name of the function handler as an argument to the runtime
CMD ["index.handler"]
