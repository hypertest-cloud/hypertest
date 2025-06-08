ARG BASE_IMAGE
ARG TEST_DIR
ARG PLAYWRIGHT_CONFIG_FILEPATH

FROM ${BASE_IMAGE}

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

# TODO: Think about better workaround for ffmpeg library?
RUN ln -s /usr/bin/ffmpeg /tmp/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux
