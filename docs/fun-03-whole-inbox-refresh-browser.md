# FUN-03 – uppdatera hela inkorgen i en redan öppen session

**Datum:** 8 november 2026. **Ändring:** [PR #217](https://github.com/erikjarl/hemmakompassen/pull/217).

## Observerad funktionslucka

Det befintliga kommandot **Uppdatera konversationen** i Inkorg anropade bara den privata chattens serverhämtning. En **redan öppen** inkorg behövde därför i praktiken omladdning, navigation ut och tillbaka eller en annan automatiskt utlöst uppdatering för att säkert hämta nya regelhändelser och gemensamma aktivitetsaviseringar från motparten. I [tvårollstestet i PR #215](https://github.com/erikjarl/hemmakompassen/pull/215) måste just en sådan omladdning användas för att få en nytillkommen regelförslagsnotis.

Detta är en **konkret användbarhetslucka**, inte ett bevis på felaktig serverlagring. Resultatet gäller framför allt då användaren behåller Inkorg öppen medan den andra personen gör en ändring.

## Implementerad lösning

En ny knapp **Uppdatera hela inkorgen** visas överst för en verifierad parad familj. Vid klick:
- Gör samma aktuella parningskontroll som andra skriv-/läsflöden, och avbryter vid ogiltig koppling.
- Hämtar den senaste privata konversationen, oläst meddelandeantal, Schyssta-listans förslag och regelnotiser samt aktivitetsaviseringar om funktionen är påslagen.
- Behåller påbörjad, oskickad chatttext och utför inga åtgärder som godkänner förslag, skickar meddelanden eller läsmarkerar notiser.
- Visar statusen `Uppdaterar hela inkorgen…` följt av `Inkorgen är uppdaterad.` eller ett begripligt felmeddelande. Knappen är spärrad under samma hämtning och tangentbordsfokus återförs till knappen när hämtningen är färdig.

Den äldre, separat märkta **Uppdatera konversationen**-knappen finns kvar för den som bara vill hämta chattens historik.

## Funktionellt Chromium-test

`verifyPairedTwoRoleExchange()` i `tests/visual.mjs` har uppdaterats. Testet använder två separata syntetiska Chromium-kontexter med gemensamt in-memory-serverläge; föräldern i 390 px och tonåringen i 320 px.

1. Båda har redan öppnat Inkorg; de skickar och läser meddelanden åt båda håll.
2. Föräldern skapar ett regelförslag. Den gemensamma simulerade servern registrerar ett väntande regelförslag och en **oläst regelnotis för tonåringen**.
3. Testet tillför även en simulerad, oläst **aktivitetsnotis** för tonåringen. Den redan öppna inkorgen visar ännu ingen av dessa nya poster.
4. Tonåringen skriver ett **osänt chattutkast** och väljer **Uppdatera hela inkorgen** utan att ladda om sidan. Efter lyckad hämtning ska båda notistyperna visas, utkastets text kvarstå exakt och antalet skickade meddelanden vara oförändrat.
5. Inga explicita läsmarkeringar, meddelanden eller regelbeslut ska genereras av själva uppdateringen. En aktivitetsnotis markeras som läst **först vid eget klick**.
6. Tonåringen kan sedan öppna regeln, välja `Inte nu`, återuppta och godkänna; föräldern godkänner separat; regeln blir gemensam först efter två ja.

Testet körs som del av projektets vanliga bygg-/Node-/Chromium-CI. **Endast ett fullständigt godkänt utfall från den senaste committen räknas som verifierat.**

## Ytterligare fel upptäckt i funktionstestningen

Den första UI-körningen för PR #217, [CI #42495466503](https://github.com/erikjarl/hemmakompassen/actions/runs/42495466503), var **röd** i det nya tvårollsflödet efter att tonåringen klickat på en aktivitetsnotis med ett oskickat chattutkast. Frontenden kunde kvittera händelsen mot den simulerade servern, men knappen `Markera som läst` låg kvar i vyn. Orsak i koden: `fetchActivityNotifications()` utelämnade omrendering av Inkorg när `familyChatDraft` var ifyllt. Den avgränsningen var avsedd för tysta bakgrundshämtningar, inte för **uttryckliga användarklick**.

**Åtgärd:** en separat flagga `forceRender` tillåter omrendering efter explicita `Markera som läst`-/`Försök igen`-handlingar, medan tysta bakgrundshämtningar fortfarande avstår från att störa en pågående skrivning. Egen chatttext hålls i `familyChatDraft` och ska bevaras. Det sammanhängande Chromium-testet simulerar dessutom ett **misslyckat aktivitetsläskvitto** och kontrollerar att ett synligt fel och en `Försök igen`-knapp visas, att ingen falsk kvittens skrivs, att den nya hämtningen återställer notisen och att en lyckad uttrycklig kvittens därefter tar bort läsåtgärden. Även ett Node-kontrakttest kontrollerar skillnaden mellan bakgrundshämtning och explicit användaruppdatering.

En mellanliggande CI-körning, [#42495968911](https://github.com/erikjarl/hemmakompassen/actions/runs/42495968911), var **röd** eftersom en befintlig Node-testfil matchade den gamla, exakta funktionssignaturen med regex. Testets extrahering har uppdaterats samtidigt som ett nytt regressionstest lagts till. **Slutlig verifiering ska baseras på den senaste committen, inte på de röda körningarna.**

## Avgränsningar

Detta testar faktiskt webbläsargränssnitt mot **simulerad Auth och simulerade Supabase-RPC:er**, inte skarpa tvåkontoinloggningar eller nätverksleverans. Riktiga meddelanden, avtal och samtycken ändras inte. Visuell kontroll på fysisk iOS/Safari och faktisk serverhämtning återstår separat.
