import vehiclesData from '$lib/data/vehicles.json';

const vehicles = vehiclesData as { id: string }[];

/** Prerender a page for each vehicle id (static adapter). */
export function entries() {
  return vehicles.map((v) => ({ id: v.id }));
}

export function load() {
  return {};
}
