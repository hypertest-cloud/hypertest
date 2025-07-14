export interface Check {
  title: string;
  description: string;
  run: () => Promise<{ message: string; data: Record<string, unknown> | null }>;
  children: [];
}

export class CheckError extends Error {
  constructor(public readonly problem: string) {
    super(problem);
  }
}
