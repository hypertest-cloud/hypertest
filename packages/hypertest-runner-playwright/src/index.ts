import { execSync } from "child_process";

console.log("Hello from playwright runner!");

const contexts = [
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sdesc\\stest2$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sshould\\sallow\\sme\\sto\\sadd\\stodo\\sitems$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sNested\\sdescribe\\sSuper\\snested\\stest$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sshould\\sclear\\stext\\sinput\\sfield\\swhen\\san\\sitem\\sis\\sadded$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sNew\\sTodo\\sshould\\sappend\\snew\\sitems\\sto\\sthe\\sbottom\\sof\\sthe\\slist$'  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sMark\\sall\\sas\\scompleted\\sshould\\sallow\\sme\\sto\\smark\\sall\\sitems\\sas\\scompleted$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sMark\\sall\\sas\\scompleted\\sshould\\sallow\\sme\\sto\\sclear\\sthe\\scomplete\\sstate\\sof\\sall\\sitems$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sMark\\sall\\sas\\scompleted\\scomplete\\sall\\scheckbox\\sshould\\supdate\\sstate\\swhen\\sitems\\sare\\scompleted\\s/\\scleared$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sItem\\sshould\\sallow\\sme\\sto\\smark\\sitems\\sas\\scomplete$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sItem\\sshould\\sallow\\sme\\sto\\sun-mark\\sitems\\sas\\scomplete$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sItem\\sshould\\sallow\\sme\\sto\\sedit\\san\\sitem$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sEditing\\sshould\\shide\\sother\\scontrols\\swhen\\sediting$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sEditing\\sshould\\ssave\\sedits\\son\\sblur$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sEditing\\sshould\\strim\\sentered\\stext$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sEditing\\sshould\\sremove\\sthe\\sitem\\sif\\san\\sempty\\stext\\sstring\\swas\\sentered$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sEditing\\sshould\\scancel\\sedits\\son\\sescape$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sCounter\\sshould\\sdisplay\\sthe\\scurrent\\snumber\\sof\\stodo\\sitems$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sClear\\scompleted\\sbutton\\sshould\\sdisplay\\sthe\\scorrect\\stext$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sClear\\scompleted\\sbutton\\sshould\\sremove\\scompleted\\sitems\\swhen\\sclicked$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sClear\\scompleted\\sbutton\\sshould\\sbe\\shidden\\swhen\\sthere\\sare\\sno\\sitems\\sthat\\sare\\scompleted$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sPersistence\\sshould\\spersist\\sits\\sdata$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sRouting\\sshould\\sallow\\sme\\sto\\sdisplay\\sactive\\sitems$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sRouting\\sshould\\srespect\\sthe\\sback\\sbutton$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sRouting\\sshould\\sallow\\sme\\sto\\sdisplay\\scompleted\\sitems$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sRouting\\sshould\\sallow\\sme\\sto\\sdisplay\\sall\\sitems$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\demo-todo-app\\.spec\\.ts\\sRouting\\sshould\\shighlight\\sthe\\scurrently\\sapplied\\sfilter$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\example\\.spec\\.ts\\shas\\stitle$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\example\\.spec\\.ts\\sget\\sstarted\\slink$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\foo\\bar\\sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\ssuper\\snested\\stest2$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\foo\\bar\\sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sfor\\ssome1$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\foo\\bar\\sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sfor\\ssome2$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\foo\\bar\\sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sforEach\\ssome1$'
  },
  {
    grepString: '^chromium\\splaywright\\tests\\foo\\bar\\sometest\\.spec\\.ts\\ssuper\\snested\\sdesc\\sforEach\\ssome2$'
  }
]

execSync('pwd', { stdio: "inherit", cwd: "/workspace/packages/hypertest-playground" })
execSync(`npx playwright test --grep  ${contexts[0].grepString}`, { stdio: "inherit", cwd: "/workspace/packages/hypertest-playground" });
