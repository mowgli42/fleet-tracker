import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { UserRole } from '../../src/lib/types/fleet.ts';
import {
  authorizeAction,
  canAccessVehicle,
  canPerform,
  type FleetAction
} from '../../src/lib/auth/accessControlRules.ts';

type AuthWorld = { role: UserRole | null; result: ReturnType<typeof authorizeAction> | null; allowed: boolean };

function world(): AuthWorld {
  return (globalThis as unknown as { __authWorld: AuthWorld }).__authWorld;
}

Before(function () {
  (globalThis as unknown as { __authWorld: AuthWorld }).__authWorld = { role: null, result: null, allowed: false };
});

Given('a user with role {string}', function (role: string) {
  world().role = role as UserRole;
});

Given('authorized vehicles {string} only', function (_ids: string) {
  (world() as AuthWorld & { ids?: Set<string> }).ids = new Set(['v1']);
});

When('an unauthenticated user attempts {string}', function (action: string) {
  world().result = authorizeAction(null, action as FleetAction);
});

When('they attempt {string}', function (action: string) {
  world().result = authorizeAction(world().role, action as FleetAction);
});

When('access to vehicle {string} is checked', function (vehicleId: string) {
  const ids = (world() as AuthWorld & { ids?: Set<string> }).ids ?? new Set();
  world().allowed = canAccessVehicle(vehicleId, ids);
});

Then('authorization should fail with status {int}', function (status: number) {
  assert.ok(world().result && !world().result.ok);
  assert.equal(world().result.status, status);
});

Then('driver role may {string}', function (action: string) {
  assert.ok(canPerform('driver', action as FleetAction));
});

Then('vehicle access should be denied', function () {
  assert.equal(world().allowed, false);
});
