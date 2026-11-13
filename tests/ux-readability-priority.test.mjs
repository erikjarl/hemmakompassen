import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('completed theme chooser keeps primary action visible without redundant help',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function themeDecksView(completedGeneral=false){');
  const end=app.indexOf('\nfunction privateThemeAnswerReview(',start);
  assert.ok(start>=0&&end>start,'Theme chooser must exist');
  const view=app.slice(start,end);
  assert.match(view,/completedGeneral\?'<details class="swipe-more-decks">/,
    'Completed deck should keep the prominent expandable action');
  assert.match(view,/Gör fler kortlekar/);
  assert.doesNotMatch(view,/Min progression:/,'Do not repeat abstract progress jargon under the next-decks heading');
  assert.match(view,/\?startedThemes\+' av '\+THEME_DECKS\.length\+' teman påbörjade'/,'Concise private deck progress still shows the count');
  assert.match(view,/\(\(!completedGeneral\|\|!unlocked\)\?'<p class="live-muted" role="status">'\+esc\(status\)\+'<\/p>':''\)\+/,
    'Redundant help is hidden after completion for an already paired viewer');
  assert.match(view,/Koppla ihop en förälder och en tonåring/,
    'Unpaired viewer must still get an explanation');
  assert.match(view,/swipe-theme-compact-list/,'Theme choices remain available');
  assert.match(view,/Här visas bara dina egna svar/,'Privacy disclosure remains visible above compact rows');
  assert.match(view,/kort besvarade/,'Rows explain completed answers in everyday language');
  assert.match(view,/Din privata status/,'Unfinished theme view still identifies own answers');
});

test('locked theme decks explain the next step without technical pairing jargon',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function themeDecksView(completedGeneral=false){');
  const end=app.indexOf('\nfunction privateThemeAnswerReview(',start);
  assert.ok(start>=0&&end>start,'Theme deck view must exist');
  const view=app.slice(start,end);
  assert.match(view,/Para ihop era konton för att öppna kortleken\./,
    'Locked deck rows explain what the viewer can do next');
  assert.doesNotMatch(view,/Tillgänglig efter säker familjeparning/,
    'Avoid technical pairing jargon in the short locked-state label');
  assert.match(view,/Dina egna svar förblir privata/,
    'Keep the existing privacy information in the longer explanation');
});

test('unpaired theme decks offer a direct account pairing link only when needed',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function themeDecksView(completedGeneral=false){');
  const end=app.indexOf('\nfunction privateThemeAnswerReview(',start);
  assert.ok(start>=0&&end>start,'Theme deck view must exist');
  const view=app.slice(start,end);
  assert.ok(view.includes(`!unlocked&&members.length!==2?'<p><a class="live-button" href="./konto.html">Para ihop konton</a></p>':''`),
    'Only unpaired users get the direct account pairing action');
  assert.match(view,/Dina egna svar förblir privata/);
  assert.match(view,/id="retry-theme-unlock"/,'Existing unlock error retry remains available');
});

test('readability roadmap and standing workflow instruction are present',async()=>{
  const [roadmap,agents]=await Promise.all([read('docs/ACTIVE_ROADMAP.md'),read('AGENTS.md')]);
  assert.match(roadmap,/## UX-READ-01/);
  assert.match(roadmap,/Informationshierarki/);
  assert.match(roadmap,/Språkgranskning/);
  assert.match(roadmap,/Visuell läsbarhet/);
  assert.match(roadmap,/två autentiserade konton/);
  assert.match(agents,/## Stående rutin: läsbarhet och tydlighet \(UX-READ-01\)/);
});

test('Schyssta listan keeps approved rules primary without redundant quick-action text',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function schysstaView(){');
  const end=app.indexOf('\nfunction ',start+25);
  assert.ok(start>=0&&end>start);
  const view=app.slice(start,end);
  const quick=view.slice(view.indexOf('const quickActions='),view.indexOf('const searchTools='));
  assert.match(quick,/needs\.length\?'<p>Välj ett svar nedan eller Inte nu\.<\/p>':''/);
  assert.match(quick,/ongoing\.length\|\|schysstaHistory\.length/);
  assert.doesNotMatch(quick,/schyssta-quick-counts[^\n]*approved\.length/);
  assert.match(quick,/data-schyssta-needs-jump/);
  assert.match(quick,/data-schyssta-start/);
  assert.match(view,/const approvedSection=/);
  assert.match(view,/approvedSection\s*\+quickActions/);
  assert.match(view,/item\.status==='accepted'/);
  assert.match(view,/schyssta-approved-details/);
  assert.match(view,/item\.status==='accepted'\?'':' · Ditt val: '/,
    'A jointly approved rule must not repeat the already implied personal yes');
  assert.match(view,/item\.own_decision===true\?'ja':item\.own_decision===false\?'nej':'inte lämnat'/,
    'Pending or declined proposals must retain the viewer-specific vote');
});


test('Schyssta optional suggestions and getting-started card do not crowd existing decisions',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function schysstaView(){');
  const end=app.indexOf('\nfunction ',start+25);
  assert.ok(start>=0&&end>start);
  const view=app.slice(start,end);
  assert.match(view,/const firstRuleHint=rules\.length===0&&needs\.length===0&&ongoing\.length===0/,
    'Getting-started help must not compete with existing rule proposals');
  assert.match(view,/\+\(schysstaSuggestions\.length\?'<details class="schyssta-extra-panel">/,
    'An empty optional suggestion section should not occupy the default mobile flow');
  assert.match(view,/approvedSection\s*\+quickActions\s*\+\(schysstaDecisionFeedback/,
    'Approved agreements remain first and pending actions remain visible');
  assert.match(view,/\+needsSection\s*\+firstRuleHint\s*\+composeSection/,
    'Pending approvals still appear before optional compose controls');
});

test('home pending-rule message does not assume who proposed the rule',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function home(){');
  const end=app.indexOf('\nconst SCHYSSTA_UUID=',start);
  assert.ok(start>=0&&end>start,'Home section must exist');
  const home=app.slice(start,end);
  assert.match(home,/Det finns regelförslag som behöver ditt svar/);
  assert.doesNotMatch(home,/Den andra personen väntar på ditt beslut/);
  assert.match(home,/schysstaNeedsAnswer\(\)\.length/,'Only pending decisions should trigger the banner');
  assert.match(home,/href="#regler"/,'Link to the rule decision remains available');
});

test('inbox error guidance points to the real refresh control below the unread summary',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function inboxView(){');
  const end=app.indexOf('\n// Keep an in-progress chat editor intact',start);
  assert.ok(start>=0&&end>start,'Inbox view must exist');
  const inbox=app.slice(start,end);
  assert.match(inbox,/Välj Uppdatera hela inkorgen ovanför för att försöka igen/);
  assert.doesNotMatch(inbox,/Uppdatera hela inkorgen längre ned/);
  const renderedReturn=inbox.slice(inbox.lastIndexOf("  return '<h1>Inkorg</h1>'"));
  assert.ok(renderedReturn.length>0,'Inbox return markup must exist');
  assert.ok(renderedReturn.indexOf('class="inbox-refresh-actions"')>=0,
    'Refresh actions must be present in the rendered return markup');
  assert.ok(renderedReturn.indexOf('class="inbox-refresh-actions"')<renderedReturn.indexOf('+unreadOverview'),
    'Refresh button is rendered above the unread overview, regardless of declaration order');
  assert.match(inbox,/id="inbox-refresh-all"/,'The retry action remains present');
});

test('Schyssta manual proposal explains that the author must separately approve',async()=>{
  const app=await read('live-app.js');
  assert.match(app,/Skicka ett konkret förslag\. Sedan behöver även du trycka Jag godkänner/);
  assert.match(app,/Förslaget är sparat\. Även du behöver trycka Jag godkänner i listan/);
  assert.match(app,/item\.proposed_by_me&&item\.own_decision===null/);
  assert.match(app,/Du skickade det här förslaget, men har ännu inte godkänt det/);
  assert.match(app,/Ni behöver båda|Regeln gäller först när ni båda har sagt ja/);
});

test('one-sided Schyssta approval remains distinct from a joint agreement',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function schysstaView(){');
  const end=app.indexOf('\nfunction ',start+25);
  assert.ok(start>=0&&end>start,'Schyssta listan must exist');
  const view=app.slice(start,end);
  const statusStart=view.indexOf('const schysstaDecisionStatus=');
  const actionsStart=view.indexOf('const decisionActions=');
  const manageStart=view.indexOf('const manageActions=');
  assert.ok(statusStart>=0&&actionsStart>statusStart&&manageStart>actionsStart,
    'Status and approval controls must remain separately defined');
  const statuses=view.slice(statusStart,view.indexOf('const itemHtml=',statusStart));
  const decisions=view.slice(actionsStart,manageStart);
  assert.match(statuses,/item\.status==='accepted'\?'Godkänd av båda'/);
  assert.match(statuses,/item\.own_decision===true\?'Du har godkänt – väntar på den andra'/);
  assert.match(statuses,/:'Väntar på ditt beslut'/);
  assert.match(decisions,/const decisionActions=item\.status==='accepted'\s*\?''/,
    'Already accepted agreements must not request another decision');
  assert.match(decisions,/item\.own_decision===true\s*\?'<p class="live-muted">Den andra personen behöver också godkänna samma förslag\.<\/p>'\+submitButton\(false,'Ta tillbaka mitt ja'/,
    'One-sided yes must offer retraction rather than a second approval');
  assert.match(decisions,/:submitButton\(true,'Jag godkänner'\)/,
    'Unanswered proposals must retain explicit approval');
});

test('inbox shared activity heading never displays an unverified unread count',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function inboxView(){');
  const end=app.indexOf('// Keep an in-progress chat editor intact',start);
  assert.ok(start>=0&&end>start,'Inbox rendering must exist');
  const view=app.slice(start,end);
  assert.match(view,/const unreadActivities=activityNotificationsEnabled\s*\?\(activityNotificationsLoading\|\|activityNotificationsError\?null:activityUnreadCount\(\)\):0/,
    'Loading or failed server reads must produce an unknown unread count');
  const activity=view.slice(view.indexOf('const activityPanel='),view.indexOf('  return \'<h1>Inkorg</h1>\''));
  assert.match(activity,/unreadActivities===null\?' · oläst antal okänt'/,
    'The section heading must identify an unverified unread count');
  assert.match(activity,/unreadActivities>0\?' · '\+unreadActivities\+' olästa'/,
    'Only a verified positive count may be displayed as a number');
  assert.doesNotMatch(activity,/activityUnreadCount\(\)\?' · '/,
    'Do not fall back to a stale count while the server result is unknown');
});

test('inbox renders shared AI reflections before secondary inbox sections',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function inboxView(){');
  const end=app.indexOf('// Keep an in-progress chat editor intact',start);
  assert.ok(start>=0&&end>start,'Inbox rendering must exist');
  const view=app.slice(start,end);
  const returned=view.slice(view.lastIndexOf("  return '<h1>Inkorg</h1>'"));
  const firstPanel=returned.indexOf('inbox-insights-shortcut');
  const reflection=returned.indexOf("aiResults.panel('swipe','all',insightsAiSignature())");
  const mainLink=returned.indexOf('Visa alla gemensamma insikter och delningar');
  const refresh=returned.indexOf('inbox-refresh-actions');
  const rest=returned.indexOf('+unreadOverview+activityPanel+chat+rules');
  assert.ok(firstPanel>0&&reflection>firstPanel&&mainLink>reflection,
    'The top shared-insights panel must include guarded AI reflections and a direct insights link');
  assert.ok(refresh>mainLink&&rest>refresh,
    'Shared AI and insights should be above refresh, unread, messages and rule events');
  assert.match(returned,/sharedInsightsEnabled\?'<section/,
    'Do not expose the panel when shared-insights functionality is disabled');
  assert.match(returned,/insightsAiSignature\(\)\?aiResults\.panel/,
    'Do not display an analysis without a current verified shared-results signature');
  assert.match(returned,/insightsLoading\?'<p role="status">/,
    'Keep the loading state explicit instead of implying an available AI result');
  assert.match(returned,/insightsError\?'<p role="alert">/,
    'Keep a visible error state when the shared-results read fails');
});

test('inbox heading only promises AI reflection when the AI feature is enabled',async()=>{
  const app=await read('live-app.js');
  const start=app.indexOf('function inboxView(){');
  const end=app.indexOf('\n// Keep an in-progress chat editor intact',start);
  assert.ok(start>=0&&end>start,'Inbox view must exist');
  const inbox=app.slice(start,end);
  assert.match(inbox,/Era gemensamma insikter'\+\(typeof aiResultEnabled!=='undefined'&&aiResultEnabled\?' och AI-reflektion':''\)\+'/,
    'Heading must not promise AI when the AI analysis feature is disabled');
  assert.match(inbox,/aiResults\.panel\('swipe','all',insightsAiSignature\(\)\)/,
    'Enabled AI still renders a verified shared reflection');
  assert.match(inbox,/Visa alla gemensamma insikter och delningar/,
    'Shared insights link remains available with either feature state');
});
