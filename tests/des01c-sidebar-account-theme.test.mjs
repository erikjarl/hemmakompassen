import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const stage=css.split('/* DES-01C: desktop sidebar account card in the same warm, readable palette.')[1]||'';

test('desktop sidebar account card is legible and correctly scoped',()=>{
 assert.ok(stage,'missing desktop sidebar account theme');
 assert.match(stage,/@media \(min-width:801px\)/);
 assert.match(stage,/body \.live-sidebar > \.live-panel \{/);
 assert.match(stage,/background:#fff9f1/);
 assert.match(stage,/color:#302b26/);
 assert.match(stage,/body \.live-sidebar > \.live-panel #sidebar-account/);
 assert.match(stage,/a\[href="\.\/konto\.html"\]/);
 assert.match(stage,/min-height:44px/);
 assert.match(stage,/outline:3px solid #314f60/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('the sidebar keeps account destination and live status hooks',()=>{
 assert.ok(html.includes('live-app.css?v=20261115-des01g-mediator1&theme=mediator-history2&sidebar=account-card1'));
 assert.match(html,/<aside class="live-sidebar">/);
 assert.match(html,/id="sidebar-account"/);
 assert.match(html,/href="\.\/konto\.html">Kontoinställningar/);
 assert.match(html,/id="live-desktop-nav"/);
 assert.match(html,/id="live-mobile-nav"/);
});
