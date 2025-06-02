export interface Check {
  title: string;
  description: string;
  run: () => Promise<unknown>;
  children: [];
}

export class CheckError extends Error {
  constructor(public readonly problem: string) {
    super(problem);
  }
}
