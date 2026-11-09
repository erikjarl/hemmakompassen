# FUN-02-ACTIVITY-SESSION-01 – aktivitetsinbjudan och försenade tidigare kontosvar

**Datum:** 9 november 2026 · **PR:** [#246](https://github.com/erikjarl/hemmakompassen/pull/246) · **Verifieringsnivå:** Node/VM mot riktig klientfunktion och syntetisk Chromium; riktiga signerade tvåkontotester kvarstår.

## Reproducerat funktionsfel

Efter att ett konto/familjepar hade bytts kunde ett försenat svar från den **gamla** användarens aktivitetsinbjudan nollställa den **nya** sessionens `activityInviteBusy`. Då kunde den nya knappens laddningsindikator släckas trots att dess kontroll av familjekoppling eller gemensam JA+JA-aktivitet ännu inte var klar. Det riskerade dubbla klick och missvisande upplevelse, men skapade inte i sig något automatiskt skickat meddelande.

På separat gren lades två deterministiska regressionstester till **före** produktionsrättningen. [Röd CI #42548759507](https://github.com/erikjarl/hemmakompassen/actions/runs/42548759507) visade **två FAIL**: (1) gammal parningskontroll avslutas medan ny väntar; (2) gammal `shared_swipe_matches`-läsning avslutas medan ny väntar. Testet använder den faktiska `prepareActivityMessage()`-implementationen från `live-app.js` i Node VM, med två fiktiva familjer och kontrollerat fördröjda Promise-svar.

## Rättning

I `live-app.js` får en gammal åtgärd inte längre skriva `activityInviteBusy=false` om `user.id` eller `sharedSession` ändrats under väntan. En åtgärd för *samma* session frigör fortfarande indikatorn vid avbruten familjekontroll eller sidbyte. Före själva utkastet görs, precis som tidigare, två kontroller: aktuell familjekoppling och serverns aktuella gemensamma JA+JA-matchning. Utkastet kräver att användaren själv väljer att skicka. Ingen databas-, Worker- eller Supabase-ändring.

Äldre testfall för kontoändring har justerats för att simulera att kontoåterställningen redan har nollställt den gamla åtgärdens laddningsstatus. Ett nytt test väntar tills båda RPC:erna faktiskt har startat i stället för att förutsätta en enda mikrouppgift.

## Återstående verifiering

**Grön PR-CI #42549075806:** 440/440 Node-tester, byggkontroll och syntetisk Chromium med 77 skärmbilder. Efter sammanfogning med uppdaterad `main` ska slutlig PR-CI, merge till `main`, Pages-deploy och serverade bytekontroller kontrolleras. Därefter krävs fortfarande verkliga två inloggade testkonton, nätverksfördröjning och fysisk mobil/Safari för fullständig FUN-02-verifiering. Testerna i denna PR ändrar inte några verkliga användarsvar eller meddelanden.
