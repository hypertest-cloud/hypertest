import { readFileSync } from 'node:fs';
import { transpileModule } from 'typescript';

const globalFunctionProxyFactory = (names: string[][]) => {
  const currentDescription: string[] = [];

  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op proxy target
  const proxy = new Proxy(() => {}, {
    apply: () => {
      return;
    },
    get: (_target, prop) => {
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
          get: (_target, prop) => {
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

      return proxy;
    },
    has: () => {
      return true;
    },
  });

  return proxy;
};

export const getTestContextPaths = (filePath: string): string[] => {
  // TODO handle other types of imports
  const fileContent = readFileSync(filePath, 'utf8').replace(
    'import',
    '// import',
  );

  const result = transpileModule(fileContent, {});

  const contextPaths: string[][] = [];
  const globalFunctionProxy = globalFunctionProxyFactory(contextPaths);

  new Function(
    'with (this.globalFunctionProxy) { eval(this.outputText) }',
  ).call({
    globalFunctionProxy,
    outputText: result.outputText,
  });

  return contextPaths.map((paths): string => {
    return paths.join(' ');
  });
};
