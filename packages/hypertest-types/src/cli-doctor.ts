export interface Check {
  title: string,
  description: string,
  run: () => Promise<unknown>,
  children: [],
}
