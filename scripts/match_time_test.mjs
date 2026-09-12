#!/usr/bin/env node
import assert from 'node:assert/strict';
import { formatSaudiMatchTime, hasSaudiMatchTimePassed, parseBasriMatchClock } from '../web/core/match-time.js';

assert.deepEqual(parseBasriMatchClock('03:00'), { hour: 15, minute: 0, raw: '03:00' });
assert.equal(formatSaudiMatchTime('03:00'), '3:00 م');
assert.equal(formatSaudiMatchTime('04:30'), '4:30 م');
assert.equal(formatSaudiMatchTime('15:00'), '3:00 م');
assert.equal(formatSaudiMatchTime('03:00 AM'), '3:00 ص');
assert.equal(formatSaudiMatchTime('03:00 PM'), '3:00 م');
assert.equal(formatSaudiMatchTime('12:15'), '12:15 م');
assert.equal(formatSaudiMatchTime('00:15'), '12:15 ص');
assert.equal(hasSaudiMatchTimePassed('03:00', new Date('2026-09-12T12:15:00Z')), true); // 15:15 Riyadh
assert.equal(hasSaudiMatchTimePassed('04:00', new Date('2026-09-12T12:15:00Z')), false);
console.log('PASS Saudi match time normalization');
