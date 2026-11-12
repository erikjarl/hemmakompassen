import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');

test('completed personal profile puts interpretation before technical score table',()=>{
  const start=source.indexOf("return completedHeading+'<section class=\"live-panel pf-results\"");
  assert.ok(start>=0,'completed result section exists');
  const end=source.indexOf("+'</section>'+sharing+comparison",start);
  assert.ok(end>start,'completed result section closes before sharing');
  const section=source.slice(start,end);
  const chart=section.indexOf('percentileChart(own)');
  const feedback=section.indexOf("analysisPanel('personality','own'");
  const table=section.indexOf('table(own)');
  const caveat=section.indexOf('referenceCaveat()');
  assert.ok(chart>=0&&feedback>chart&&table>feedback&&caveat>table,
    'chart, interpretation, score table and limitations are all accessible in that order');
  assert.ok(section.includes("data-pf-action=\"review\""),'reviewing own answers stays available');
});

test('paired profile comparison puts reflection ahead of detailed score table',()=>{
  const start=source.indexOf("comparison='<section class=\"live-panel pf-comparison\"");
  assert.ok(start>=0,'paired comparison section exists');
  const end=source.indexOf('    // The introductory questionnaire instructions',start);
  assert.ok(end>start);
  const section=source.slice(start,end);
  const chart=section.indexOf('percentileChart(own,other)');
  const reflection=section.indexOf('+reflections+');
  const table=section.indexOf('table(own,other)');
  const caveat=section.indexOf('referenceCaveat()');
  assert.ok(chart>=0&&reflection>chart&&table>reflection&&caveat>table,
    'comparison chart, interpretation, score table and limitations retain their order');
  assert.ok(source.includes('const sharing=isSharingEnabled?'), 'sharing controls remain separate');
});
