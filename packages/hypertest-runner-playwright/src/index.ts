import { APIGatewayEvent, Context } from "aws-lambda";

// For fonts sparticuz "hack"
process.env.HOME = '/tmp';

const { execSync } = require('node:child_process');
const fs = require('fs-extra');
const chromium = require('@sparticuz/chromium');

const printConfigTemplate = (json: Record<string, unknown>) => `
import userConfig from '/function/playwright.config.js';
// biome-ignore lint/complexity/noForEach: <explanation>
userConfig.projects?.forEach((p) => {
  if (!p.use) {
    p.use = {};
  }
  if (!p.use.launchOptions) {
    p.use.launchOptions = {};
  }
  p.use.launchOptions = {
    ...p.use.launchOptions,
    ...${JSON.stringify(json, null, 2)}
  };
});
// biome-ignore lint/style/noDefaultExport: <explanation>
export default userConfig;
`;

async function main() {
  const opts = {
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  };

  await fs.writeFile('/tmp/_playwright.config.ts', printConfigTemplate(opts));

  execSync('npx playwright test -c /tmp/_playwright.config.ts', {
    stdio: 'inherit',
  });
}

// const sendScreenshot = () => {
//   const report = fs.readJsonSync('/tmp/playwright-results.json');
//   console.log(report);

//   try {
//     // Replace with the actual filename in /tmp
//     const imagePath = '/tmp/failure-image.png';

//     // Read image file in binary
//     const imgData = fs.readFileSync(imagePath);

//     // Convert the binary data to Base64
//     const imgBase64 = imgData.toString('base64');

//     // Return the response object

//     return {
//       statusCode: 200,
//       headers: {
//         'Content-Type': 'image/png',
//         'Content-Length': imgData.length.toString(),
//       },
//       // Important for binary data:
//       isBase64Encoded: true,
//       body: imgBase64,
//       report,
//     };
//   } catch (err) {
//     console.error('Error reading or returning image:', err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: 'Failed to return image.' }),
//       report,
//     };
//   }
// };

const handler = async (event: APIGatewayEvent, context: Context) => {
  console.log('Hello Im lambda handler', process.env);

  try {
    await main();
  } catch (err) {
    console.log(err);
  }

  // return sendScreenshot();
};

module.exports = {
  handler,
};
