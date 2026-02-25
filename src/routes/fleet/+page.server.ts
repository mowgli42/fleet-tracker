import type { Vehicle } from '$lib/types/fleet';
import vehiclesData from '$lib/data/vehicles.json';

const vehicles = vehiclesData as Vehicle[];

export function load() {
  return { vehicles };
}
