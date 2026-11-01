# IPIP-50 – Hemmakompassens preliminära svenska formulär (v1)

**Status:** Förberett underlag och testbar kod. **Inte svenskvaliderat, inte tonårsvaliderat och inte normerat.**
Det är en ny översättning från originalets engelska IPIP-50, **inte** Martin Bäckströms svenska översättning.

## Var filerna finns

- `personality/ipip50-v1.js`: enda källan för alla 50 svenska och engelska item, ordning, stabila ID, faktor, +/−-nyckel, 5 svarsalternativ, originalkällor och engelska vuxenreferensvärden.
- `personality/ipip50-scoring.js`: rena funktioner för validering, omvänd poängsättning, fem skalpoäng och deskriptiv jämförelse.
- `personality/ipip50-storage.js`: **ej aktiverad** adapter till befintliga `public.personality_answers` i Supabase, enbart inloggad persons egna svar.
- `tests/ipip50.test.mjs`: syntetiska testfall för exakt antal, nycklar, skala, saknade/ogiltiga svar och privat datalagring.

## Instrument, ursprung och användning

IPIP:s engelska originaltext till de 50 Big-Five Factor Markers är public domain och får översättas samt användas kommersiellt. Den **här** översättningen har formulerats självständigt på vardaglig svenska av OpenAI för Hemmakompassen och kräver språklig granskning, pilotstudie och psykometrisk utvärdering innan den kan marknadsföras som svenskvaliderad.

Originalkällor:
- Originalfrågor och presentationsordning: https://ipip.ori.org/new_ipip-50-item-scale.htm
- Officiell faktornyckel och intern konsistens från originalskalor: https://ipip.ori.org/newBigFive5broadKey.htm
- Poänginstruktion: https://ipip.ori.org/newScoringInstructions.htm
- IPIP:s egna förbehåll om normdata: https://ipip.ori.org/newNorms.htm

**Konstrukt:** Extraversion, Agreeableness (Vänlighet och omtanke), Conscientiousness (Samvetsgrannhet), Emotional Stability (Emotionell stabilitet), och Intellect/Imagination (Idéer och fantasi). Faktor V är inte ett IQ-test eller nödvändigtvis identiskt med andra inventoriers `Openness`. Namnen är vardagliga presentationsnamn, inte validerade svenska etiketter.

## Översättning och avgränsningar

De engelska orden är originalet. Den svenska texten prioriterar begriplighet i ungefär åldern 13+ utan att skapa en annan faktor. **Det är ett utkast.** Exempelvis har festfrågorna (1, 31), abstract-ideas-frågorna (10, 20), och ordval/uppgiftsfrågorna (5, 38, 40, 48) en potentiell ålders- eller kontextbias. Fråga 12 och emotionella frågor (19, 49) behöver trygghet/acceptanstest. Före lansering: minst två oberoende sakkunniga språkgranskare, kognitiva intervjuer med tonåringar och vuxna, och därefter reliabilitet/faktorstruktur/mätinvarians. Ändra aldrig text inom `ipip50-sv-v1` efter skarp användning; skapa ny instrumentversion.

## Poängnyckel

De 50 frågorna ligger i originalets blandade ordning, med 10 per faktor och IPIP:s ursprungliga +/−-kodning. Varje svar är heltal **1–5**. För + item: `poäng = svar`; för − item: `poäng = 6 − svar`. Summan av faktorfrågorna ligger i **10–50**. Programmet kräver **samtliga 50 svar** för att rapportera full profil. `rangePositionPercent=(sum-10)/40*100` kan användas för att placera en grafpunkt i skalans möjliga svarsspann, **inte som percentil eller normerad poäng**.

Mätningar för två personer är endast deskriptiva. Ingen automatisk märkning av `stor skillnad`, diagnos, statistisk signifikans eller normpercentil; effekter och felmarginaler är okända för denna svenska version.

## Vuxenreferenser – INTE svenska normer

`adultDescriptiveReference` är avsiktligt märkt `allowedForSwedishNormInterpretation:false` och används inte av poängmotorn. Rapporten av Darren R. Skidmore (2026), från **570 vuxna** i Oregon-urvalet Eugene–Springfield Community Sample, redovisar deskriptiva medel/SD för **engelskt** IPIP-50 (summa 10–50):

| Skala | Medel | SD |
|---|---:|---:|
| Extraversion | 30.45 | 7.61 |
| Agreeableness | 41.45 | 5.25 |
| Conscientiousness | 39.21 | 5.80 |
| Emotional Stability | 35.01 | 7.56 |
| Intellect/Imagination | 36.66 | 6.65 |

**Riktningskontroll:** rapporten kallar skala IV `Neuroticism` med M = 24.99 och SD = 7.56, här omräknad till IPIP:s `Emotional Stability` som `60 − 24.99 = 35.01`. Rapporten kallar skala V `Openness`. Referensen gäller den rapporterade engelskspråkiga versionen och kan vara otillräcklig även för andra amerikanska populationer. Källa: https://darrenskidmore.com/projects/ipip-workbench/report/unified_report.html och ursprungligt ESCS-arkiv https://doi.org/10.7910/DVN/UF52WY

Inga norska/svenska tonårsnormer, percentilgränser eller kliniska cutoffs ingår.

## Frontend – anslutning i live-app.js (ännu EJ genomförd)

```js
import {IPIP50_V1} from './personality/ipip50-v1.js';
import {scoreIPIP50,compareIPIP50Profiles} from './personality/ipip50-scoring.js';
import {loadMyIPIP50Answers,saveMyIPIP50Answer} from './personality/ipip50-storage.js';

// Återanvänd den redan autentiserade Supabase-klienten "db" från live-app.js:
const mine = await loadMyIPIP50Answers(db);
await saveMyIPIP50Answer(db, 'ipip50-001', 4);
const score = scoreIPIP50({...mine.answers, 'ipip50-001':4});
// score.byFactor är null tills ALLA 50 frågor har giltiga svar.
```

Gränssnittet ska visa **en fråga i taget**, 1–5-ankare, möjlighet att gå tillbaka, privat sparstatus och endast egen profil före ett separat serververifierat samtyckesflöde. En radargraf för två får bara visas när båda har slutfört **exakt denna instrumentversion** och uttryckligen har valt att dela sina fem resultat med aktuellt familjepar. `compareIPIP50Profiles` gör endast numerisk **råpoängsskillnad**; den utför ingen delningskontroll. Använd aldrig den funktionen för att kringgå RLS!

## Backend – avsedd fortsatt arkitektur

Befintliga `public.personality_answers(user_id, instrument_id, question_id, answer jsonb, updated_at)` har self-only RLS och primärnyckel på `(user_id,instrument_id,question_id)`; ingen schemaändring eller databasmutation gjordes när instrumentet lades in. Datakontrakt:

```json
{
  "user_id": "<auth.uid() från autentiserad session>",
  "instrument_id": "ipip50-sv-v1",
  "question_id": "ipip50-001",
  "answer": {"value": 4}
}
```

Adapterklienten tar själv aktuell auth-user, aldrig ett av klienten valt annat användar-ID. **RLS behöver dessutom verifieras i riktig tvåkontosession** för både SELECT och full-row UPSERT innan denna adapter aktiveras. Det behövs serverkontroller som vitlistar *instrument + fråga + svarsskala* eftersom klientvalidering inte är tillräckligt för manipulationsskydd.

Nästa backendsteg enligt ROADMAP PF-18–25: skapa versionssatta testomgångar (`personality_assessments`) och sparad poängsnapshot, bind svar till omgång, kontrollera nyckel och fullständighet **server-side**, ge möjlighet att göra om/radera, och införa separat dokumenterat samtycke för **fem domänresultat**. Utan uttryckligt och aktuell giltig tvåpartstillåtelse ska inga profilresultat kunna läsas av partner. Vid avparning, samtyckesåterkallelse eller kontobyte ska jämförelsen upphöra. Ingen användare ska kunna läsa den andras enskilda itemsvar.

**Ingen befintlig demo har ersatts, ingen publik vy aktiverats och inga användarsvar har skrivits.** Denna commit förbereder instrument + återanvändbara backend-/frontendfunktioner.

## Implementerat 2026-11-01 – inloggad IPIP-50-vy och säker sammanfattningsdelning

- `live-app.js` ansluter nu `#personlighet` till den självständiga modulen `personality/ipip50-ui.js`: ett påstående per skärm, svar 1–5, automatisk privat sparning, föregående/nästa, återupptagning och granskning/ändring av egna svar.
- Efter exakt 50 besvarade frågor används **samma** `scoreIPIP50` som i de automatiska testerna för femaxlig radar och läsbar poängtabell 10–50. Detta är *svarsspann*, inte svenska normer/percentiler. Ingen diagnos eller klassificering.
- SQL-migration: `supabase/migrations/20261101170000_personality_ipip50_pair_sharing.sql`. **Installerad i befintlig Supabase 2026-11-01.** Den validerar IPIP-50-svar server-side och lägger till en separat självskyddad samtyckestabell och två snäva autentiserade RPC:er.
  - `set_my_ipip50_share(p_share)` tillåter delning först efter exakt 50 giltiga svar och exakt en aktuell familj med en förälder och en tonåring. `false` återkallar. Direkt INS/UPD/DEL i samtyckestabellen är förbjuden för webbanvändare.
  - `my_ipip50_shared_profiles()` räknar själv de fem svarssummorna ur 50 signerade nycklar, och lämnar *endast* fem tal per roll efter **bådas** aktuella samtycken och medlemskap (inklusive `joined_at`), annars `null`. Inga frågesvar, användar-ID eller individuella framsteg returneras.
  - `backend-config.js` aktiverar endast detta särskilda dubbel-samtycke; ingen annan av Hemmakompassens delningsfunktioner förändras.
- **Databastest:** SQL-transaktion med två befintliga interna testkonton och 100 tillfälliga syntetiska svar kontrollerade att en ensam delningsbegäran utan svar nekas, att enbart ett samtycke inte räcker, att två samtycken lämnar fem poäng, och att återkallelse genast ger `null`. `ROLLBACK` utfördes; efterkontroll gav 0 kvarvarande IPIP-50-svar och 0 delningsrader.
- Webbläsaren uppdaterar jämförelsen när profilen öppnas, vid flikfokus och var 15:e sekund medan den visas, så att återkallad delning inte ligger kvar varaktigt. Detta är inte en push-prenumeration; kort fördröjning kan förekomma.
- Frontend innehåller mobilanpassad graf, texttabell, deskriptiv likhet/skillnadsordning **utan normtrösklar**, och korta redaktionella samtalsfrågor.

**Fortfarande öppet:** Äkta interaktiv tvåkontoinloggning via publika sidan med manuell visuell granskning, robust testomgångs-/historikmodell för ny testning, fullständig egen radering och dess återkallelse, metoden för samtyckeshantering vid förändrade svar, och psykometrisk validering av den nya svenska ungdomsöversättningen. Testet ska uttryckligen presenteras som en *preliminär reflektionsövning* så länge dessa psykometriska studier saknas.

**Säkerhetsgräns:** Direkt klientläsning av den andra användarens `personality_answers` får aldrig införas. Om samma instrument översätts om, skapa ett NYTT `instrument_id`; byt inte tyst ut frågor under v1.


## Komplettering 2026-11-01 – amerikanskt vuxenmedelvärde och standardavvikelse i spindeldiagrammet

**Produktbeslut:** användaren vill att M och SD ska synas direkt i den befintliga radargrafen med tillhörande textåterkoppling, inte i en separat illustrativ stapel. Därför gäller följande för version `ipip50-sv-v1`:

- `personality/ipip50-reference.js` tillför en **deskriptiv** vuxenjämförelse baserad på befintliga fem M/SD från Skidmores ESCS-analys (N=570, engelskspråkig testversion). Ingen databas- eller samtyckesmigration behövdes.
- Radarn har råpoängsskalan 10–50. En ljus, streckad referenskontur visar **medelvärdet per dimension**. Ett grått fält ligger mellan M−1 SD och M+1 SD. Prickade konturer visar M±2 SD. Eftersom skalan är begränsad 10–50 klipps fältkonturerna där. Samma M/SD gäller för föräldern och tonåringen – **inte** separata åldersnormer.
- Tabellen under grafen visar de fem dimensionernas egna (och vid ömsesidigt godkänd delning den andras) råsummor, amerikanskt vuxenmedelvärde (M), amerikansk standardavvikelse (SD) samt avståndet för egen poäng i antal SD, dvs. `z=(poäng−M)/SD`.
- För textåterkopplingen gäller en **deklarerad redaktionell konvention**, inte en empiriskt verifierad populationsandel: `|z| >= 2` innebär ”ovanligt högt/lågt i förhållande till den amerikanska vuxenreferensen”; `1 <= |z| < 2` innebär mer än en SD över/under; `|z| < 1` innebär inom en SD. Gränsen har inte prövats mot den svenska översättningen; vi rapporterar därför ingen percentil eller statistisk signifikans och ingen klinisk gräns.
- Det måste tydligt stå i vyn att **amerikanska engelskspråkiga vuxenresultat inte är svenska normer och inte tonårsnormer**. Den fritt formulerade svenska översättningen behöver kontrolleras med kognitiva intervjuer och psykometrisk prövning, och det är extra viktigt när användaren är under 18. IPIP:s egen varning om allmänna normgrupper står kvar: https://ipip.ori.org/newNorms.htm.
- Primärkälla till originaldata: Goldberg (2018), ESCS, Harvard Dataverse https://doi.org/10.7910/DVN/UF52WY (CC0 1.0). Den exakta uppställningen av M och SD som används i appen: https://darrenskidmore.com/projects/ipip-workbench/report/unified_report.html, **Big Five: Sample and Descriptive Statistics**. Skala IV har i referensrapporten riktningen Neuroticism, därför är den här omräknad till Emotionell stabilitet: `M_stabilitet=60−M_neuroticism=35,01`; SD är oförändrad (7,56).
- Ingen individinformation överförs till normkällan: alla jämförelser är lokala beräkningar av redan inlästa tillåtna råpoäng. Andra familjemedlemmens individuella svar förblir privata.

**UI-bugg och åtgärd:** svarsalternativ fick tidigare nästan ingen synlig bekräftelse på tryck, eftersom skärmen omedelbart ritades om till nästa fråga. Nu hålls det markerade alternativet kvar med kontrastfärg, kant och bock under sparning, i minst 650 millisekunder, innan frågeflödet går vidare. Om sparningen misslyckas går frågan inte vidare och ett felmeddelande visas. De val som redan finns sparade blir markerade vid återgång och granskning. Enhetstester och mobilwebbläsartest kontrollerar detta.

**Status:** Teknisk referensvisning är implementerad, men motsvarar INTE att ett validerat svenskt test med svenska normer har skapats. Fortsatt översättningsgranskning och referensgruppsval finns i ROADMAP PF-29.
