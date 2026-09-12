#!/usr/bin/env node
const MATCHES = 'https://api.albasritv1.workers.dev/';
const ORIGIN = 'https://www.albasritv.abrdns.com';
const PAGE = '/2026/09/matches.html';
const headers = (extra = {}) => ({
  Accept: 'application/json',
  Origin: ORIGIN,
  Referer: ORIGIN + PAGE,
  'X-BSR-Page': PAGE,
  ...extra,
});
const session = await fetch(MATCHES + 'session', { headers: headers(), cache: 'no-store' });
const sessionData = await session.json();
if (!session.ok || !sessionData?.token) throw new Error('session failed');
const list = await fetch(MATCHES, { headers: headers({ 'X-BSR-Token': String(sessionData.token) }), cache: 'no-store' });
const data = await list.json();
if (!list.ok || !Array.isArray(data?.data)) throw new Error('match list failed');
const ended = data.data.filter((m) => Number(m?.priority) === 3 || /ended|انته/i.test(String(m?.status || '')));
const compact = (m) => ({
  team1: m?.team1?.name || '',
  team2: m?.team2?.name || '',
  goals1: m?.team1?.goals ?? null,
  goals2: m?.team2?.goals ?? null,
  status: m?.status ?? null,
  priority: m?.priority ?? null,
  time: m?.time ?? null,
});
console.log('ENDED_MATCHES', JSON.stringify(ended.map(compact), null, 2));
const targets = data.data.filter((m) => /راسينج|سانتاندير|ألافيس/i.test(`${m?.team1?.name || ''} ${m?.team2?.name || ''}`));
console.log('TARGET_MATCHES', JSON.stringify(targets.map(compact), null, 2));
const nonzero = ended.filter((m) => Number(m?.team1?.goals || 0) !== 0 || Number(m?.team2?.goals || 0) !== 0);
const placeholderZero = ended.filter((m) => String(m?.team1?.goals ?? '').trim() === '0' && String(m?.team2?.goals ?? '').trim() === '0');
console.log('SUMMARY', JSON.stringify({ total: data.data.length, ended: ended.length, endedNonzero: nonzero.length, endedPlaceholderZero: placeholderZero.length }));
if (ended.length && placeholderZero.length === ended.length) throw new Error('all ended matches are placeholder 0-0');
