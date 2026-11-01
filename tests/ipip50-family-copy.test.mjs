import test from 'node:test';
import assert from 'node:assert/strict';
import {IPIP50_V1} from '../personality/ipip50-v1.js';
import {THEME_DECK_MODELS} from '../card-catalog.js';
import {buildIPIP50FamilyInsights} from '../personality/ipip50-family-insights.js';
import {richFamilyReflection,FAMILY_REFLECTION_RESOURCES} from '../personality/ipip50-family-copy.js';

const sums=(override={})=>Object.fromEntries(IPIP50_V1.factors.map(f=>[f.id,override[f.id]??30]));
const scenario=(factorId,parentScore,teenScore)=>{
  const comparison=buildIPIP50FamilyInsights({parent:sums({[factorId]:parentScore}),teen:sums({[factorId]:teenScore})});
  return comparison.items.find(i=>i.factorId===factorId);
};

test('every scale and relationship condition has substantive, different parent/teen text',()=>{
  for(const factor of IPIP50_V1.factors){
    for(const [p,t,status,direction] of [
      [46,25,'notable','parentHigher'],
      [20,41,'notable','teenHigher'],
      [30,30,'similarity','equal'],
      [30,24,'moderate','parentHigher']
    ]){
      const item=scenario(factor.id,p,t);
      assert.equal(item.status,status);
      assert.equal(item.direction,direction);
      const parent=richFamilyReflection(item,'parent');
      const teen=richFamilyReflection(item,'teen');
      assert.ok(parent.paragraph.length>=220,factor.id+' parent length');
      assert.ok(teen.paragraph.length>=190,factor.id+' teen length');
      assert.notEqual(parent.paragraph,teen.paragraph);
      for(const detail of [parent,teen]){
        assert.ok(detail.resource.href.startsWith('#'));
        assert.ok(detail.resource.title);
        assert.ok(detail.resource.instruction);
        assert.doesNotMatch(detail.resource.href,/medlare/);
      }
    }
  }
});
test('only functional navigation targets and actual Gillaswajpen deck titles are linked',()=>{
  const ids=THEME_DECK_MODELS.map(deck=>deck.title);
  for(const resource of Object.values(FAMILY_REFLECTION_RESOURCES)){
    assert.ok(['#swipe','#kommunikation','#regler'].includes(resource.href),resource.href);
    if(resource.href==='#swipe'){
      assert.ok(ids.some(title=>resource.title.includes(title)),resource.title);
    }
  }
});
test('teen-focused emotional regulation does not shift parent responsibility to the child',()=>{
  const item=scenario('emotional_stability',20,43);
  const teen=richFamilyReflection(item,'teen').paragraph;
  const parent=richFamilyReflection(item,'parent').paragraph;
  assert.match(teen,/inte ditt ansvar/);
  assert.match(parent,/inte.*bära dina känslor/);
});
test('reflections reject unknown roles and invalid factor definitions',()=>{
  const item=scenario('extraversion',40,20);
  assert.throws(()=>richFamilyReflection(item,'unknown'),RangeError);
  assert.throws(()=>richFamilyReflection({...item,factorId:'invented'},'teen'),RangeError);
});
