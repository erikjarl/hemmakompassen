# Hemmakompassen — aktuell utvecklingskö

## 7 november 2026 – NOT-01B: skydda mot byte till ny tvåpersonersparning

- [x] **Kod i utvecklingsgren:** hämtning av aktivitetsaviseringar och explicit läskvitto knyts till medlemsidentiteter, roll och tillgängliga familj-/anslutningsepoker i stället för enbart antal medlemmar och sessionsräknare. Sena svar från en tidigare tvåpersonersparning ignoreras och tidigare notiser rensas; ändrad ordningsföljd för samma två medlemmar tillåts.
- [x] **Fyra isolerade regressionstester i kod:** nytt par med samma antal, oförändrat par med annan medlemsordning, ändrad anslutningstid samt läskvitto från tidigare par. Testerna använder syntetiska RPC-svar, inte två verkliga JWT-sessioner.
- [x] **PR-CI och merge:** [PR #133](https://github.com/erikjarl/hemmakompassen/pull/133) passerade [Node/bygge/Chromium #42379625064](https://github.com/erikjarl/hemmakompassen/actions/runs/42379625064) och mergades som `2e6de829d2aae11cab13d855059f898f407e1e88`.
- [ ] **Pages-version:** kontrollera senaste körning för publicering och faktiskt serverade filer separat.
- [ ] **Kvarstående realistisk testning:** autentiserad förälder/tonåring, ny parning och återkallad behörighet i faktisk Supabase, fysisk Safari/VoiceOver och juridisk granskning.

## 7 november 2026 – REL-01: automatiskt verifiera faktiskt serverade Pages-filer

- [x] **CI-kod i utvecklingsgren:** nytt arbetsflöde `.github/workflows/verify-pages-assets.yml` körs vid varje push till `main` (och manuellt) och jämför faktiskt hämtade bytes för `live-app.js`, `backend-config.js` och `personality/ipip50-ui.js` mot samma Git-commit. Kontrollen försöker på nytt under pågående Pages-publicering och ger fel om serverade filer inte stämmer. Inga privata data, cookies eller inloggningar behövs.
- [x] **PR, CI, merge och första verkliga HTTP-jämförelse:** [PR #132](https://github.com/erikjarl/hemmakompassen/pull/132) passerade [PR-UI #42378452527](https://github.com/erikjarl/hemmakompassen/actions/runs/42378452527) och mergades som `b672c2c2866bc0d06e22f9ef483d8b5e91c79b21`. Det nya [publika filverifieringsjobbet #42378521656](https://github.com/erikjarl/hemmakompassen/actions/runs/42378521656) avslutades med `success` på samma commit; [Pages #42378521089](https://github.com/erikjarl/hemmakompassen/actions/runs/42378521089) lyckades också. Verifieringen jämför tre levererade filers bytes, inte autentiserade användarflöden. Arbetsflödet kontrollerar inte att en nylig ändring i andra filer har distribuerats.
- [ ] **Autentiserat tvåkontotest och iOS:** versionslikhet säger inget om inloggning, samtycke, revokering eller skärmläsare.

## 7 november 2026 – NOT-01B: rensa gamla notiser om parning upphör under hämtning

- [x] **Kod och syntetiska regressionstester:** om parningen upphör medan notis-RPC pågår rensas även redan visade aviseringar, inte bara det sena svaret. Detsamma gäller om funktionen inaktiverats. Ett svar från annan session får fortfarande inte skriva över aktuell status. Ingen SQL, Worker eller familjedata ändrad.
- [x] **PR-CI och merge:** [PR #131](https://github.com/erikjarl/hemmakompassen/pull/131) passerade [Node/bygge/Chromium #42377244037](https://github.com/erikjarl/hemmakompassen/actions/runs/42377244037) och mergades till `main` som `5d3c289bdbdc2788c9e7dd22840f8e2d64052904`.
- [x] **Pages-release:** [GitHub Pages #42377362369](https://github.com/erikjarl/hemmakompassen/actions/runs/42377362369) rapporterar `success` för commit `15af090e8d8ebe68cbef001e7367c26848db7f7a` efter PR #131:s merge och dokumentationsuppdatering. Oberoende kontroll av faktiskt serverad JavaScript och inloggade tvåkonton återstår.
- [ ] **Verkligt tvåkontotest och fysisk iOS/VoiceOver** kvarstår.

## 7 november 2026 – NOT-01B: sent läskvitto efter avparning

- [x] **Kod och syntetiska regressionstester:** sena svar från markering av aktivitetsavisering som läst ignoreras om familjeparningen upphört eller aviseringarna stängts av under anropet. Busy-läget frigörs utan ny RPC-hämtning. Befintliga lagrade svar och databas ändras inte.
- [x] **PR-test och merge:** [PR #130](https://github.com/erikjarl/hemmakompassen/pull/130) godkänd i [UI/Node/build/Chromium #42376124503](https://github.com/erikjarl/hemmakompassen/actions/runs/42376124503) och mergad i `main` som `bbb46fb119b849c8fdd7a9e1994ba8c5a7cda6c0`.
- [ ] **Publicering:** separat verifiering av Pages-release och serverad klient återstår.
- [ ] **Verkliga testkonton och mobil:** två signerade konton, av-/omparning och Safari/VoiceOver kvarstår.

## 7 november 2026 – NOT-01B: sena svar efter ändrad parningsstatus

- [x] **Kod och två regressionstester:** fetchActivityNotifications avvisar sent RPC-svar när familjeparet har upphört eller aviseringar har stängts av, även utan ändrad sessionsräknare. Ingen SQL, Worker eller användardata ändrad.
- [x] **PR-CI och merge:** [PR #129](https://github.com/erikjarl/hemmakompassen/pull/129) godkänd i [UI/Node/build/Chromium #42374994345](https://github.com/erikjarl/hemmakompassen/actions/runs/42374994345) och mergad som `516506cbb06a9e45ac6681bf2c6c540d5451c7cf`.
- [ ] **Pages-release:** oberoende verifiering av senaste serverade version återstår.
- [ ] **Riktig tvåkontoverifiering:** avparning under fördröjt serveranrop samt iOS/VoiceOver återstår.

## 7 november 2026 – NOT-01B: exakta kortlekslänkar från aviseringar (PR #128)

- [x] **Kod och regressionstester i PR #128:** avisering från en servervaliderad A JA+JA-händelse leder till den berörda kortlekens del i Gemensamma insikter; uttryckligt delad B-information leder till förståelsedelen. Endast kända hashmål accepteras. Fokus läggs på verifierat avsnitt först efter ny RPC-läsning. En äldre återkallad delning ger en neutral informationstext, aldrig tidigare svar.
- [x] **Testkod tillagd:** Node-kontraktstest av hashvitlista, kontrollerad aviseringstyp och fokuskrav; syntetiskt mobil Chromium-test för länkat A-kort och återkallelse. Inget nätverksanrop eller automatisk läsmarkering görs av länken.
- [x] **CI och merge 7 november:** [UI/bygg och mobil Chromium #42367563196](https://github.com/erikjarl/hemmakompassen/actions/runs/42367563196) avslutades med `success` på sista PR-head `471170842c`. [PR #128](https://github.com/erikjarl/hemmakompassen/pull/128) mergad till `main` som `9d7af697529a8ce7ac6af4ffd9ff5fa12543bdee`. GitHub Pages-publicering efter merge kontrolleras separat. Inga Supabase-migrationer eller gamla svar ändrade.
- [ ] **Verklig QA:** två riktiga signerade konton, iOS Safari/VoiceOver, återkallelse vid av-/omparning och oberoende kontroll av serverad Pages-version kvarstår.


## 7 november 2026 – NOT-01B steg 1: separat backend för aktivitetsaviseringar (PR #126)

- [x] **Kod i utvecklingsgren:** [PR #126](https://github.com/erikjarl/hemmakompassen/pull/126) tillför tabellerna `activity_notification_event_keys` och `activity_notifications`, endast tillgängliga via snäva, autentiserade RPC:er. Två servertriggers skapar A-händelser efter ett verkligt JA+JA och B-händelser efter nytt uttryckligt tonårssamtycke; inga historiska privata svar backfylls. Läs-RPC verifierar aktuell parningsepok och fortfarande behörigt delat kort.
- [x] **Integritet och mängdbegränsning i kod:** per-kort-nycklar för idempotens, högst en digest per mottagare/kortlek/händelsetyp/UTC-dag, omedelbar borttagning av eventnycklar vid ändrat JA eller återkallat B-samtycke, och radering av äldre händelser vid medlemsändringar. Inga korttexter, privata svar eller avsändaridentiteter returneras av notis-RPC:n.
- [x] **Syntetiska regressionstester skrivna:** 31 pgTAP-assertioner för aktiv parning, JA/JA, ensidiga och avvikande svar, ogiltiga kort, B utan och med samtycke, återkallelse, andra familjer, read-receipt och gruppvisning. DB-workflow har fått nytt migrations- och teststeg.
- [x] **Syntetiska CI-tester verifierade 7 november:** [PostgreSQL/pgTAP #42354500380](https://github.com/erikjarl/hemmakompassen/actions/runs/42354500380) och [UI/bygg #42354500438](https://github.com/erikjarl/hemmakompassen/actions/runs/42354500438) rapporterar `success` på `0b4217f65e9b4ed87f6a444054ea7c46039981cf`. De nya 31 pgTAP-kontrollerna körs på en disponibel PostgreSQL 17-testdatabas; detta verifierar inte riktiga JWT-sessioner eller fysisk iOS.
- [x] **PR #126 mergad och publicerad 7 november:** squash-commit `c25c752499feaa8629c5a9564ed3dffe55269072`; [Pages #42354637272](https://github.com/erikjarl/hemmakompassen/actions/runs/42354637272) och [main UI #42354638116](https://github.com/erikjarl/hemmakompassen/actions/runs/42354638116) rapporterar `success`.
- [x] **Supabase installerad, schema efterkontrollerat:** verklig migration `20261107081525_pair_activity_notifications` lyckades. Två tabeller med RLS, ingen direkt klient-SELECT/INSERT, två publika autentiserade RPC:er och fyra aktiva triggers verifierades. Båda tabellerna innehöll **0 historiska rader** och en syntetisk autentiserad roll utan JWT såg 0 aviseringar. Detta är en metadata-/begränsad säkerhetskontroll, inte två inloggade sessioner.
- [ ] **Verklig funktions- och säkerhetskontroll:** två autentiserade roller, av-/omparning, samtidiga uppdateringar, faktisk Safari/VoiceOver och negativt korsfamiljetest återstår.
- [x] **Kod i mergad PR #127:** Inkorgen listar neutrala grupperade aktivitetshändelser med frivillig läsmarkering; startsida och navigation inkluderar nya olästa aviseringar. Skydd mot ofullständiga serverresultat, kontobyte, och gamla parningar är implementerat i klienten. Djuplänkar till rätt kortleksavsnitt har nu implementerats i PR #128; autentiserad tvåkontoverifiering återstår.
- [x] **Kontraktstester för UI skrivna:** `tests/activity-notification-ui.test.mjs` kontrollerar svarsschema, obehöriga fält, fel, ändrat konto och explicit läsmarkering.
- [x] **PR #127 testad och mergad 7 november:** [PR #127](https://github.com/erikjarl/hemmakompassen/pull/127) till `main` som `7de0bf6be780f67856ca8764e171bbc8bb15c1fc`; [UI+mobil Chromium #42355469142](https://github.com/erikjarl/hemmakompassen/actions/runs/42355469142) och [PostgreSQL/pgTAP #42355469112](https://github.com/erikjarl/hemmakompassen/actions/runs/42355469112) båda `success`. Testet verifierar neutral kortavisering och klickstyrd läsmarkering.
- [x] **Pages-publicering efter #127 verifierad:** [Pages #42355591116](https://github.com/erikjarl/hemmakompassen/actions/runs/42355591116) har lyckad build, publicering och statusrapportering på `e135c80b7d34fabcd01a0eb32edcaafee205bb72` (endast senare dokumentationscommit jämfört med #127).
- [ ] **Kvar:** riktiga signerade tvåkontotester, fysisk iOS/VoiceOver och av-/omparning. Kortleksdjuplänken är tekniskt genomförd i #128, men inte verifierad med två riktiga konton.

**Gällande Jobb hk-fullmakt (5 november 2026):** se [AGENTS.md](../AGENTS.md). Commit, push, PR, merge, publicering och motsvarande projektändringar i GitHub, Supabase och Cloudflare är uttryckligen godkända. Detta ersätter äldre krav på separat merge-/publiceringsgodkännande.


## 6 november 2026 – KOM-05C: användbara direktlänkar från AI-reflektioner (PR #125)

- [x] **Kod och testspecifikation i PR:** [PR #125](https://github.com/erikjarl/hemmakompassen/pull/125) gör reflektionerna mer handlingsbara utan att hävda individualiserad rekommendation: personlighetsresultat länkar till validering och NVC; swajpmatchning länkar till gemensam problemlösning och frivillig kort kontakt. Alla hänvisningar går till befintliga routade övningar. Vid hot/rädsla/kontroll rekommenderas trygghet och stöd före samtalsteknik.
- [x] **Nya kontraktstester skrivna:** `tests/ai-result-exercise-links.test.mjs` kontrollerar olika länkar per resultattyp, att ingen länk visas vid saknat/återställt resultat samt säkerhetsformulering. Webbmodulernas cache-version har synkats.
- [x] **Verifierad PR och Pages-release 6 november:** [PR #125](https://github.com/erikjarl/hemmakompassen/pull/125) mergad som `72da3bc495fa42d594c0b17665a93a453a9c54d5`. [PR AI #42284731655](https://github.com/erikjarl/hemmakompassen/actions/runs/42284731655), [PR UI #42284731688](https://github.com/erikjarl/hemmakompassen/actions/runs/42284731688) och [main Pages #42284916661](https://github.com/erikjarl/hemmakompassen/actions/runs/42284916661) rapporterar `success`. Ingen databas- eller Worker-ändring och inga befintliga familjesvar ändrade.
- [ ] **Kvar att verifiera:** main-UI [#42284917612](https://github.com/erikjarl/hemmakompassen/actions/runs/42284917612) hade ännu inte avslutats vid senaste kontroll, och fysisk iOS Safari/VoiceOver med båda riktiga rollerna återstår. Publiceringsjobbet är inte en oberoende kontroll av serverat cache-innehåll.

## 6 november 2026 – NOT-01B: backendinventering inför automatiska aktivitetsaviseringar

- [x] **Metadata från verksam Supabase läst utan dataändring:** `schyssta_notifications` kräver `agreement_id` och begränsar `kind` till fyra regelhändelser; tabellen passar därför inte direkt för kortmatchningsnotiser. `family_direct_messages`, `family_members` och relevanta delningstabeller har RLS. Befintlig `my_family_unread_message_count()` gäller privata meddelanden. Se [issue #120](https://github.com/erikjarl/hemmakompassen/issues/120) för teknisk inventering och beslut att planera särskild serverstyrd aktivitetshändelsetabell med parningsepok och explicit kontroll av giltigt matchnings-/B-samtycke.
- [ ] **Ej implementerat:** schema, triggers, mottagar-RPC, UI, negativa pgTAP-scenarier och tvåkontoprov för automatiska aktivitetsaviseringar. Ingen automatisk avisering skickas av PR #118–#119.

## 6 november 2026 – INT-03E: trygg sändning av privata meddelanden (PR #123)

- [x] **Kod mergad till `main`:** meddelandeanrop får 15 sekunders tidsgräns. Uteblivet svar presenteras som okänd bekräftelse, inte som säkert misslyckande. Samma text får samma idempotensnyckel vid återförsök; inkorgens skrivfält låses under sändning och ett senare utkast raderas inte av ett gammalt lyckat svar.
- [x] **Regressionstester skrivna:** sex nya testfall i `tests/family-chat-send-retry.test.mjs` för bekräftad sändning, förlorat svar, timeout, dubbelanrop, nytt utkast och tidigare session. Befintligt inkorgskontrakt uppdaterat till att verifiera villkorad utkastrensning.
- [x] **PR #123 färdig:** [ändringen](https://github.com/erikjarl/hemmakompassen/pull/123) mergad till `main` som `dbcf85959bd3a761cd46d57adf9ab20b03f41ffc`. [Sista PR-UI #42259609770](https://github.com/erikjarl/hemmakompassen/actions/runs/42259609770) och [Pages #42259821222](https://github.com/erikjarl/hemmakompassen/actions/runs/42259821222) godkända. En första testkörning hittade ett föråldrat testantagande, som rättades före merge.
- [x] **Cache-version PR #124:** [PR #124](https://github.com/erikjarl/hemmakompassen/pull/124) uppdaterar samma cache-nyckel i HTML, huvudskript och IPIP-moduler, mergad som `935f49b0311e0f619ce7557aef311111d17c62e5`. [PR UI #42260127881](https://github.com/erikjarl/hemmakompassen/actions/runs/42260127881) och [main UI #42260309583](https://github.com/erikjarl/hemmakompassen/actions/runs/42260309583) godkända.
- [x] **Pages-version PR #124:** körning [#42260308560](https://github.com/erikjarl/hemmakompassen/actions/runs/42260308560) avbröts, men nästa `main`-publicering [#42260861796](https://github.com/erikjarl/hemmakompassen/actions/runs/42260861796) (commit `b65f17f4`) lyckades, liksom nya PR #125-release [#42284916661](https://github.com/erikjarl/hemmakompassen/actions/runs/42284916661).
- [ ] **Kvarstående verifiering:** två verkligt autentiserade konton, mobil Safari/VoiceOver samt fel under avparning och parallella sessioner. Ingen befintlig chattdata, delningsflagga, Worker eller Supabase-schema ändrades.

## 6 november 2026 – SEC-02D: uttryckligt B-samtycke kräver sant/falskt

- [x] **Påvisad och rättad backendbrist:** den tidigare funktionen `public.set_understanding_card_share(text,boolean)` behandlade `p_share=NULL` som att den skulle fortsätta mot delningskod (eftersom `IF p_share IS FALSE` inte fångar NULL). Den kräver nu ett explicit sant/falskt värde, avvisar även `p_card_id=NULL` och förnyar aktuell `family_id` vid konflikt. Ett saknat val kan därmed inte utlösa delning av ett B-förståelsekort.
- [x] **Installerat i den faktiska Supabase-databasen 6 november:** migration `20261106162604_require_explicit_understanding_share_choice`, applicerad med `CREATE OR REPLACE FUNCTION`, verifierad med `pg_get_functiondef` (alla tre nya villkor) och aktuella `EXECUTE`-grants (authenticated ja, anon nej). Inga befintliga B-samtycken, svar, familjemedlemmar eller testdata ändrades.
- [x] **Kontrollkod på GitHub-gren:** exakt versionssatt migrationsfil, tre nya pgTAP-scenarier för NULL, Node-kontraktstest och PostgreSQL-workflow som kör migrationen på en syntetisk databas. [PR #122](https://github.com/erikjarl/hemmakompassen/pull/122) mergad; [PR DB #42253256320](https://github.com/erikjarl/hemmakompassen/actions/runs/42253256320), [PR UI #42253256701](https://github.com/erikjarl/hemmakompassen/actions/runs/42253256701), [main UI #42253521076](https://github.com/erikjarl/hemmakompassen/actions/runs/42253521076) och [Pages #42253520535](https://github.com/erikjarl/hemmakompassen/actions/runs/42253520535) godkända.
- [x] **Utökad statisk kontroll:** ytterligare fem funktioners definitioner lästa i verksam Supabase (`propose_manual_schyssta_rule`, `propose_schyssta_change`, `propose_schyssta_rule`, `set_my_ipip50_share`, `shared_swipe_matches`). Därmed har alla 28 auth-exponerade SECURITY DEFINER-funktioner åtminstone lästs, men detta är **inte** en fullständig säkerhetsgranskning eller ett angreppstest.
- [ ] **Kvar:** riktiga signerade tvåkontosessioner, negativa kontotester från andra familjer, återkallelse/race conditions samt klinisk och juridisk bedömning. Automatiserade pgTAP-prov är syntetiska.


## 6 november 2026 – INT-03D: ärlig oläststatus vid nätverksfel (kod i utvecklingsgren)

- [x] **Avgränsad kodfix:** när den senaste sidan privata meddelanden inte kan hämtas rensas potentiellt föråldrade meddelanden och oläst antal markeras som **okänt**, inte som bekräftat noll. Ett separat lyckat `my_family_unread_message_count`-anrop återställer tillförlitlig status. Ett lyckat användarinitierat **Markera alla som lästa** gör också en ny separat serveravstämning för meddelanden som kan ha kommit under pågående läskvittoanrop. Ingen förändring av serverns read-receipt-beteende, befintliga svar, RLS eller övriga funktionsflaggor.
- [x] **Regressionstester tillagda:** `tests/family-chat-quiet-refresh.test.mjs` verifierar att ett misslyckat listanrop aldrig ser ut som ett säkert nollvärde; `tests/family-chat-explicit-receipts.test.mjs` verifierar ny räknarkontroll efter lyckad markering. Tester är ännu inte likvärdiga med verifierade två signerade sessioner.
- [x] **PR #121 teknisk release:** [PR #121](https://github.com/erikjarl/hemmakompassen/pull/121) mergad `ce9762809e24717456fb8c8c9c06f23cad51a306`; [main UI #42251977521](https://github.com/erikjarl/hemmakompassen/actions/runs/42251977521) och [Pages #42251976510](https://github.com/erikjarl/hemmakompassen/actions/runs/42251976510) godkända.
- [ ] **INT-03 verklig QA:** autentiserade tvåkonton, historik, avparning, faktisk iOS Safari och radering/retention återstår.

## 6 november 2026 – SEC-02C: statisk RPC-delgranskning och negativt SQL-test

- [x] **Ytterligare 15 funktionsdefinitioner lästa direkt i verksam Supabase (read-only):** start av familj/inbjudan, medlemmar, B-svar och B-delning, olästa privata meddelanden, Schyssta listans läsning/beslut/återkallelse/notiser. Funktionskroppar använder enligt granskningen `auth.uid()`, aktivt familjepar eller användar-/mottagarkontroll i relevanta delar. Detta är endast statisk genomgång; flera komplexa skriv-RPC:er och negativa angreppstest saknas. Triggern för B-delningsåterkallelse kontrollerades som aktiv på familjemedlemsändringar.
- [x] **Nio negativa autentiserad-roll-SQL-värden med okänd identitet:** under `BEGIN READ ONLY`, lokalt `ROLE authenticated` och syntetisk oparad UUID gav medlemmar, manuella regler, kortregler, aviseringar, regelhistorik, ersättningar, förslag, aktivitetsmatcher och olästa meddelanden samtliga **0**. Avslutat med `ROLLBACK`; inga tabellrader ändrades, privata texter lästes inte.
- [ ] **Kvar:** verkliga signerade sessioner, kontroll av andra familjers data och samtliga privilegierade funktionsargument, race conditions/återkallelse och juridisk/säkerhetsgranskning. Advisor ger fortsatt 8 INFO om RLS utan policy och 28 WARN om autentiserade SECURITY DEFINER – varningar är inte bekräftade sårbarheter. Automatiska negativa SQL-prov styrker endast den simulerade rollen, inte JWT-signatur eller fullständig isolering.


## 6 november 2026 – NOT-01D: aktivitetsinbjudan direkt från kortlekens resultat (PR #119)

- [x] **Kod och mobilt flöde färdiga:** resultatet för `Aktiviteter tillsammans` visar samma **Föreslå tid i inkorgen**-knapp för redan serververifierade A JA+JA-kort. Klicket använder den gemensamma funktionen från #118, men accepterar nu även den aktiva aktivitetskortlekens säkert filtrerade `sharedMatches`. Vid klick kontrolleras den valda aktiviteten igen via autentiserad Supabase-RPC innan ett utkast skapas. Inget skickas förrän användaren separat trycker Skicka. B/NEJ/ensidiga eller felaktiga kort saknar knapp.
- [x] **Test och release 6 november:** [PR #119](https://github.com/erikjarl/hemmakompassen/pull/119) mergad som `0659cd1e88ddce76780aa42c65a046070c016530`. Slutlig [PR UI #42194588575](https://github.com/erikjarl/hemmakompassen/actions/runs/42194588575), [main UI #42194755918](https://github.com/erikjarl/hemmakompassen/actions/runs/42194755918) samt [Pages #42194755952](https://github.com/erikjarl/hemmakompassen/actions/runs/42194755952) godkända. Node, bygge och Chromium/Playwright kontrollerar båda vägarna med syntetisk backend, inklusive att Skicka inte sker vid knapptryck. Ingen Supabase-migration, Worker-förändring eller ändring av befintliga svar.
- [ ] **Verklig QA återstår:** autentiserad förälder och tonåring, Safari/iOS/VoiceOver, återkallelse mellan öppna sessioner, kontobyte och utkastfokus med fysisk mobil.
- [ ] **Automatiska notiser är ännu inte implementerade:** definierat i [NOT-01B #120](https://github.com/erikjarl/hemmakompassen/issues/120) med backend/RLS, deduplicering, integritetskrav och testkriterier. Manuella chattutkast i #118–#119 är en separat funktion.

## 6 november 2026 – NOT-01C: frivillig aktivitetsinbjudan från Gillaswajpen (PR #118)

- [x] **Kod och UI publicerade:** en serververifierad A JA+JA-match i kortleken `aktiviteter` visar knappen **Föreslå tid i inkorgen** på sidan Gemensamma insikter. Ett nytt autentiserat `shared_swipe_matches('aktiviteter')`-anrop bekräftar samma kort direkt vid klick. Därefter skapas bara ett redigerbart lokalt meddelandeutkast. Ingen chatt-RPC, AI-analys, regelröst eller notifiering sker automatiskt; en separat Skicka-knapp krävs. Ett befintligt privat meddelandeutkast skrivs inte över.
- [x] **Teknisk release verifierad:** [PR #118](https://github.com/erikjarl/hemmakompassen/pull/118) mergad till `main` som `1eebe558fc78389b0c1da14522decdebf76b792c`. Slutlig [PR UI #42193715854](https://github.com/erikjarl/hemmakompassen/actions/runs/42193715854), [main UI #42193881405](https://github.com/erikjarl/hemmakompassen/actions/runs/42193881405) och [GitHub Pages #42193880311](https://github.com/erikjarl/hemmakompassen/actions/runs/42193880311) rapporterar godkänt. Node, statiskt bygge och Playwright/Chromium med faktiskt utkastflöde mot syntetisk server godkända. Cache-version synkad. Ingen Supabase/Cloudflare Worker-mutation eller ändring av befintliga familjesvar.
- [ ] **Verklig QA:** verifiera med två autentiserade konton, iOS Safari, fokus/synlighet och återkallelse mellan två öppna sessioner. CI med syntetisk backend ersätter inte detta.
- [ ] **NOT-01 framtida automatisk händelsefunktion:** återstår skilda servergenererade aviseringar för nya gemensamma aktiviteter och resultat, deduplicering och korrekt RLS/behörig mottagare. PR #118 är bara användarinitierade, valfria privata meddelanden, inte automatisk notifiering.

## 6 november 2026 – KOM-04C: trygghetsstöd även i MI-guiden (PR #117)

- [x] **Koden mergad till main:** MI-sidan `#mi-foralder` återanvänder exakt samma statiska trygghetskomponent för föräldrar som Kommunikationsråd och NVC. Ingen ny databasåtkomst eller ändring av familjesvar; befintlig föräldrars-rollspärr för MI-routen kvarstår.
- [x] **Automatiska tester och release verifierade:** PR #117 mergad som `6b071211acf4dae3e926b4788d0ab6ec442e09df`. PR-UI [#42187040272](https://github.com/erikjarl/hemmakompassen/actions/runs/42187040272), main-UI [#42187238495](https://github.com/erikjarl/hemmakompassen/actions/runs/42187238495) och Pages [#42187236998](https://github.com/erikjarl/hemmakompassen/actions/runs/42187236998) är godkända. MI-test verifierar vuxenansvar, 112, 1177 och Bris vuxentelefon, utan att presentera 116 111 som förälderns telefonnummer. Fysisk iOS/VoiceOver är ännu inte testad.
- [ ] **Kvar:** manuellt kontrollera navigering och språk med föräldra- och tonårskonto, särskilt att tonåringen inte kommer åt MI-routen, samt läsbarhet och tillgänglighet i riktig mobil.

## 6 november 2026 – KOM-04A: hjälp när samtal inte är trygga (PR #116)

- [x] **Kod och kontraktstester tillagda på PR #116:** rollanpassad, frivillig trygghetspanel finns både på Kommunikationsråd och i NVC-byggaren; akutnummer 112, 1177, Bris 116 111 för under 18 år och Bris vuxentelefon för föräldrar. Samtalsteknik presenteras uttryckligen som olämplig vid hot, rädsla eller kontroll. All text är statisk och öppning kräver ingen inloggad dataläsning, AI, delning eller lagring.
- [x] **Fyra automatiska tester skapade:** kontroll av båda rollerna och båda vyerna, säkra länkadresser, ansvarsfördelning, tangentbordsfokus och frånvaro av nätverk och lokal lagring.
- [x] **KOM-04A teknisk release verifierad 6 november:** PR #116 mergad som `5c091f23d1b6dcf100225e277a2922709898a932`. PR-UI [#42186402650](https://github.com/erikjarl/hemmakompassen/actions/runs/42186402650), main-UI [#42186595625](https://github.com/erikjarl/hemmakompassen/actions/runs/42186595625) samt GitHub Pages [#42186595460](https://github.com/erikjarl/hemmakompassen/actions/runs/42186595460) är godkända. Node, bygge och Chromium/Playwright har passerat. Den publikt serverade resursens versionsstämpel har inte kunnat kontrolleras direkt härifrån. Screenshots skapade av CI men inte manuellt granskade i denna körning. Ingen Supabase- eller Worker-mutation gjordes.
- [ ] **KOM-04A faktisk QA:** manuellt prova med båda autentiserade rollerna i iOS Safari/VoiceOver och kontrollera att stödvägar och kontaktlänkar är begripliga, kan öppnas och inte skapar delning eller lagring.
- [ ] **KOM-04B metod- och risksäkerhet:** granska språk/hanterbarhet med unga och föräldrar, fysisk iOS Safari/VoiceOver, situationer med pågående våld, källornas aktualitet och hur AI-medlaren bör hänvisa utan att reducera hot till kommunikationsteknik. Inget kliniskt effektanspråk.

## 6 november 2026 – SEC-02 read-only avstämning

- [x] **Enbart metadata kontrollerad:** Supabase Security Advisor rapporterar 8 RLS-tabeller utan policy och 28 exponerade SECURITY DEFINER-RPC:er för `authenticated`. Samtliga 28 har vid översiktlig SQL-inspektion `search_path=''`, innehåller referens till `auth.uid` och saknar `anon`-EXECUTE. Detta är **inte** en fullständig granskning av varje funktions behörighetsvillkor.
- [x] **Fördjupad läsning av åtta autentiserade databasfunktioner:** `my_ipip50_shared_profiles`, `set_swipe_priority_share`, `shared_swipe_priorities`, `shared_understanding_cards`, `accept_family_invite`, `mark_family_messages_read`, `my_family_messages`, `send_family_message`. I nuvarande databasdefinitioner finns kontroller för autentiserat anrop, aktuellt familjepar/medlemskap eller aktiv delning där detta krävs, och meddelande-RPC:erna är bundna till mottagare samt parningens tidsstämpel. Det är en **statisk delgranskning**, inte verifiering mot verklig angriparsession och inte en säkerhetsgaranti.
- [ ] **Fortsatt säkerhetsarbete:** granska funktionskroppar och argument var för sig, verifiera parning/ägarskap och negativa tester med autentiserade tvåkontosessioner. Lägg inte till generella SELECT-policyer på RPC-only tabeller för att tysta lintervarningar.

## 5 november 2026 – SW-03C: verifiera samtyckesstatus vid nätverksfel

- [x] **Mergad och tekniskt publicerad i PR #113 (5 november):** läs tillbaka den egna RLS-skyddade samtyckesraden efter delning/återkallelse. Ett förlorat RPC-svar betyder inte nödvändigtvis att servern avbröt åtgärden. Sidan får därför inte hävda att ingenting ändrats utan att kontrollera.
- [x] **Okänd status hanteras öppet:** vid misslyckad kontroll rensas osäker lokal status, knapparna spärras och användaren får ett tydligt meddelande och en möjlighet att ladda om status. Tangentbordsfokus och mobilskroll bevaras vid vanlig samtyckesuppdatering.
- [x] **SW-03C CI/merge/Pages verifierat:** syntetiska Playwright-test med förlorad kvittens efter sparning, misslyckad återkallelse, osäker läsning, förnyad kontroll och föräldervy med aktiv testflagga. PR-test [#42122936132](https://github.com/erikjarl/hemmakompassen/actions/runs/42122936132) godkänt, PR #113 mergad `b6c97eb76cdda6cb0045e381e05743419826489e`, main-UI [#42123230832](https://github.com/erikjarl/hemmakompassen/actions/runs/42123230832) samt Pages [#42123230079](https://github.com/erikjarl/hemmakompassen/actions/runs/42123230079) godkända. Den publika URL:ens faktiskt serverade versionsstämpel har **inte** kunnat hämtas direkt härifrån. UI/CI är inte ett autentiserat tvåkontoprov.
- [ ] **Verklig QA / INT-05 [#114](https://github.com/erikjarl/hemmakompassen/issues/114):** signerade tvåkontotester i iOS/desktop, familjeisolering, återkallelse, okänd serverstatus och säkerhetsgranskning återstår före aktivering. `enableSharedPriorities:false` ändras inte. Skrivskyddat Supabase-rollprov med simulerad tonåring visade inga andra kontons viktighet/samtycke, men detta är inte en faktisk inloggad webbsession.

## 5 november 2026 – SEC-02 fortsatt säkerhetsgranskning

- [x] **Ny observation 5 november (skrivskyddad Advisor-kontroll):** åtta RLS-tabeller utan policy och 28 `authenticated SECURITY DEFINER`-varningar. Flera RPC:er är avsiktligt exponerade med roll- och familjekontroller; antalet varningar betyder inte 28 bekräftade sårbarheter. Ingen direkt behörighet ändrades. [Supabase linter – SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- [ ] Granska varje RPC enligt befintlig SEC-02-plan före extern pilot. Ändra inte tillgång till viktiga familjefunktioner generellt utan kodgranskning och tester.

## 5 november 2026 – SW-03B: säker integration av tonåringens prioritetssamtycke

- [x] **Rensat gammal konflikt:** en ren integrationsgren (`feat/priority-consent-rebased-20261105`) utgår från aktuell `main`, med PR #107:s samtyckeslogik och automatiska tester men utan att ersätta nyare kommunikationskod. PR #107 är stängd utan merge och ersatt av PR #111, mergad och publicerad; äldre utvecklingsgrenar har inte skrivits över.
- [x] **Backend installerad redan 5 november:** migration `20261105161257` finns i verkliga Supabase och motsvaras nu av Git-filen `supabase/migrations/20261105161257_explicit_swipe_priority_sharing.sql`. Den installerade migreringen körs inte på nytt i verkliga databasen.
- [x] **Skyddad funktion bakom avstängd flagga:** enbart tonåringen får välja att dela redan serververifierat gemensamt A-JA med egen `+1`; historiska nivåer blir aldrig automatiskt delade. Delning kan återkallas per kort, och privat nivå syns inte för föräldern. Kodens text klargör att själva översikten är privat medan enskilda kort kan delas.
- [x] **Automatisk verifiering av senaste integrationskod:** pgTAP (25/25 prioritetsskyddskontroller samt övriga DB-kontrakt) [#42108437034](https://github.com/erikjarl/hemmakompassen/actions/runs/42108437034) och Node/Playwright/visuell UI [#42108437007](https://github.com/erikjarl/hemmakompassen/actions/runs/42108437007) är godkända på commit `90662d347721877c369c4d8fb8c9f330ca134d9e`. En tidigare pgTAP-syntaxbugg med 23 felaktiga citat har rättats och fått eget regressionstest.
- [x] **Verklig Supabase read-only-kontroll:** 0 befintliga aktiva samtycken, 4 återkallelsetriggers, RLS på, inget direkt `INSERT` för `authenticated` och ingen extern `EXECUTE` på interna eligibility-RPC:n. Ett syntetiskt oparat användar-ID såg inga delade prioriteringar. Ingen data skrevs.
- [ ] **Kvar före aktivering:** två verkligt autentiserade testkonton måste visa korrekt aktivt samtycke, återkallelse, familjeisolering, inaktiverade och gamla familjepar samt att AI inte tolkar privat nivå som delad. iOS Safari/VoiceOver och riskgranskning återstår. `enableSharedPriorities:false` kvarstår.

## 5 november 2026 – KOM-05A/B: direkta länkar till samtalsövningar

- [x] **Implementerat på `feat/communication-deep-links-20261105`:** nio fasta övningsadresser (`#kommunikation/<övning>`) öppnar rätt övning; sex moduler har relevanta direktlänkar. Mobilmenyn behåller Kommunikationsråd som aktiv flik. Enbart fasta redaktionella ID:n används, inga användarsvar i adressen och ingen ny databasåtkomst.
- [x] **Robust routing och tangentbord:** felkodade hashvärden kraschar inte sidvisningen; okända övningar visar översikten. Direktnavigering flyttar fokus till övningen medan omritning inte aktivt flyttar fokus. Situationernas befintliga knappar använder samma kontrollerade öppningsfunktion.
- [x] **Lokala kontroller:** 205 Node-tester och statiskt bygge godkända. UI-workflow upptäcker nu samtliga `*.test.cjs` och `*.test.mjs`, inklusive situations- och direktlänkstester.
- [x] **Browser/release PR #108 (5 nov):** Playwright/Node-test i PR #108 godkänd ([körning #42100188721](https://github.com/erikjarl/hemmakompassen/actions/runs/42100188721)). PR #108 mergad `d868341c89aab4600d6f503513989135226614c1`; main UI/Playwright [#42101828490](https://github.com/erikjarl/hemmakompassen/actions/runs/42101828490) och Pages [#42101827112](https://github.com/erikjarl/hemmakompassen/actions/runs/42101827112) godkända. Autentiserad tvåkontokontroll och iOS Safari återstår.
- [x] **KOM-05C – kod mergad till `main` (PR #109):** AI-medlarens prompt har nio befintliga fasta övningslänkar. Chatt-UI tillåter bara exakta redaktionella URL:er och spärrar fortsatt föräldrarnas MI-länk för tonåring/okänd roll; okända/kodade URL:er förblir escaped text. Nya Node- och Worker-tester täcker länkar, roller, kontext av/på och injektionsskydd. Inga databasskrivningar eller ändrade delningsflaggor.
- [x] **KOM-05C teknisk release verifierad 5 november:** PR #109 mergad som `d0cbee989675518e28324ce104c871949e0634cf`. PR AI-backend [#42102367158](https://github.com/erikjarl/hemmakompassen/actions/runs/42102367158), PR UI/Playwright [#42102366994](https://github.com/erikjarl/hemmakompassen/actions/runs/42102366994), main UI [#42102572410](https://github.com/erikjarl/hemmakompassen/actions/runs/42102572410) och GitHub Pages [#42102572945](https://github.com/erikjarl/hemmakompassen/actions/runs/42102572945) godkända. Cloudflare Worker **version 12** (`3cef360b-dacf-48e9-b48c-f099aecde358`) aktiverad till **100 %** och kontrollerad via deployment-API; fem moduler och samtliga sex tidigare bindningar bevarades.
- [ ] **KOM-05C faktisk QA:** autentiserade föräldra-/tonårssamtal, modellens konkreta val av länkar, risksituationer och fysisk iOS Safari/VoiceOver återstår. CI och aktiv Worker-version är teknisk verifiering, inte bevis för klinisk säkerhet eller att AI alltid väljer rätt länk.
- [ ] Verkliga tvåkontotester och fysisk iOS/VoiceOver återstår som tidigare. Detta pass ändrar inga befintliga användarsvar eller delningsflaggor.


## 4 november 2026 – KOM-03: situationsstyrt kommunikationsstöd (PR #106 – mergad och publicerad)

- [x] **KOM-03A – mergad till main:** sex situationsval öppnar direkt rätt befintlig eller ny samtalsövning. Tangentbordsfokus flyttas till öppnad övning. Ingen ny hash-route, familjedata, databasförändring eller lagring.
- [x] **KOM-03B – innehåll mergat:** tre nya redaktionella övningar om validering utan medhåll, konkreta frivilliga önskemål och respektfull gränssättning. Den sista har olika råd för förälder respektive tonåring och tydliggör vuxenansvar och säkerhet.
- [x] **KOM-03C – regressionstester verifierade:** kontrakt för målövningar, rollanpassning, säker interaktion och frånvaro av lagring, samt Chromium/Playwright-övningsval på mobil med både pek- och tangentbordsstyrning.
- [x] **KOM-03D – release verifierad 4 november 2026:** PR #106 mergad som `c70cf497184067106a676ab169448ed317711f4a`. PR UI/Node/Playwright **#41826421254 godkänd**, main UI **#41826651841 godkänd** och GitHub Pages **#41826649578 godkänd**. Syntetiska tester är inte verkliga tvåkontotester.
- [ ] **KOM-03E – verklig QA:** prova med båda autentiserade testkontona på fysisk iOS Safari och med skärmläsare, även större tecken; kontrollera fokus, begriplighet och att valen aldrig skapar meddelanden eller delning.
- [ ] **KOM-04 – metod- och språkgranskning:** bedöm NVC-övningar, MI-överföring till föräldraskap och tillkommande verktyg kritiskt utifrån källor, målgrupp, maktasymmetri och risksituationer. Undvik behandlings- eller effektanspråk utan stöd.
- [x] **KOM-05 – kod/teknisk release 5 november (PR #108–#109):** testade fasta övningsankare, säkra direktlänkar från appens moduler och tillåten Worker-prompt/AI-länkning är mergade och publicerade. Separata verifieringspunkter KOM-05C faktisk QA och KOM-04 metodgranskning är fortsatt öppna.

## 4 november 2026 – KOM-02: samtalsverktyg i hela appen och AI-medlarens länkar (PR #105)

- [x] **KOM-02A – mergad navigation:** Gillaswajpen, Gemensamma insikter, Min personlighet, Schyssta listan, Inkorgen och AI-medlaren får kontextuella genvägar till `#kommunikation` och `#nvc`. Endast föräldravyn har dessutom `#mi-foralder`. Inga privata svar förs med i länkarna och navigering skickar inga meddelanden.
- [x] **KOM-02B – AI-systemprompt och chatt-UI driftsatta:** Worker-systemprompten har de verkliga absoluta Pages-adresserna `https://erikjarl.github.io/hemmakompassen/#kommunikation` och `#nvc`; förälderns särskilda MI-adress läggs bara till vid verifierad föräldraroll, aldrig vid tonåringsroll, okänd roll eller valt bort projektkontext. Chatt-UI gör enbart de tre exakt tillåtna adresserna klickbara i AI-svar efter HTML-escaping. Övriga adresser och användar-/säkerhetsmeddelanden förblir ren text.
- [x] **KOM-02C – tester skapade:** Node- och Worker-kontroller för tillåtna länkar, XSS, verifierad roll och projektkontext av/på samt Playwright-kontroll av klickbar navigation för båda rollerna i mobilen. AI-reflektioner har även generella övningslänkar utan tolkning av privat profil.
- [x] **KOM-02D – teknisk release och Worker-driftsättning verifierad 4 november 2026:** PR #105 mergad till `main` som `5e55e0e55d8daeb800646e7fd04d8776cee0daf7`. Slutlig PR-CI för AI **#41792070496** och UI/Playwright **#41792070332** godkända. Main-UI **#41792217065** och Pages **#41792216243** godkända. Cloudflare Worker-version **`6ed65aba-94b2-463a-94a7-d6b766674a49`** (version 11) uppladdad som komplett femmodulspaket med strikt ärvda bindningar och aktiverad för **100 % trafik**; sex tidigare bindningar kontrollerades kvar, inklusive AI, D1-kvot, Origin, Supabase och två interna testkonton. Inga databas-/kortsvar ändrade. Gröna tester visar kodkontrakt, inte att modellen alltid väljer att länka.
- [ ] **KOM-02E – verklig QA:** verifiera med två autentiserade testkonton att chatten länkar korrekt vid relevant fråga, MI inte föreslås till tonåring, avstängd projektkontext inte läser data och att inga länkar ges vid risksamtal. Fysiskt iOS-/skärmläsartest saknas.


## 4 november 2026 – KOM-01: utökad kommunikationsverktygslåda (PR #104)

- [x] **KOM-01A – kod mergad till main:** Kommunikationsråd har fått en rollanpassad startsida med tydliga ingångar: MI för förälder, NVC för båda samt sex praktiska övningar (spegling, paus med återkomst, reparation, gemensam problemlösning, kravlös kontakt och svåra samtal). Förälderns redan befintliga MI-guide kompletteras med övningar i att fråga om lov och utforska ambivalens, med uttrycklig gräns mot övertalning och förälders fortsatt vuxenansvar.
- [x] **KOM-01B – privat NVC-övning implementerad:** separat sida med observation, känsla, behov, konkret önskemål och lokal formulering i webbläsaren. Utkast läggs enbart med `textContent`, kan nollställas och skickas inte till Supabase, AI eller partner. Ingen migration, inga nya delningsflaggor eller ändrade användarsvar.
- [x] **KOM-01C – automatiska tester i PR #104:** Node-kontrakt för rollvyer, metodkällor, NVC-validering och injektionssäker text; syntetisk Playwright-Chromium i 390px för förälder/tonåring, NVC-formulering, reset, synlig navigation och MI-spärr. Anpassad CI-kommandorad och statisk build.
- [x] **KOM-01D – teknisk release 4 november 2026 verifierad:** PR #104 mergad till `main` som `9174dd53ce98062907747f67ca250f32174f955e`. Slutlig PR-CI **#41787467096**, main UI/Node/Playwright **#41787606895** och GitHub Pages **#41787606278** godkända. Även syntetiska mobilkontroller i **320 och 390 px** passerade. Ingen databasändring eller sparad familjedata påverkades.
- [ ] **KOM-01E – faktisk användbarhets- och metodgranskning kvar:** autentiserad tvårollskontroll, fysisk iOS Safari, VoiceOver, stora tecken, tonåringars begriplighet och språk-/metodgranskning före extern pilot. NVC- och MI-delarna är redaktionellt anpassade samtalsverktyg, **inte** en kliniskt utvärderad familjebehandling.


## 3 november 2026 – UX-01C: tangentbordsfokus, mobilmeny och säkra piltangenter (PR #103)

- [x] **UX-01C – implementerat på utvecklingsgrenen:** en tangentbordssynlig länk ”Hoppa till huvudinnehållet” i den inloggade appen flyttar fokus till `#live-app` utan att ändra SPA-routens hash. Vid riktigt sidbyte flyttas fokus till nytt huvudinnehåll. Identiska bakgrundsuppdateringar bygger inte längre om redan fokuserade menylänkar; en meny som måste uppdateras återställer länken och horisontell skroll.
- [x] **UX-01C – mobil och Gillaswajpen:** aktiv mobilflik flyttas fram i den horisontella menyn vid sidbyte. Undersidan Gemensamma insikter markerar Gillaswajpen som aktuell primär flik. Globala kortgenvägar med vänster-/högerpil sparar inte ett oavsiktligt JA/NEJ om fokus ligger på länkar, knappar, formulärkontroller eller andra interaktiva element, och inte heller med modifieringstangenter.
- [x] **Automatisk verifiering på branch, PR #103:** GitHub Actions UI/browser-test **#41726616629 godkänd** efter rättad MI-guide-kontraktsassertion. Inkluderar Node-kontrakttest, statiskt bygge och syntetiska Chromium/Playwright-prov med tangentbordsfokus, genväg till main, aktiv sista mobilflik, insiktsflik och inget oavsiktligt swajpsvar från fokuserad menylänk. Versionssträngen har höjts konsekvent i HTML och importkedja.
- [x] **UX-01C release verifierad 3 november 2026:** PR #103 är mergad i `main` som `57c54c3b2092b28d71666380e2b447f4594123bb`. Slutlig PR-CI **#41726909258**, main UI/Node/Playwright **#41727106770** och Pages **#41727105396** är alla **godkända**. Endast kod, tester och dokumentation – inga databasskrivningar eller förändrade delningsflaggor.
- [ ] **UX-01C verklig QA återstår:** två riktiga autentiserade testkonton, fysisk iOS Safari med VoiceOver, skärmläsare, 320/390 px och stora tecken är **inte** verifierade genom syntetiskt Chromium. Fortsätt UX-01 före extern pilot.


**Granskad:** torsdag 5 november 2026 efter verifierade PR #108–#109, aktiv Worker-version 12 och read-only granskning av prioritetsdelningens Supabase-migration. PR #111 är mergad, PR #107 stängd och `enableSharedPriorities:false` kvarstår.
**Källa:** kod på `main` inklusive PR #90–#111, `backend-config.js`, kontrollerade GitHub Actions/UI/Pages-körningar, Supabase-migrationer och read-only SQL efter installation. Detta är **inte** ett påstående om genomförda verkliga tvåkontotester.  
**Syfte:** En enda kort, uppdaterad handlingslista för manuellt och schemalagt utvecklingsarbete. `ROADMAP.md` bevarar detaljerna och äldre beslut.

## 3 november 2026 – SW-03A: egen viktigast-översikt och fortsatt privat prioritering

- [x] **SW-03A mergad och publicerad PR #100:** tonåringen har en egen, tydligt privat lista över redan serververifierade gemensamma A JA+JA där hen själv valt Mycket viktigt. Förälderns vy visar inte listan; B, NEJ och neutrala nivåer filtreras. Texten informerar om att AI-medlaren kan använda egna prioriteringar när projektkontext är på. PR-UI #41680382345, main UI #41680605178 och Pages #41680603854 **godkända**; merge `3e96a5ea8ea96b4082a982f120c522fe50a729a5`. Ingen databasändring eller förändring av sparade svar.
- [x] **Regressionstester verifierade:** syntetisk selektering av egna viktiga A JA+JA, föräldervy utan privata markeringar, fel i lagringshämtning, kontroll av AI-information samt framtida shared-mode utan dubbletter. Godkända i PR #100 UI-CI #41680382345.
- [ ] **SW-03B – SQL installerad, aktivering blockerad av verkliga samtyckestester:** migrationshistorik i Supabase visar `20261105161257` (`explicit_swipe_priority_sharing`); read-only SQL 5 nov verifierade att `swipe_priority_shares` har RLS och själv-SELECT, inte direkt INSERT för `authenticated`, och att interna `eligible_swipe_priorities(text)` saknar `EXECUTE` för klientrollerna. PR #107 är stängd och ersatt av mergad PR #111; tekniskt installerad migration betyder inte att gränssnittet och faktisk parvis återkallelse har sluttestats. Tidigare privata `+1` får aldrig automatiskt delas. `enableSharedPriorities:false` lämnas orörd tills autentiserat tvåkontotest och samtyckesgranskning är genomförda.

- [x] **SW-03A mobilbrowser-QA mergad och publicerad (PR #101):** syntetisk Chromium/Playwright-kontroll med tonårings- och föräldervy, endast serververifierade A JA+JA och tonåringens egen prioritet, skydd mot B/NEJ/neutrala värden samt avstängd prioritets-RPC. Ny 390 px-mobilbild `mobile-teen-private-priority-preview.png` har öppnats och granskats utan uppenbar klippning i själva listan. PR UI **#41680969356**, main UI **#41681186915** och Pages **#41681184672** godkända; merge `18c4bde1daed599ae456ec33270f831f1f729ad1`. Autentiserade tvåkontotester är fortfarande öppna.
- [ ] **SW-03A verklig QA återstår:** autentiserade tvåkontosessioner, iOS Safari och framtida uttryckligt prioritetssamtycke.

## INT-01/03/04 – read-only positiva rollprov i verkliga Supabase (3 november 2026)

- [x] **Rollbaserad SQL-kontroll utan dataändringar:** befintligt förälder–tonåringpar kördes med `BEGIN READ ONLY`, lokalt `authenticated` och simulerat `request.jwt.claim.sub` i två separata transaktioner med `ROLLBACK`. Båda fick 2 familjemedlemmar, 12 gemensamma A-JA i general, 5 i aktiviteter, 0 delade B, 2 meddelanden och en tillgänglig delad IPIP-profil; oläst: 0 förälder, 1 tonåring. Ingen rå text, identitet, privata svar eller meddelandeinnehåll återges i planen.
- [ ] **Begränsning:** dessa är riktiga, körda, behörighetsstyrda DB-RPC:er men **inte** signerade inloggningar eller två webbläsarsessioner. Fulla INT-01/02/03/04, återkallelse och Worker-test kvarstår.

## AI-01H – resultatanalys med tidsgräns och avbrutna gamla anrop (3 november 2026)

- [x] **AI-01H merged/publicerad PR #99:** 25-sekunders timeout och abort av föråldrade AI-anrop ingår på `main` via merge `f64e0c681f9d26579279e3f3c1487b1fed17129c`. PR-CI AI #41679064612 och UI #41679064432 godkända, main UI #41679759399 och Pages #41679758227 godkända. Ändringen påverkar bara klienten, inte Worker-kontrakt eller sparade svar.
- [ ] **AI-01H återstår:** verkligt tvåkontotest av återkallelse/konto- och sessionsbyte; UI-avbrott bevisar inte att redan påbörjat serveranrop slutar konsumera AI-kvot.

## 3 november 2026 – UX-02A: ikonöversikt även med aktiva AI-reflektioner

- [x] **PR #98 mergad och publicerad – kod och tester:** ai-dev/compact-mutual-yes-20261103 visar en kort, ämnesgrupperad ikonöversikt från **enbart serververifierade A JA+JA** i både den enskilda kortlekens resultat och samlade insikter. AI-reflektionen finns kvar på samma sida utan återgång till förskrivna råd. Översikten innehåller rollanpassad text och antal gemensamma svar, aldrig enskilda B-/NEJ-/okända kort eller privat viktighet. Node-/kontraktstester, byggkontroll och syntetiskt Playwright-UI är **gröna i GitHub Actions #41671120244 (3 nov)**. 35 screenshots producerades, desktop- och mobilbilder av gemensamma insikter samt mobil AI-swipe har öppnats och granskats. Detta är inte en autentiserad tvåkontoverifiering.
- [x] **PR #98 release:** merge 5c91abb76d3a5dd78e8565546edf0b6ec6b3532b, main UI #41678506279 och Pages #41678505271 godkända den 3 november 2026. Tidigare dokumenterad PR-CI gäller branchkod, nu är även main och distribution verifierade.
- [ ] **UX-02A återstår:** riktiga tvåkonton med återkallelse och breda kortlekar samt iOS Safari. Funktionen UX-02/SW-02 är inte fullständigt slutförd.

## 3 november 2026 – INT-03C/UX-01: tyst bakgrundsuppdatering av Inkorgen

- [x] **INT-03C – mergad, testad och publicerad PR #97:** oförändrade meddelanden och oförändrat antal olästa ska inte rita om Inkorgen var femtonde sekund; regelbunden serverkontroll fortsätter. Vid ny data uppdateras vyn, vid fel rensas osäkert tidigare innehåll som förut. En manuell uppdatering med redan inlästa meddelanden döljer inte konversationen i väntan på servern. Mobilens huvudskroll bevaras vid omritning. Node-regression och Playwright på mobil finns på `main` via **PR #97**. Även konkurrerande hämtning av äldre meddelanden skyddas mot bakgrundspolling. PR-CI **#41628025008**, main UI **#41628216811** och Pages **#41628215427** är godkända, merge `5f9d445fc88dc4974b57c493a265942a64362cd4`.
- [ ] **INT-03C verklig QA:** autentiserat tvåkontotest, iOS-Safari, skärmläsare och långa konversationer återstår. Teknisk CI, merge och Pages är genomförda.

## 3 november 2026 – ytterligare read-only negativtest av verkliga RPC:er

- [x] **INT-01/03N – obehörig, icke-existerande identitet (SQL i realdatabasen):** under `BEGIN READ ONLY` med lokal `authenticated`-roll och en syntetisk UUID som inte är kopplad till en familj gav `my_family_members()`, `shared_swipe_matches('general')`, `shared_understanding_cards()`, `my_family_messages()` och `my_family_unread_message_count()` alla **0**. Transaktionen återställdes med `ROLLBACK`. Ingen faktisk inloggning skedde; provet bevisar **inte** tvåkontotest eller JWT-signaturvalidering.
- [ ] **INT-01/03N komplettering:** autentiserade riktiga testkonton med både delad och privat data samt browser/Worker-beteende återstår.

## 3 november 2026 – INT-03A: ärliga läskvittenser i Inkorgen

- [x] **INT-03A – explicit läsmarkering (mergad, testad och publicerad PR #96):** öppning av Inkorgen och automatiska konversationsuppdateringar markerar inte längre alla familjemeddelanden som lästa. Användaren får en separat knapp **Markera alla meddelanden som lästa** när olästa finns och ser tydligt att även meddelanden på äldre sidor ingår. Vid serverfel bevaras oläst antal och inget läskvitto påstås vara sparat. Ändringen använder samma redan behörighetskontrollerade RPC, utan migrationskrav. Node- och mobil-Playwrightfall täcker misslyckat/successfullt försök, kontobyte och skydd mot dubbla anrop. PR #96 CI **#41626412219**, main UI **#41626593652** och Pages **#41626592863** godkända; merge commit `f009f1cff2b9ff3ae81ab9651ef6efecee4c0643`.
- [ ] **INT-03B – återstår:** verkligt autentiserat tvåkontotest med förälder/tonåring, paginering, utloggning/omparning, radering/retention och iOS-Safari. PR #96:s automatiska tester innebär inte att hela INT-03 är validerat.

## 3 november 2026 – SEC-02A: verifierat databasskydd och minimerade gamla behörigheter

- [x] **SEC-02A granskat i verkliga Supabase, read-only:** åtta RLS-tabeller utan policy identifierade via Advisor. Fyra (agreements, agreement_approvals, family_direct_messages, schyssta_notifications) saknar redan direkt SELECT/INSERT/UPDATE/DELETE för `anon` och `authenticated`. Fyra äldre (families, family_members, invitations, messages) hade däremot breda databasrättigheter men inga RLS-policyer. Ingen privat data lästes. Databasens 27 autentiserade SECURITY DEFINER-varningar har `search_path=''` och refererar `auth.uid()`; detta räcker inte för att bevisa att varje funktion är korrekt behörighetskontrollerad.
- [x] **SEC-02B – minsta möjliga rättighetsreduktion (mergad PR #95 och installerad):** ny REVOKE-migration som tar bort direkt `PUBLIC`/`anon`/`authenticated` åtkomst från fyra äldre familjetabeller. Samtidigt stängs `EXECUTE` av för det avvecklade `shared_general_deck_complete()`-RPC:t, inte för aktuella parnings-, svep-, meddelande- eller samtyckes-RPC:er. Endast grants ändras. Ny PostgreSQL-regression och Node-kontrakt är godkända via PR #95; migrationen `revoke_legacy_family_table_grants` har tillämpats i verkliga Supabase som **20261103111142**. SQL efter installationen verifierade nekad direkt SELECT/INSERT/UPDATE/DELETE på samtliga fyra tabeller, att avvecklat RPC nekas och att fyra aktiva RPC:er har `EXECUTE=true`. Ingen användardata ändrades.
- [x] **SEC-02C – teknisk release verifierad:** PR #95 är mergad, UI-CI **#41625212255** och PostgreSQL-CI **#41625212349** godkända. Verklig migration **20261103111142** installerad och kontrollerad med SQL. Advisor-varningar för autentiserade SECURITY DEFINER minskade **27 → 26**; 8 RLS-tabeller utan policy kvarstår men inga av de åtta ger direkt Data API-grants för vanliga klientroller enligt read-only kontroll.
- [ ] **SEC-02D – kvar:** fullständig granskning av de 26 avsiktligt exponerade RPC:ernas behörighetsvillkor, lösenordsskyddet, API/Data API-inställningar och riktiga tvåkontotester. RLS-linterns INFO kan vara avsiktlig för RPC-only tabeller.

## 3 november 2026 – IPIP egen dataexport, mergad PR #94

- [x] **PF-01A – exportera egna IPIP-svar (kod och tester):** lokal JSON-export av giltiga besvarade frågor med svensk frågetext, instrument-ID, version, datum och information om preliminär översättning. Fungerar även vid ofullständigt test, utan att skriva något i Supabase. Ingen familjeidentitet, partnerprofil, delningsstatus eller AI-text ingår i filen. Playwright testar faktiskt nedladdad fil och Node testar partiellt/färdigt test. **PR #94 mergad och publicerad:** PR-CI **#41620136382**, main UI **#41620395476** och GitHub Pages **#41620394681** godkända. Merge commit `8377fa96e2d7e3f2e9261a8c3a50297c229d4ffc`. Inga användarsvar ändrade.
- [ ] **PF-01B – kvar:** genomför verklig Safari-/iOS-kontroll, versionssäkra nya testomgångar, historik och export/radering av samtliga kontodata. PR #94:s gröna CI/merge/Pages innebär **inte** att fullständig GDPR-datahantering är färdig.

## 3 november 2026 – startsida och aviseringar, PR #93 mergad

- [x] **NOT-01A – synliga fel vid okänt antal olästa (kod och tester):** startsidan skiljer nu misslyckade serverkontroller från ett känt nollvärde, visar ”minst X olästa” när en källa saknas och erbjuder en knapp för nytt försök. Inga meddelandetexter eller privata svar exponeras i felstatus. Testkod mergad via PR #93, PR-CI **#41619480644**, main UI **#41619633238** och Pages **#41619631482** godkända.
- [x] **UX-03A – korrekta startsidebeskrivningar (kod):** ersatt felaktiga generiska platshållare med konkret information om Inkorg, Gillaswajpen, Big Five, Kommunikationsråd, Schyssta listan och AI-medlaren; upplysning om parningskrav för Inkorg/regler.
- [ ] **NOT-01B – framtida aviseringar och riktig verifiering:** kontrollera återanslutning med två autentiserade konton. Nya aviseringar för aktivitetskort och resultat är inte implementerade.

## 3 november 2026 – SW-04 + SW-01, mergad PR #92

- [x] **SW-04A – obesvarade förståelsekort (kod och test):** skilj överhoppade från färdiga svar. Slutvyn beskriver nu hur många som är obesvarade, och tonåringen kan öppna **bara** dessa kort utan att gå om hela kortleken. Nytt val att hoppa över igen behåller kortet obesvarat; ett faktiskt JA/NEJ tar bort överhoppningen. Mergat via PR #92 till `main` med godkänd PR-CI **#41618370067**, main UI **#41618537342** och Pages **#41618536211**. Mobila Playwright- och sessionsregressioner tillagda.
- [x] **SW-01C – upptäck extern B-återkallelse (kod och test):** när insiktsvyn är öppen återhämtas de sju serververifierade A-resultaten och de uttryckligen delade B-korten vid återkomst till fliken och som högst en gång per minut i förgrunden. Oförändrad datamängd ger ingen omrendering eller ny AI-reflektion. Vid fel rensas A+B tillsammans i stället för att behålla en gammal sammanställning. Mottagarens gamla redan genererade AI-text kan dock finnas kvar fram till nästa lyckade kontroll.
- [ ] **SW-01D – autentiserat tvåkontotest:** verklig Supabase/Worker-verifiering av B-delningsåterkallelse i två sessioner, inkl. konto- och familjebyten, är fortfarande inte genomförd. De nya testen använder syntetiska konton.

## 3 november 2026 – genomförda och verifierade leveranser

- [x] **PR #90 mergad, kod- och UI-testad och publicerad:** förälders MI-inspirerade guide med källor, korrekt förklaring av separat B-samtycke i kortleken, borttagen dubblerad polling-fokuslyssnare och rättad dokumentation. PR-CI **#41612247828**, main UI **#41612435895**, Pages **#41612433986** godkända; merge commit `c20bd52b918ffb27a3c53db09dcbe2ee679f74e2`. Inget verkligt autentiserat tvåkontotest.
- [x] **SEC-01 – begränsad intern triggerfunktion (#91):** Advisor identifierade `public.revoke_understanding_share_on_private_change()` som `SECURITY DEFINER` exekverbar av `anon`/`authenticated`. Granskade triggerkopplingarna. PR #91 mergades med godkända UI-/Node- och syntetiska PostgreSQL-tester (**#41612814260**, **#41612814569**). Migration `20261103094113` är installerad i verklig Supabase. **Verifierat direkt i SQL:** `anon_execute=false`, `authenticated_execute=false`, `active_trigger_count=2`. Den anonyma SECURITY DEFINER-varningen försvann från Advisor. Ingen familjedata ändrades.
- [ ] **SEC-02 – övrig säkerhetsuppföljning:** Advisor har fortsatt 26 varningar för autentiserade `SECURITY DEFINER`-RPC:er, som kan vara avsiktliga och inte får stängas av generellt; åtta RLS-tabeller saknar policy (kan vara avsiktligt om bara säkra RPC:er ska användas). Advisor rapporterar också att skyddet mot läckta lösenord är avstängt. Granska före extern pilot: [Supabase säkerhetsrådgivning](https://supabase.com/docs/guides/observability/advisors?lint=0029_authenticated_security_definer_function_executable).
- [ ] **Fortfarande öppet:** riktiga autentiserade tvåkontotester för B-samtycke/återkallelse, AI-kontext, MI-sidans begriplighet och säkerhet.

## Delade uppgifter = samma uppgifter för AI och användare (2 november 2026)

- [x] Kod för att visa gemensamma insikter och uttryckligen delade förståelsekort i testwebbplatsen, med befintlig server-RPC. Ingen andra AI-samtyckesknapp.
- [x] Kod för att AI-medlaren och swajp-analysen använder samma behörighetsstyrda delade B-kort som den inloggade föräldern/tonåringen ser.
- [x] Tester skapade för roller, ogiltiga B-ID:n, odelade kort och återkallelse.
- [x] **PR #88 driftsatt:** merge till main, båda testkedjorna och Pages-publicering godkända. Ny Worker-version `bf3f49d3-30b5-45fc-aeb4-8fa2866c5067` aktiv till 100 %, med testkonto-allowlist och befintliga bindningar bevarade.
- [ ] **Verklig tvåkontojämförelse:** tonåring delar/återkallar B-kort, förälder och tonåring ser samma delade innehåll i respektive vy, AI använder samma tillåtna data vid ny analys. Kontrollera också att privat B-svar inte går till den andra.

## Statusregler
- **[x] Implementerat och automatiskt testat** = kod på `main`, med verifierat kontrakt/CI. Det betyder **inte** att riktig tvåläsarsession, användbarhet eller klinisk effekt har validerats.
- **[ ] Kräver arbete/verifiering** = kvarstående funktion, integration, uppföljning eller verkligt test. Punkten kan ha fungerande delkod.
- **Avstängt** = kod kan finnas och migrationsfil kan vara installerad, men aktuell feature flag är `false`. Det är inte en aktiv användarfunktion.
- **Historisk text** i den omfattande ROADMAP ska inte läsas som nulägesstatus; dessa uppgifter gäller om de motsäger tidigare anteckningar.

## Genomfört under helgen

### Schyssta listan och inkorg (PR #56–#69)
- [x] Felaktiga eller manipulerade backend-payloads avvisas utan partiell visning (#56).
- [x] Förslags-/röstflöde för A-matchade regelkort med separat aktivt godkännande av båda, samt parningsisolering och backend-kontrakt (#57–#59 samt tidigare grund).
- [x] Manuella förslag från båda rollerna, förfrågningsstatus, ändringsförslag, versionshantering och särskild åtgärdsvy (#59, #61, #65).
- [x] Regelnotiser i inkorgen, oläst/läststatus, startsidesuppmaningar och navigationsmärken (#60, #64–#67).
- [x] Återkallelse, avslut och behörigt arkiv/versionshistorik (#62–#64).
- [x] Sökning, filter, neutral ”Inte nu”, återupptagning, tillgänglighets- och timeoutförbättringar (#66–#67).
- [x] Privata tvåvägsmeddelanden mellan nuvarande familjepar med skilda läskvittenser, historia och serverbaserat säkerhetskontrakt (#68–#69).
- [x] `enableSchysstaList: true` på den interna webbplatsen. Aktuella RPC-migrationer anges som installerade i tidigare ROADMAP; verkligt heltäckande tvåkontotest **inte dokumenterat som klart**.

### Big Five/personlighetstest (PR #70–#78)
- [x] Versionssatt svenskspråkigt IPIP-50 med 50 frågor, omvänd kodning, 5 skalor, egna sparade svar och återupptagning (#71–#73).
- [x] Serverkontrollerad delning **enbart av fem skalpoäng** efter två aktiva samtycken, med möjlighet att återkalla (#72–#73).
- [x] Visuell svarsmarkering och redovisning av amerikanskt vuxenreferensurval, M/SD (#74).
- [x] Fem horisontella jämförelsestaplar i en **linjär uppskattad percentilskala**, med korrekt P50/P75-position och normalmodellbaserade SD-zoner (#75).
- [x] Versionssäker cache-uppdatering så att Safari hämtar den nya profilen (#76).
- [x] Regelstyrda likheter/skillnader med redaktionella gränser och riktade råd (#77).
- [x] Fördjupade, separat skrivna texter för förälder och tonåring, alla fem skalor, vardagsexempel, frågor och relevanta länkar till verkligt existerande funktioner (#78).
- [x] Automatiska poäng-/integritets-/UI-tester och mobilskärmbilder för ovanstående. Frågornas svenska ungdomsvaliditet och referensens generaliserbarhet är **inte** fastställda.

### Tidigare Gillaswajpen-arbete som behöver skiljas från release
- [x] Stabil kortmodell med A (matchning) och B (förståelse), versionssatta ID:n, 34 allmänna kort och omfattande temakortlekar (inklusive **104 Aktiviteter** och **104 Samtalsämnen**); redaktionell riskgranskning dokumenterad.
- [x] Egen svarssparning, återupptagning, defensiv JA+JA-filtrering och automatiska integritetstester finns i koden.
- [x] A-only-servervitlistan och separat B-delning finns dokumenterade som installerade per 30 oktober. Detta är **inte** samma sak som att samtliga delningsvyer är aktiverade eller slutverifierade.
- [x] `enableSharedInsights:true` och `enableSharedUnderstanding:true` är kodade, mergade och driftsatta för interna konton genom PR #88; B-delning kräver ett uttryckligt aktivt tonåringsval per kort. **Ingen verklig tvåkontoverifiering är dokumenterad.**
- [ ] `enableSharedPriorities:false` och `enableSharedPolling:false` är fortfarande avstängda. Aktivera först efter relevanta negativa tester och autentiserad end-to-end-kontroll.

## Prioriterad nästa arbetskö

### P0 – riktiga integrations-/samtyckestester
- [ ] **INT-01: Fullt Gillaswajpen-test med två autentiserade testkonton.** JA+JA, NEJ, olika svar, B-delning + återkallelse, alla sju kortlekar, gamla historiska svar, oparad/omparad användare och annan familj. Ändra inte befintliga testsvar. Dokumentera exakta steg, utslag och eventuella blockeringar. Därefter kan relevant feature flag prövas.
- [ ] **INT-02: Schyssta listans fulla tvåkontoflöde.** Båda rollerna: manuellt förslag → separat eget beslut → inkorg och oläststatus → två ja → ändringsförslag → återkallelse → historik → omparning; kontrollera i riktiga servern och i två webbläsarsessioner. Automatisk pgTAP/Playwright är bra grund men ersätter inte detta.
- [ ] **INT-03: Inkorgen med riktiga parade konton.** Skicka/läs i båda riktningar, läskvittenser, paginering, återanslutning, isolering efter avparning, XSS-risken och mobilens skroll/fokus. Utred uttryckligen hantering av meddelanderadering och retention före pilot.
- [ ] **INT-04: Big Five i två riktiga sessioner.** Prova återupptagning, svarsversion, dubbelsamtycke, återkallelse, utloggning/omparning, korrekta rolltexter och samma poäng i tabell/graf. Begränsa testdata och ändra inte tidigare testsvar.

### P1 – funktioner som ännu inte är klara/aktiverade
- [ ] **SW-01: Verifiera och färdigställ B-förståelsedelning** som redan är aktiverad internt (`enableSharedUnderstanding:true` via #88): realtidsavstämning, uttryckligt samtycke, nej/överhoppning, återkallelse, rollanpassad sammanfattning och tvåkontotest. Aktivering i kod är inte lika med färdig användarvalidering.
- [ ] **SW-02: Slutverifiera den aktiva gemensamma insiktsytan** (`enableSharedInsights:true` via #88) för alla kortlekar: serververifierat A JA+JA, separat behörig B-information, ”Möjligt att utforska” och ”Så här funkar jag/min tonåring”, kvalitativa råd och meningsfull prioritering. Riktiga tvåkontotester och sluten prioriteringsfunktion återstår.
- [ ] **SW-03: Koppla privat viktighetsskattning (tre lägen)** till faktisk gemensam prioritetsordning för godkända resultat. Behåll integritet och tydlig skillnad mellan individuell prioritet och gemensamt beslut; därefter `enableSharedPriorities`.
- [ ] **SW-04: Validera överhoppning och live-matchningar** över stora kortlekar, inklusive ofullständig kortlek, återbesök, lås-/upplåsningslogik och ändrade kortversioner. Rätta eventuella kvarvarande synkfel innan polling aktiveras.
- [x] **MI-01A – mergad och publicerad 3 nov (#90):** separat MI-inspirerad föräldraguide under Kommunikationsråd, med vardagsexempel, autonomi, vuxenansvar och länkar till tre svenska kunskapskällor. Länk i Schyssta listan, rollbegränsad vy, mobil- och Node-tester. PR-CI #41612247828, main UI #41612435895 och Pages #41612433986 gröna. Verklig rollkontroll med två autentiserade konton återstår.
- [ ] **MI-01B – granska och följa upp:** CI/Pages passerade för #90. Verifiera med faktiskt förälder-/tonåringskonto samt språk, källornas relevans och användbarhet i mobilen. Bedöm inte detta som en validerad MI-behandling.
- [x] **SW-01A – korrekt B-information mergad och publicerad (#90):** texten som felaktigt sade att delning var avstängd är ersatt. Förklarar att varje förståelsekort förblir privat tills tonåringen uttryckligen delar och länkar till Gemensamma insikter. Kod-, mobil- och build-tester passerade 3 november.
- [ ] **SW-01B – autentiserad B-verifiering:** testa delning, återkallelse, äldre kortsvar, omparning samt exakt samma serverdata hos båda roller och AI innan den bredare SW-01-punkten kan markeras färdig.
- [ ] **PF-01: Versionssäkra testomgångar och full datahantering.** Egen IPIP-JSON-export är kodad separat i PF-01A. Ny omtestningssession, datum/version, historik och självständig radering/export av all användardata utan att tyst skriva över svar återstår.
- [ ] **PF-02: Fullfölj metodgranskning.** Översättningens begriplighet/validitet för ungdomar, mätinvarians mellan tonåring och vuxen, den amerikanska vuxenreferensens begränsningar samt lämpligheten av normalmodellerade percentiler.
- [ ] **PF-03: Textkvalitet och återkoppling.** Testa råpoängsgränsernas begriplighet, att hypoteser inte uppfattas som diagnoser, textlängd och praktiskt värde från både föräldra- och tonårsperspektiv. Separera sorteringsgränser från psykometrisk säkerhet.
- [ ] **UX-01: Gör slutlig mobil- och tillgänglighetsgenomgång.** Granska den tidigare rapporterade avklippta nedersta menyn, bredder 320/390 px, stora tecken, skärmläsare, tangentbord, fokus, felmeddelanden och scrollbar.
- [ ] **UX-02: Fullfölj ikonbaserad och kortfattad Gillaswajpen-sammanfattning**, inklusive strukturerade råd, prioriterade kort och tillgängliga alternativa texter.
- [ ] **NOT-01: Samla behöriga aviseringar på startsidan** från kortaktiviteter, inkorg, regler och nya resultat utan att avslöja privata svar eller skapa störande påminnelser.

### P1 – AI-medlaren i intern testutveckling (2026-11-01)
- [x] **AI-01A: Driftsatt separat Worker, Workers Free, autentisering, verklig D1-kvot och svensk fiktiv modellprovsvar.** Ingen publik webbplatsmerge.
- [x] **AI-01B: Privat D1-chatt med skapande, lista, historik, radering, serverstyrd ägarisolering och rollstyrt stöd (parent/teen via verifierad RPC).** En ren AI-featurebranch mergades via PR #81 till `main` och chattgränssnittet ingår i webbplatsens källkod; live-test på Pages återstår.
- [x] **AI-01C: Fiktiva databas- och V8-kodkontroller.** 28 automatiserade testfall från GitHub-koden passerade i simulerad körning; verklig D1 bekräftar ägarfilter, kaskadradering och stabil meddelandeordning. AI- och UI-workflow har senare passerat för PR #82; detta ersätter den äldre uppgiften om ej verifierad CI.
- [ ] **AI-01D: Verifiera två verkligt autentiserade testkonton, webbläsare/mobil och reella Worker-anrop** innan aktivering på GitHub Pages. Kontrollera även att säkerhetsmeddelanden och konto-/sessionsbyte fungerar som avsett.
- [ ] **AI-01E: Granska barn-/ungdomsskydd, kliniska risker, säkerhet och dataskydd.** Endast fiktiva samtal hittills; enkel riskfrasmatchning är INTE en klinisk säkerhetslösning.
- [ ] **AI-02/03: Kvalitetsverifiera redan aktiva automatiska Gillaswajp-/personlighetsanalyser** (Worker och intern `enableAiResultAnalyses:true` via #86). Granska faktiska modelltexter, behörig kontext, språk, rollasymmetri och korrekt uppdatering efter återkallat samtycke. Tvåkontotest saknas.

- [x] **AI-01G – valbar projektkontext (implementerad kod på PR #84):** kryssruta för att använda/inte använda projektuppgifter inför svar. När av hoppar Worker över samtliga projekt-/roll-RPC:er; ogiltig flagga nekas. Node- och Playwright-mobiltest (simulerad Worker) för opt-out/återställning och serverkontroll, plus regression för återkallat Big Five-samtycke. **PR #84 är nu mergad till `main`; faktisk Cloudflare Worker-release och tvåkontotester återstår.** 
- [x] **AI-01G – automatisk CI:** AI-backend, Node, bygget och UI/Playwright passerade efter senaste kodändringen; 28 screenshots inklusive mobil opt-out genererade (GitHub Actions run #41419931438, AI run #41419931803).
- [ ] **AI-01G – återstår till färdig leverans:** faktisk verifiering av distribution av uppdaterad Cloudflare Worker och manuell verifiering med båda riktiga testkontona. Testa återkallat samtycke i den verkliga miljön separat.

- [x] **AI-01F: Ge medlaren behörig kontext från Hemmakompassens andra sidor.** PR #82 mergad till main, uppdaterad Worker på Cloudflare, godkänd AI-/browser-CI. Implementerat: egna Gillaswajpen-svar och prioriteringar, servergodkända gemensamma ja-ja, egna Big Five-faktorer, endast samtyckt delad profil, godkända regler/förslag och högst fyra korta inkorgsutdrag. Underlaget hämtas om inför varje svar, med stark roll- och sekretessprompt. **Återstår:** manuell test med båda interna konton samt kontroll att återkallat samtycke slår igenom i AI-svaren.
### P2 – framtida tjänstekvalitet
- [ ] **AI-01: Produktionsklar AI-medlare** återstår trots driftsatt intern testserver och kod för privat chatthistorik. Följ AI-01D/E samt ROADMAP FAS 5; markera inte som färdig före verklig tvåkontotestning och skyddsgranskning.
- [ ] **DATA-01: Datahantering och juridik för pilot.** Radering/export/retention, rättslig grund, information till ungdomar, incidenthantering och eventuell DPIA. Genomför innan externa verkliga användare.
- [ ] **PILOT-01: Genomför verklig användbarhets- och etisk granskning** med föräldrar/ungdomar innan offentlig lansering. Mät förståelse och upplevd press; inga påståenden om behandlingseffekt utan evidens.

### Intern driftsättning av AI-reflektioner – 2 november 2026
- [x] PR #85 mergad till main med godkänd CI.
- [x] Ny Cloudflare Worker driftsatt till 100 %, sex ursprungliga bindningar kvar, allowlist med två testkonton.
- [x] Frontendaktivering mergad och publicerad i PR #86 med synkroniserade cacheversioner. Servern begränsar fortsatt åtkomsten till de två interna AI-testkontona.
- [x] Release-PR #86: mergad, UI-/Playwright-CI #41430090229 och GitHub Pages-deployment #41430089630 godkända. Riktig inloggad genomgång står kvar som egen uppgift.
- [ ] Två verkliga autentiserade testkonton, återkallat samtycke, AI-textgranskning och återupptagning kräver ytterligare test. B-förståelsekort fortsatt avstängda.
- [x] **QA-protokoll skapad:** `docs/ai-reflections-two-account-qa.md` med konkreta fall för egna/samtyckta profiler, JA+JA, B-förståelsekort, kvot och kontobyte. Dokumentet är en testplan, inte genomförda autentiserade tester.

### AI-02/03 – automatiska analyser i resultatvyerna (2 november 2026)
- [x] **AI-02/03 konfliktlösning:** `main` inklusive mergade PR #84 och kod för PR #85 sammanförda i merge-commit `acb1f48d79a95e68597e832ef115cd4b2fd606fd`; GitHub markerar #85 som mergebar. CI för kombinationen ska verifieras innan eventuell merge.
- [x] **AI-02/03 kod på PR #85:** separat AI-analysendpoint med serverberäknade fem IPIP-poäng, endast ömsesidigt servergodkända A JA+JA, frivilligt delade partnerfaktorer samt rollanpassad analys. Inga klientinskickade poäng eller svar accepterade.
- [x] **UI-kod på PR #85:** generera automatiskt vid färdigt personlighetstest och hämtade swajpmatchningar, visa analys på samma sida med laddstatus, felhantering och manuell omgenerering. Förskrivna tolkningsråd döljs när AI aktiveras; faktiska grafer och resultat finns kvar.
- [x] **Testkod på PR #85:** autentisering, negativa klientsvar, serverkontrollerade delningsgränser, avbrutet test, kvot, XSS-escaping och återanvändning per resultatsession.
- [x] **AI-02/03 automatisk CI/Playwright:** GitHub Actions AI #41424425020 samt UI #41424425062 gröna med syntetiskt mobiltest, 29 skärmbilder och verifierat statiskt bygge.
- [ ] **AI-02/03 verklig kvalitet:** två autentiserade testkonton, språk/rollasymmetri, manuellt granskade mobilbilder, återkallelse och faktisk kvotförbrukning återstår.
- [x] **AI-02/03 teknisk intern release:** Cloudflare Worker `/api/ai/analyze` och `enableAiResultAnalyses:true` är driftsatta via #86. Behörig B-delning genom #88 tillåter bara uttryckligen delade förståelsekort. Verkliga tvåkontotester, återkallelse och granskning av faktiska modelltextsvar återstår.

## Arbetsregel för följande utvecklingspass
**Obligatoriskt enligt ROADMAP 2026-11-02:** kryssa av varje genomförd förändring i samma utvecklingspass, dela upp delvis färdiga uppgifter och ange PR/commit samt verifieringsnivå. `[x]` för branchkod betyder inte publicering eller riktig tvåkontoverifiering.

1. Börja med högst prioriterade oavslutade `INT-*` / `SW-*` uppgifter och korrigera dokumenterade blockerare; om autentiserat test blockeras, fortsätt med en kod- eller UX-uppgift som går att genomföra utan extern hjälp.
2. Spara i `ROADMAP.md` eller här: PR/commit, exakta kontroller, vad som är **implementerat**, **verifierat med mock/CI**, **verifierat i verkligt tvåkontoflöde** samt vad som inte är känt.
3. Dra inte slutsatsen att en migrationsfil i GitHub är installerad eller att en flagga är på. Verifiera via rätt källa.
4. Bevara befintliga svar, samtyckeskrav och serveravgränsningen. Publicerad Pages-URL är fortfarande en internetåtkomlig sida, även om projektet är avsett för intern testning.
