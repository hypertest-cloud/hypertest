export interface Check {
  title: string;
  description: string;
  run: () => Promise<{ message: string; data: Record<string, unknown> | null }>;
  children: [];
}

export class CheckError extends Error {
  readonly problem: string;
  constructor(problem: string) {
    super(problem);
    this.problem = problem;
  }
}
