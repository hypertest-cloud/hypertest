export function parseStringToRegexp(str: string): string {
  return str
    .replace(/ /g, '\\s')
    .replace(/\./g, '\\.');
}
