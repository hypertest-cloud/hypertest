import { TestDescription } from '@hypertest/hypertest-core';
import * as fs from 'fs';
import * as ts from "typescript";
import { v1 } from 'uuid'

const SEPARATOR = v1()

const FILE_HEADER = `
  const currentDescription = []

  const test = (name) => {
    if (currentDescription.length > 0) {
      console.log(currentDescription.join('${SEPARATOR}') + '${SEPARATOR}' + name);
    } else {
     console.log(name);
    }
  }

  test.beforeEach = () => {}
  test.afterEach = () => {}
  test.describe = (name, callback) => {
    currentDescription.push(name)
    callback()
    currentDescription.pop()
  }
`

export const getFileTestNames = async (filePath: string): Promise<Pick<TestDescription, 'testName' | 'contextPath'>[]> => {
  const fileContent = fs.readFileSync(filePath, 'utf8')
    .replace('import', '// import')

  let result = ts.transpileModule(FILE_HEADER + fileContent, {});

  const names: Pick<TestDescription, 'testName' | 'contextPath'>[] = []

  const originalConsoleLog = console.log;
  console.log = (message) => {
    const chain = message.split(SEPARATOR)
    const testName = chain.pop()
    names.push({
      contextPath: chain.join('/'),
      testName,
    })
  };

  let runnalbe:any = eval(result.outputText);

  console.log = originalConsoleLog;

  return names
}
