# hypertest.

_Revolutionize your testing with our **plug-and-play** TypeScript library. Effortlessly integrates, distributing tests in the cloud to **cut runtime to just your slowest test**. Exceptionally affordable for fast, cost-effective development._

## :scroll: Project structure

- `hypertest-core` - library core
- `hypertest-plugin-cypress` - core plugin for Cypress integration
- `hypertest-runner-cypress` - Cypress test runner
- `hypertest-playground` - Playground to test all packages together

## :artificial_satellite: Setting up

```
npm i
npm run build -w packages
npm run start:runner -w packages/hypertest-playground
npm run start:core -w packages/hypertest-playground
```

## :test_tube: Run

_TBA_

## :handshake: Contribute

_TBA_

## How to handle too many requests exception

### Handling AWS exception:
If you encounter the following error when invoking AWS Lambda:
```
TooManyRequestsException: Rate Exceeded
at de_TooManyRequestsExceptionRes (/node_modules/@aws-sdk/client-lambda/dist-cjs/index.js:4441:21)
```
it means your account has hit the **Lambda concurrency or request rate limit**.

#### Solution: Request a Limit Increase from AWS

To fix this issue, you need to request a **Lambda concurrency quota increase** from AWS:

1. **Go to the AWS Service Quotas console**
   [https://console.aws.amazon.com/servicequotas/home](https://console.aws.amazon.com/servicequotas/home)

2. In the left sidebar, click **"AWS services"**, then search for **"Lambda"**.

3. Click on **"Lambda"** to view all available quotas.

4. Look for the following quotas (depending on your use case):
   - `Concurrent executions`
   - `Requests per second (RPS)` for function invocations
   - `GetFunction, InvokeFunction and other API request limits`

5. Click on the relevant quota, then click **"Request quota increase"**.

6. Fill in the new limit you need (e.g., 500, 1000, or more) and submit the request.

7. AWS will usually review and approve your request within 1 business day.
