# FUN-03 – sammanhängande tvårollstest med gemensam syntetisk familjedata

**Datum:** 8 november 2026. **Underlag:** [PR #215](https://github.com/erikjarl/hemmakompassen/pull/215), `tests/visual.mjs` (funktionen `verifyPairedTwoRoleExchange`) och GitHub Actions på PR-grenen.

## Testuppställning

Två oberoende Chromium-kontexter med samma simulerade familjepar: **förälder, 390 px**, och **tonåring, 320 px**. Båda får separata inloggade testroller, men deras `my_family_messages` och Schyssta-/notis-RPC:er går via en delad, deterministisk **in-memory-fixture på testsidan**. Denna fixture har avsiktligt inte kontakt med Supabase, produktions-Worker eller verkliga konton. Vanliga webbläsarhändelser (klick, formulärsubmit, navigering, omladdning) utlöser appens faktiska frontend-logik.

## Sekventiella testmoment och förväntat utfall

1. **Förälder skickar till tonåring:** meddelande skickas med simulerat förlorad serverkvittens *efter att skrivningen sparats*. Frontend behåller texten för ett manuellt återförsök. Nytt klick med samma idempotensnyckel ger bara **en** lagrad post.
2. **Tonåring tar emot och läsmarkerar:** den andra sessionen uppdaterar konversationen och ser meddelandet som mottaget, utan automatiskt läskvitto. Ett explicit klick på `Markera alla meddelanden som lästa` skapar läskvittot. Förälderns uppdaterade tråd visar `Läst`.
3. **Tonåring svarar:** en separat skrivning från tonåringen visas som mottagen i förälderns uppdaterade konversation. Den gemensamma mocken ska innehålla två meddelanden, inte tre.
4. **Förälder föreslår en regel:** fyller i Schyssta-listans formulär och skickar. Servermocket skapar en väntande regel med `parent_decision=null` och `teen_decision=null`. Ingen part får automatiskt godkännande.
5. **Tonåring får en regelnotis:** uppdaterar den redan öppna inkorgen med **avsiktlig sidomladdning** (navigering till identisk URL räcker inte som en serveruppdatering). Notisen är oläst tills tonåringen själv markerar den; `Visa regeln` öppnar rätt regel.
6. **Två separata godkännanden:** tonåringen väljer `Inte nu` och återupptar utan backendbeslut, godkänner därefter regeln. Föräldern ser fortfarande sin egen röst som saknad och godkänner explicit. Endast efter bådas ja visar både föräldern och tonåringen `Godkänd av båda`.

Browser-assertionerna granskar även dokumentöverströmning på 390/320 px. Testet skriver ett syntetiskt bevisunderlag i `artifacts/fun-03-linked-two-role-synthetic.json` och körs med tidigare UI-regressioner.

## Körning och avgränsningar

CI-körningar för felsökning: [första körningen #42492849709](https://github.com/erikjarl/hemmakompassen/actions/runs/42492849709) och [diagnostikkörningen #42493289043](https://github.com/erikjarl/hemmakompassen/actions/runs/42493289043). Båda var **röda i den nya testdelen** eftersom testerna navigerade till en redan öppnad `#inkorg` utan att utlösa ny serverhämtning. Servermocket innehöll då notisen, men tidigare inläst sida hade ännu inte uppdaterats. Testet använder därefter explicit `page.reload()` för att verifiera **färsk** hämtning. Slutlig körstatus ska kontrolleras i [PR #215](https://github.com/erikjarl/hemmakompassen/pull/215).

**Begränsning:** Simulerad Auth och RPC kan inte fastställa om verkliga Supabase-policys, parning, notisleverans i realtid, läskvittenser eller serverpersistens fungerar i produktion. Resultatet är en starkare klientflödesregression än isolerade mockar, **inte ett autentiserat tvåkontotest**. Befintliga användarsvar och meddelanden berörs inte.
