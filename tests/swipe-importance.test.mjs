import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261027140902_private_swipe_importance.sql',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');

assert.match(migration,/create table public\.swipe_importance/i);
assert.match(migration,/importance smallint not null default 0 check \(importance in \(-1, 0, 1\)\)/i);
assert.match(migration,/primary key \(user_id, deck_id, card_id\)/i);
assert.match(migration,/alter table public\.swipe_importance enable row level security/i);
assert.match(migration,/revoke all privileges on public\.swipe_importance from public, anon, authenticated/i);
assert.match(migration,/for select to authenticated[\s\S]*?auth\.uid\(\)\) = user_id/i);
assert.match(migration,/for insert to authenticated[\s\S]*?with check \(\(select auth\.uid\(\)\) = user_id\)/i);
assert.match(migration,/for update to authenticated[\s\S]*?using \(\(select auth\.uid\(\)\) = user_id\)[\s\S]*?with check \(\(select auth\.uid\(\)\) = user_id\)/i);

assert.match(app,/type="range" min="-1" max="1" step="1"/);
assert.match(app,/aria-valuetext/);
assert.match(app,/from\('swipe_importance'\)\.select\('deck_id,card_id,importance'\)\.eq\('user_id',viewer\)/);
assert.match(app,/from\('swipe_importance'\)\.upsert\(row,\{onConflict:'user_id,deck_id,card_id'\}\)/);
assert.match(app,/e\.target\.closest\?\.\('\[data-importance-control\]'\)/,'Slider pointer input must not start a card swipe');
assert.match(app,/if\(swipeBusy\|\|importanceSaving\.size\|\|page\(\)!=='swipe'/,'A card cannot advance while its importance is unsaved');
assert.doesNotMatch(app,/localStorage/,'Private importance must never fall back to browser storage');

assert.match(css,/\.swipe-importance\{[\s\S]*?position:relative/,'Importance stays in the normal card layout');
assert.match(css,/writing-mode:horizontal-tb/,'The rating is horizontal');
assert.doesNotMatch(css,/writing-mode:vertical-lr|direction:rtl/,'No old vertical orientation can override mobile layout');
assert.match(app,/swipe-importance-scale/,'Labels must flank the horizontal control');
console.log('PASS: private three-level importance uses self-only storage and horizontal accessible UI');
