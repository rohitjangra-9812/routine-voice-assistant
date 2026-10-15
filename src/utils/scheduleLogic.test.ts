import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  format12Hour,
  formatCountdown,
  evaluateAlertTriggers,
  findScheduleConflicts,
} from './scheduleLogic.ts';
import { ScheduleEvent } from '../types.ts';

test('timeToMinutes converts HH:MM string to total minutes correctly', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(timeToMinutes('14:15'), 855);
  assert.equal(timeToMinutes('23:59'), 1439);
});

test('minutesToTime formats total minutes back to HH:MM', () => {
  assert.equal(minutesToTime(0), '00:00');
  assert.equal(minutesToTime(570), '09:30');
  assert.equal(minutesToTime(855), '14:15');
});

test('format12Hour converts 24h format to 12h format string', () => {
  assert.equal(format12Hour('09:30'), '9:30 AM');
  assert.equal(format12Hour('12:00'), '12:00 PM');
  assert.equal(format12Hour('16:45'), '4:45 PM');
  assert.equal(format12Hour('00:15'), '12:15 AM');
});

test('formatCountdown formats remaining seconds into human readable duration', () => {
  assert.equal(formatCountdown(45), '45s');
  assert.equal(formatCountdown(150), '2m 30s');
  assert.equal(formatCountdown(3700), '1h 1m');
  assert.equal(formatCountdown(-300), 'Started 5m ago');
});

test('findScheduleConflicts detects overlapping events', () => {
  const events: ScheduleEvent[] = [
    {
      id: '1',
      title: 'Meeting 1',
      category: 'meeting',
      time: '10:00',
      durationMinutes: 60, // 10:00 to 11:00
      priority: 'high',
      enabled: true,
    },
    {
      id: '2',
      title: 'Meeting 2',
      category: 'meeting',
      time: '10:30',
      durationMinutes: 30, // 10:30 to 11:00 - OVERLAPS
      priority: 'high',
      enabled: true,
    },
    {
      id: '3',
      title: 'Lunch',
      category: 'break',
      time: '12:00',
      durationMinutes: 45, // No overlap
      priority: 'low',
      enabled: true,
    },
  ];

  const conflicts = findScheduleConflicts(events);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].eventA.title, 'Meeting 1');
  assert.equal(conflicts[0].eventB.title, 'Meeting 2');
  assert.equal(conflicts[0].overlapMinutes, 30);
});

test('evaluateAlertTriggers triggers alert within lead buffer window', () => {
  const mockNow = new Date();
  mockNow.setHours(9, 0, 0, 0); // 09:00:00 AM

  const events: ScheduleEvent[] = [
    {
      id: 'e1',
      title: 'Standup',
      category: 'meeting',
      time: '09:15', // Starts in 15 minutes
      durationMinutes: 30,
      leadTimeMinutes: 15,
      priority: 'high',
      enabled: true,
    },
  ];

  const triggeredSet = new Set<string>();
  const triggers = evaluateAlertTriggers(events, mockNow, 15, triggeredSet);

  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].event.title, 'Standup');
  assert.equal(triggers[0].triggerType, 'buffer');
  assert.equal(triggers[0].leadTimeMinutes, 15);

  // Subsequent check should not re-trigger because it's stored in triggeredSet
  const secondTriggers = evaluateAlertTriggers(events, mockNow, 15, triggeredSet);
  assert.equal(secondTriggers.length, 0);
});
