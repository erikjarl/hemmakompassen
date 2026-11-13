import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const expected = html.match(/<meta\s+name=["']hk-ui-version["']\s+content=["']([^"']+)["']/i)?.[1];
assert.ok(expected, 'index.html måste innehålla versionsmarkören');

function run(url) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [new URL('../scripts/verify-pages.mjs', import.meta.url).pathname], {
      env: {...process.env, HK_PAGES_URL:url}, stdio:['ignore','pipe','pipe']
    });
    let stdout='', stderr='';
    child.stdout.on('data', chunk=>{stdout+=chunk;});
    child.stderr.on('data', chunk=>{stderr+=chunk;});
    child.on('error', reject);
    child.on('close', code=>resolve({code,stdout,stderr}));
  });
}
async function withPage(status, body, fn) {
  const server=createServer((_req,res)=>{
    res.writeHead(status, {'content-type':'text/html; charset=utf-8'});
    res.end(body);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    return await fn('http://127.0.0.1:'+server.address().port+'/index.html');
  } finally {
    await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  }
}
const page = value => '<!doctype html><meta name="hk-ui-version" content="'+value+'">';

test('publicerad och lokal version matchar', async ()=>{
  await withPage(200,page(expected),async url=>{
    const result=await run(url);
    assert.equal(result.code,0);
    assert.match(result.stdout,/PASS: versionerna matchar/);
  });
});
test('versionsskillnad ger FAIL, inte PASS',async ()=>{
  await withPage(200,page(expected+'-older'),async url=>{
    const result=await run(url);
    assert.equal(result.code,1);
    assert.match(result.stderr,/FAIL: den publicerade versionen skiljer sig/);
  });
});
test('saknad versionsmarkör ger BLOCKERAD',async ()=>{
  await withPage(200,'<!doctype html><title>Ingen version</title>',async url=>{
    const result=await run(url);
    assert.equal(result.code,2);
    assert.match(result.stderr,/BLOCKERAD/);
  });
});
test('HTTP-fel ger BLOCKERAD',async ()=>{
  await withPage(503,'Unavailable',async url=>{
    const result=await run(url);
    assert.equal(result.code,2);
    assert.match(result.stderr,/HTTP 503/);
  });
});
