# SW-03 / SEC-02 – automatisk återkallelse vid ändrad viktighetsskattning

**Datum:** 8 november 2026. **Miljö:** faktisk ansluten Supabase-testdatabas. **Testtyp:** isolerad transaktion och simulerade PostgreSQL JWT-claims, **inte** signerad Auth.

## Fråga

När tonåringen uttryckligen delar att ett gemensamt JA+JA-kort är **mycket viktigt** (`importance=1`), ska ett senare byte till **neutral** (`importance=0`) omedelbart ogiltigförklara delningen. Återgång till `1` får inte återuppliva ett tidigare samtycke automatiskt. Radering av skattningen ska också återkalla delningen.

## Metod och dataskydd

Testet använder redan existerande gemensamma JA+JA på `general-11`. Det kontrollerar uttryckligen att det **inte finns någon befintlig tonårsskattning eller delning för kortet**. Om sådana finns avbryts testet före någon skrivning.

I transaktionen `BEGIN … ROLLBACK` skapas enbart en **ny, tillfällig** skattning för detta kort. Den ordinarie behörighetsstyrda RPC:n `set_swipe_priority_share` används med simulerad tonårsidentitet för uttrycklig delning. Den riktiga installerade triggern på `swipe_importance` används för att kontrollera hur delningen reagerar när den tillfälliga skattningen ändras eller raderas. Ingen tidigare skattning eller svar skrivs om.

Den exakta versionshanterade [SQL-filen](../supabase/tests/sec02_priority_rating_revocation_rollback.sql) kördes mot ansluten Supabase och gav:

```text
PASS: temporary rating share; 1->0 auto-revokes, 0->1 does not resurrect, explicit re-opt-in required, DELETE revokes; full rollback
```

Det bekräftar att: (1) en uttryckligen delad prioritering blir synlig, (2) `1→0` tar bort den, (3) `0→1` **inte** skapar nytt samtycke automatiskt, (4) ett nytt uttryckligt val krävs, och (5) radering av skattningen tar bort den nya delningen. Slutlig `ROLLBACK` återställer alla tillfälliga skrivningar.

## Begränsningar

Testet bygger på **simulerade** `request.jwt.claims`, inte autentiska signerade tvåkontosessioner eller en verklig webbläsare. Det testar inte byte mellan två samtidigt aktiva familjer, omparning, samtidiga enheter eller återkallelse när ett redan sparat swajpsvar ändras. `enableSharedPriorities:false` ska kvarstå tills dessa kritiska krav är testade.

Det är ett **positivt backend-regressionstest** för skattningens livscykel, inte färdig P0-verifiering.
