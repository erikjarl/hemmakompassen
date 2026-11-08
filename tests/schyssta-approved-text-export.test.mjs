import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const code=source.match(/function approvedSchysstaText\(rows\)\{[\s\S]*?(?=\nfunction currentApprovedSchysstaText\()/)?.[0];
assert.ok(code,'Approved-only text formatter is independently testable');
const state={};
vm.runInNewContext(code+'\nthis.format=approvedSchysstaText;',state);
const rows=[
 {status:'accepted',body:'Vi lyssnar på varandra.',agreement_id:'secret-uuid',user_id:'owner'},
 {status:'proposed',body:'PRIVAT FÖRSLAG'},
 {status:'rejected',body:'AVSLAGET'},
 {status:'withdrawn',body:'GAMMALT AVSLUT'},
 {status:'accepted',body:'Vi frågar\ninnan vi lånar saker.'}
];
const result=state.format(rows);
assert.match(result,/^Våra gemensamma överenskommelser\n\n1\. Vi lyssnar på varandra\.\n2\. Vi frågar innan vi lånar saker\.\n$/);
for(const forbidden of ['PRIVAT FÖRSLAG','AVSLAGET','GAMMALT AVSLUT','secret-uuid','owner','user_id','agreement_id']){
 assert.doesNotMatch(result,new RegExp(forbidden));
}
assert.equal(state.format([]),'');
assert.equal(state.format([{status:'proposed',body:'Ej godkänt'}]),'');
assert.equal(state.format(null),'');
assert.match(source,/if\(!schysstaListEnabled\|\|!user\|\|members\.length!==2\|\|schysstaLoading\|\|schysstaError\)return ''/);
assert.match(source,/new Blob\(\['\\uFEFF',payload\],\{type:'text\/plain;charset=utf-8'\}\)/);
assert.match(source,/link\.download='schyssta-listan-overenskommelser\.txt'/);
assert.match(source,/URL\.revokeObjectURL\(url\)/);
assert.match(source,/if\(e\.target\.closest\('\[data-schyssta-download\]'\)\)downloadSchysstaAgreements\(\)/);
console.log('PASS Schyssta downloaded text includes only accepted rules without identity or proposal fields');
