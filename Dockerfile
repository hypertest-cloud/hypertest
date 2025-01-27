FROM node:latest
WORKDIR /workspace/packages/hypertest-playground

COPY . /workspace

RUN npm i
RUN ls -la

CMD echo "Hello, World!!3"
