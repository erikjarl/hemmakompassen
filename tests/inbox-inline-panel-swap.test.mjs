import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const patch=source.match(/function patchInboxInsightsPanel\(\)\{[\s\S]*?(?=\nasync function fetchSchysstaList\()/)?.[0];
assert.ok(patch,'Use the production in-place inbox reflection updater');

test('FBK-02-07: AI result refresh replaces only reflection card, leaving private chat untouched',()=>{
  const changes=[],unrelated={id:'family-chat-body',value:'Mitt privata oskickade utkast'};
  const replacement={id:'updated-reflection'};
  const current={replaceWith:node=>changes.push(node)};
  const document={
    querySelector:selector=>{
      assert.equal(selector,'.inbox-insights-shortcut');
      return current;
    },
    createElement:tag=>{
      assert.equal(tag,'div');
      return {set innerHTML(html){assert.equal(html,'<section>updated</section>');},
        querySelector:selector=>{
          assert.equal(selector,'.inbox-insights-shortcut');
          return replacement;
        }};
    }
  };
  const ctx={document,page:()=> 'inkorg',inboxView:()=>'<section>updated</section>'};
  vm.runInNewContext(patch+'\nthis.patch=patchInboxInsightsPanel;',ctx);
  ctx.patch();
  assert.deepEqual(changes,[replacement]);
  assert.equal(unrelated.value,'Mitt privata oskickade utkast');
});

test('FBK-02-07: reflection patch does not operate outside inbox',()=>{
  let calls=0;
  const ctx={document:{querySelector:()=>{calls++;return null;}},page:()=> 'swipe'};
  vm.runInNewContext(patch+'\nthis.patch=patchInboxInsightsPanel;',ctx);
  ctx.patch();
  assert.equal(calls,0);
});
