import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  projectionSourceLabel,
  reportHasOutboxDepth,
  shouldShowFlushError
} from '../../src/lib/sync/syncOperationsRules.ts';

type SyncUiWorld = { label: string; report: { outbox: { count: number } }; showError: boolean };

function world(): SyncUiWorld {
  return (globalThis as unknown as { __syncUiWorld: SyncUiWorld }).__syncUiWorld;
}

Before(function () {
  (globalThis as unknown as { __syncUiWorld: SyncUiWorld }).__syncUiWorld = {
    label: '',
    report: { outbox: { count: 0 } },
    showError: false
  };
});

When('sync projection source is {string}', function (source: string) {
  world().label = projectionSourceLabel(source as 'local' | 'cloud');
});

Given('a sync report with outbox count {int}', function (n: number) {
  world().report = { outbox: { count: n } };
});

Given('last flush error {string}', function (msg: string) {
  world().showError = shouldShowFlushError(msg);
});

Then('projection label should be {string}', function (expected: string) {
  assert.equal(world().label, expected);
});

Then('the report should expose outbox depth', function () {
  assert.ok(reportHasOutboxDepth(world().report));
});

Then('flush error should be shown', function () {
  assert.equal(world().showError, true);
});
