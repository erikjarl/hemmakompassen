# INT-02 / INT-03 / SEC-02 – töm familjebunden klientdata vid avparning

**Datum:** 8 november 2026. **Typ:** klientförbättring och syntetiska tester; ingen migration och ingen ändring av befintliga användarsvar.

## Upptäckt lucka

`recheckInboxPair()` kontrollerar serverns aktuella tvåpersonersparning och parningsepok. När den misslyckades rensades tidigare privat inkorg, delade Gillaswajp-resultat, frivilligt delade förståelsekort och prioriteringar, men **inte** samtidigt den familjebundna cachen för Schyssta listans förslag, regler, samtyckesnotiser och historik eller aktivitetsnotiser. En skärm som visade sådant kunde fortfarande använda gammal information tills en fullständig kontouppdatering lyckades.

## Åtgärd

När en aktuell parning inte längre kan verifieras, rensas följande **synkront före nästa render**:

- Alla Schyssta listans familjedelade förslag, regler, manuella regler, aviseringar, ersättningslänkar och historik; pågående sparstatus och lokala svara-senare-markeringar
- Familjebundet oskickat regelutkast, öppet formulär, versions-/redigeringsmål samt tillhörande meddelande- och felstatus
- Aktivitetsaviseringar och pågående markera-läst-status
- Pågående aktivitetsinbjudan och felstatus

`schysstaRequest++` och `activityNotificationsRequest++` ogiltigförklarar samtidigt sena svar från den tidigare familjens RPC-anrop. Det sker utöver befintlig `sharedSession++`, rensning av privat inkorg och Gillaswajpens delade resultat. Vid tillfälligt RPC-fel väljer klienten **fail closed** och laddar därefter om aktuell familj. Ett oskickat regelutkast från den gamla familjen förloras avsiktligt.

## Verifiering och avgränsningar

- `tests/inbox-pairing-guard.test.mjs`: kör den faktiska `recheckInboxPair()` i isolerad Node-VM. Verifierar både att giltig parning bevarar cache och att ändrad parning rensar samtliga familjebundna datasamlingar samt ökar generationsräknare **före** render.
- `tests/visual.mjs`: syntetisk Chromium-test med startsideaviseringar, fjärravparning och efterföljande regelvy. Gamla olästa aviseringar och godkännandeknappar ska inte ligga kvar.

**Begränsningar:** ingen riktig signerad förälder-/tonåringsinloggning, ingen verklig samtidig omparning mot Supabase och ingen fysisk mobiltest. Serverns RLS, tabeller och befintliga användarsvar är oförändrade.
