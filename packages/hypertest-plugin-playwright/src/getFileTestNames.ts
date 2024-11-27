import { TestDescription } from '@hypertest/hypertest-core';
import * as fs from 'fs';
import * as ts from 'typescript';
import { v1 } from 'uuid';

const SEPARATOR = v1();

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
`;

const globalFunctionProxyFactory = (
  names: Pick<TestDescription, 'testName' | 'contextPath'>[],
) => {
  const proxy = new Proxy(() => {}, {
    apply: () => {
      return;
    },
    get: (target, prop) => {
      if (Symbol.unscopables === prop) {
        return undefined;
      }
      if (prop === 'eval') {
        // biome-ignore lint/security/noGlobalEval: <explanation>
        return eval;
      }
      if (prop === 'console') {
        return console;
      }
      if (prop === 'test') {
        console.log('test2');
        const fn = (name: string) => {
          console.log(name);
          return name;
        };
        return new Proxy(fn, {
          get: (target, prop) => {
            if (Symbol.unscopables === prop) {
              return undefined;
            }
            if (prop === 'describe') {
              return;
            }
            return proxy;
          },
        });
      }

      console.log('get', prop);

      return proxy;
    },
    has: () => {
      return true;
    },
  });

  return proxy;
};

export const getFileTestNames = async (
  filePath: string,
): Promise<Pick<TestDescription, 'testName' | 'contextPath'>[]> => {
  const fileContent = fs
    .readFileSync(filePath, 'utf8')
    .replace('import', '// import');

  let result = ts.transpileModule(FILE_HEADER + fileContent, {});

  const names: Pick<TestDescription, 'testName' | 'contextPath'>[] = [];
  const globalFunctionProxy = globalFunctionProxyFactory(names);

  const originalConsoleLog = console.log;
  console.log = (message) => {
    const chain = message.split(SEPARATOR);
    const testName = chain.pop();
    names.push({
      contextPath: chain.join('/'),
      testName,
    });
  };

  new Function(
    'with (this.globalFunctionProxy) { eval(this.outputText) }',
  ).call({
    globalFunctionProxy,
    outputText: result.outputText,
  });

  console.log = originalConsoleLog;

  return names;
};
