import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  Handler,
} from 'aws-lambda';
import { execSync } from 'child_process';
import { writeFile } from 'node:fs/promises';
import chromium from '@sparticuz/chromium';

const contexts = [
  {
    grepString: '^chromium\\sdemo-todo-app\\.spec\\.ts\\sdesc\\stest2$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sshould\\sallow\\sme\\sto\\sadd\\stodo\\sitems$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sNested\\sdescribe\\sSuper\\snested\\stest$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sshould\\sclear\\stext\\sinput\\sfield\\swhen\\san\\sitem\\sis\\sadded$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sshould\\sappend\\snew\\sitems\\sto\\sthe\\sbottom\\sof\\sthe\\slist$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sMark\\sall\\sas\\scompleted\\sshould\\sallow\\sme\\sto\\smark\\sall\\sitems\\sas\\scompleted$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sMark\\sall\\sas\\scompleted\\sshould\\sallow\\sme\\sto\\sclear\\sthe\\scomplete\\sstate\\sof\\sall\\sitems$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sMark\\sall\\sas\\scompleted\\scomplete\\sall\\scheckbox\\sshould\\supdate\\sstate\\swhen\\sitems\\sare\\scompleted\\s/\\scleared$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sItem\\sshould\\sallow\\sme\\sto\\smark\\sitems\\sas\\scomplete$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sItem\\sshould\\sallow\\sme\\sto\\sun-mark\\sitems\\sas\\scomplete$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sItem\\sshould\\sallow\\sme\\sto\\sedit\\san\\sitem$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sEditing\\sshould\\shide\\sother\\scontrols\\swhen\\sediting$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sEditing\\sshould\\ssave\\sedits\\son\\sblur$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sEditing\\sshould\\strim\\sentered\\stext$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sEditing\\sshould\\sremove\\sthe\\sitem\\sif\\san\\sempty\\stext\\sstring\\swas\\sentered$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sEditing\\sshould\\scancel\\sedits\\son\\sescape$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sCounter\\sshould\\sdisplay\\sthe\\scurrent\\snumber\\sof\\stodo\\sitems$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sClear\\scompleted\\sbutton\\sshould\\sdisplay\\sthe\\scorrect\\stext$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sClear\\scompleted\\sbutton\\sshould\\sremove\\scompleted\\sitems\\swhen\\sclicked$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sClear\\scompleted\\sbutton\\sshould\\sbe\\shidden\\swhen\\sthere\\sare\\sno\\sitems\\sthat\\sare\\scompleted$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sPersistence\\sshould\\spersist\\sits\\sdata$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sRouting\\sshould\\sallow\\sme\\sto\\sdisplay\\sactive\\sitems$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sRouting\\sshould\\srespect\\sthe\\sback\\sbutton$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sRouting\\sshould\\sallow\\sme\\sto\\sdisplay\\scompleted\\sitems$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sRouting\\sshould\\sallow\\sme\\sto\\sdisplay\\sall\\sitems$',
  },
  {
    grepString:
      '^chromium\\sdemo-todo-app\\.spec\\.ts\\sRouting\\sshould\\shighlight\\sthe\\scurrently\\sapplied\\sfilter$',
  },
  { grepString: '^chromium\\sexample\\.spec\\.ts\\shas\\stitle$' },
  {
    grepString: '^chromium\\sexample\\.spec\\.ts\\sget\\sstarted\\slink$',
  },
  {
    grepString:
      '^chromium\\sfoo/bar/sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\ssuper\\snested\\stest2$',
  },
  {
    grepString:
      '^chromium\\sfoo/bar/sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sfor\\ssome1$',
  },
  {
    grepString:
      '^chromium\\sfoo/bar/sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sfor\\ssome2$',
  },
  {
    grepString:
      '^chromium\\sfoo/bar/sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sforEach\\ssome1$',
  },
  {
    grepString:
      '^chromium\\sfoo/bar/sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sforEach\\ssome2$',
  },
];

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const configTemplate = (json: any) => `
import userConfig from './playwright.config.js';

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
    headless: chromium.headless,
  };

  await writeFile('./_playwright.config.ts', configTemplate(opts));

  // TODO:
  execSync(
    `npx playwright test --grep "${contexts[0].grepString}" -c _playwright.config.ts`,
    { stdio: 'inherit', cwd: '/workspace/packages/hypertest-playground' },
  );
}

main();

// console.log("Hello from playwright runner!");

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log('Hello from playwright runner inside handler!');

  execSync(
    `PLAYWRIGHT_BROWSERS_PATH=/workspace/pw-browsers npx playwright test --grep "${contexts[0].grepString}"`,
    { stdio: 'inherit', cwd: '/workspace/packages/hypertest-playground' },
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' }),
  };
};
