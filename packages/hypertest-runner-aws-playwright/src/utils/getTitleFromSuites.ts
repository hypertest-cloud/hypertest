interface Spec {
  title: string;
}
interface Suite {
  title: string;
  specs?: Spec[];
  suites?: Suite[];
}

const getNestedTitles = (nestedObject: Suite | Spec): string[] => {
  if ('suites' in nestedObject && nestedObject.suites) {
    const firstSuite = nestedObject.suites.at(0);
    if (!firstSuite) {
      return [nestedObject.title];
    }
    return [nestedObject.title, ...getNestedTitles(firstSuite)];
  }

  if ('specs' in nestedObject && nestedObject.specs) {
    const firstSpec = nestedObject.specs.at(0);
    if (!firstSpec) {
      return [nestedObject.title];
    }
    return [nestedObject.title, firstSpec.title];
  }

  return [nestedObject.title];
};

// Find out more robust solution
export const getTitleFromSuites = (suites: Suite[]): string => {
  const firstSuite = suites.at(0);
  if (!firstSuite) {
    return 'unknown';
  }
  const titles = getNestedTitles(firstSuite);

  return titles.join(' > ');
};
