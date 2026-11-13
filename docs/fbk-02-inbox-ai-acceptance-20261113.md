# FBK-02 – verifiering av AI-reflektion överst i Inkorgen

Datum: 2026-11-13. **Status: protokoll, inte utförd autentiserad verifiering.**

## Syfte och avgränsning
Testar rapporten att användaren behöver gå via »Visa gemensamma insikter« för att hitta AI-reflektionen. I nuvarande `inboxView()` renderas avsnittet »Era gemensamma insikter och AI-reflektion« före uppdatering, olästöversikt, aktivitetsaviseringar, privat chatt och regelförfrågningar. Källordning ensam bevisar inte att panelen är synlig, begriplig eller får AI-svar från tjänsten.

## Förutsättningar
Två verkliga, sammanparade testkonton (förälder/tonåring) och gällande delningssamtycken. Använd i första hand redan existerande, uttryckligt delade testsvar. Förvandla inte privata B-svar till delade svar för testets skull. Inga användarsvar eller beslut får justeras genom databas-SQL.

## Utförande
1. Logga in som förälder och öppna `#inkorg` vid 390 px. Kontrollera första synliga rubrik, panelordning och om AI-reflektionen syns utan att följa en länk. Dokumentera skärmbild med privata texter maskerade.
2. Upprepa som tonåring. Kontrollera att rätt roll och aktuell familjeparning används, och att ingen tidigare parnings analys återkommer.
3. Med verifierade gemensamma svar: invänta serverhämtning. Notera separat om panelen visar laddning, en reflektion, ett fel eller beskedet att reflektion saknas. Endast ett faktiskt returnerat AI-svar räknas som fungerande AI.
4. Prova 320 px, 390 px och desktop samt tangentbordsnavigation. Kontrollera att rubriken inte hamnar under menyn, att text inte överlappar eller klipps, att fokus är synligt och att det finns en begriplig väg vidare.
5. Skriv ett **osänt** utkast i privat chattskrivfält. Uppdatera AI-panelen eller invänta dess asynkrona render. Kontrollera att skrivfältets text och fokus inte går förlorade; skicka inte meddelandet.
6. Simulera avbruten insiktsläsning i en isolerad testmiljö (inte genom att ändra verklig databas). Kontrollera att fel/laddning visas tydligt och att gammal AI-reflektion inte presenteras som aktuell.
7. Låt två testare oberoende utföra uppgiften »Hitta den gemensamma AI-reflektionen och förklara om den bygger på era delade svar«. Anteckna om de hittar den **utan hjälp**, vilken text de tolkar som AI och eventuella missförstånd.

## Godkännandekriterier
- Panelen visas överst utan extra navigering för båda roller när förutsättningarna är uppfyllda.
- Verifierat, aktuellt delningsunderlag krävs innan AI-reflektion visas. Laddning, fel och avsaknad är inte samma sak som AI-svar.
- 320/390 px, tangentbord och desktop fungerar utan överlapp och utan att text eller åtgärder döljs.
- Asynkron uppdatering raderar inte osänt chattutkast.
- Testare hittar funktionen utan hjälp och förstår vad som är gemensamt delat. Dokumentera faktiskt utfall, även vid misslyckande.

## Resultatlogg (fylls först efter genomfört test)
- Datum, miljö, serverad versionsmarkör:
- Föräldraroll / tonårsroll:
- 320 / 390 / desktop / fysisk Safari:
- Faktiskt AI-svar / laddning / fel / saknas:
- Privat utkast bevarat:
- Oberoende uppgiftstest:
- Avvikelse, reproduktionssteg och referens till avidentifierad rapport:

**Rapporten i `public.test_feedback` ska förbli öppen tills relevanta utfall är reproducerade och användarbekräftade.** Ingen rapporttext, identifierare eller AI-genererat privat innehåll ska kopieras till GitHub.
