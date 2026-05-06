# check=skip=InvalidDefaultArgInFrom
ARG BASE_IMAGE

FROM ${BASE_IMAGE}

ARG TEST_DIR
ARG PLAYWRIGHT_CONFIG_FILEPATH

WORKDIR /tests
# TODO: Think about keeping our sandbox more consistent,
# or just uncomment this package.json copy and install of
# all end user dependencies when hypertest libraries will be
# available in npm repository.
# COPY package.json package.json
# RUN npm i
RUN echo "{}" > package.json
RUN npm i @playwright/test dotenv
COPY ${PLAYWRIGHT_CONFIG_FILEPATH} ${PLAYWRIGHT_CONFIG_FILEPATH}
COPY ${TEST_DIR} ${TEST_DIR}
