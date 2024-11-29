import * as fs from 'node:fs';
import * as ts from 'typescript';
import { v1 } from 'uuid';

interface TestDescription {
  contextPath: string;
  testName: string;
}

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

const globalFunctionProxyFactory = (names: string[][]) => {
  const currentDescription: string[] = [];

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
        const fn = (name: string) => {
          names.push([...currentDescription, name]);
        };
        return new Proxy(fn, {
          get: (target, prop) => {
            if (Symbol.unscopables === prop) {
              return undefined;
            }
            if (prop === 'describe') {
              return (name: string, callback: () => void) => {
                currentDescription.push(name);
                callback();
                currentDescription.pop();
              };
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

export const getFileTestNames = (filePath: string): TestDescription[] => {
  const fileContent = fs
    .readFileSync(filePath, 'utf8')
    .replace('import', '// import');

  const result = ts.transpileModule(FILE_HEADER + fileContent, {});

  const names: string[][] = [];
  const globalFunctionProxy = globalFunctionProxyFactory(names);

  new Function(
    'with (this.globalFunctionProxy) { eval(this.outputText) }',
  ).call({
    globalFunctionProxy,
    outputText: result.outputText,
  });

  return names.map((paths): TestDescription => {
    const mappedPaths = paths.map((p) => p.replace(/ /g, '\\s'));
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const testName = mappedPaths.pop()!;
    return {
      contextPath: paths.join('\\s'),
      testName,
    };
  });
};
