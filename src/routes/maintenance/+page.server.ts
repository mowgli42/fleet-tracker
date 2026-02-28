import componentsData from '$lib/data/components.json';

const components = componentsData as string[];

export function load() {
  return { components };
}
