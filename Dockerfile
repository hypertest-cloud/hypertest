ARG BASE_ALPINE_IMAGE=node:22-alpine
ARG FUNCTION_DIR="/function"

FROM ${BASE_ALPINE_IMAGE} as hypertest-runner-build
ARG FUNCTION_DIR
WORKDIR ${FUNCTION_DIR}

COPY \
    ./package.json \
    ./package-lock.json \
    ./tsconfig.json \
    ./
COPY \
    ./packages/hypertest-runner-playwright/ \
    ./packages/hypertest-runner-playwright/
# COPY \
#     ./packages/hypertest-runner-playwright/src/ \
#     ./src/
RUN ls -la

RUN npm ci
RUN npm run build -w packages/hypertest-runner-playwright

# magic....


FROM node:20-bookworm
ARG FUNCTION_DIR
# RUN apt-get update && \
#     apt-get install -y \
#     g++ make cmake unzip libcurl4-openssl-dev poppler-utils \
#     build-essential autoconf automake libtool m4 python3 libssl-dev

# RUN npm install -g aws-lambda-ric

COPY --from=hypertest-runner-build ${FUNCTION_DIR} ${FUNCTION_DIR}

# ENTRYPOINT ["/usr/local/lib/node_modules/npm/bin/npx-cli.js", "aws-lambda-ric"]
# CMD ["index.handler"]