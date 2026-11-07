# INT-03 / SEC-02 – parningsepok för inkorgens privata meddelanden

**Datum:** 7 november 2026. **Syfte:** Undvika att en webbläsare visar cachade meddelanden från föregående parning när samma två konton kopplas ihop igen.

## Design och ändring

Migration `supabase/migrations/20261107210000_inbox_pair_epoch.sql` lägger till enbart en **läsfunktion** `public.my_current_inbox_pair_epoch()`. Den returnerar en textidentitet baserad på aktuell `family_id`, förälderns och tonåringens `user_id` samt båda medlemmarnas `joined_at`. Värdet är inte en hemlig token, och autentiserar inte användaren; dess uppgift är att jämföra två kontroller av samma parning.

Funktionen använder `SECURITY DEFINER SET search_path TO ''`, `private.current_exact_pair_family_id()`, kontroll av att anroparen tillhör det aktuella paret, och `GRANT EXECUTE` enbart till rollen `authenticated`; allmän och anonym körbehörighet har återkallats. Den läser inga privata meddelandetexter och ändrar inga medlemskap eller sparade svar.

Aktiva `live-app.js` hämtar epoken tillsammans med kontots medlemslista. Innan inkorgen visar privata meddelanden, skickar, markerar läst eller laddar om krävs en känd epok. Vid flikfokus och inkorgspollning jämförs den aktuella epoken och medlemslistan med den tidigare. Skillnad, frånvaro eller serverfel leder till att lokal historia, utkast och olästräknare rensas, pågående privata lässvar ogiltigförklaras och kontot hämtas på nytt. En misslyckad inledande epokkontroll visar ett eget felmeddelande med återförsök, inte en felaktig instruktion att para konton.

## Verifiering

- Ny läsfunktion **installerad i ansluten Supabase** med `apply_migration`.
- Läsbaserat regressionstest `supabase/tests/sec02_inbox_pair_epoch_readonly.sql` exekverat mot installerad funktion. **PASS:** parad förälder och tonåring erhåller samma icke-tomma värde; oparat konto får `NULL`; `anon` har ingen körbehörighet och `authenticated` har körbehörighet.
- Testerna använder PostgreSQL-roll `authenticated` med **simulerade** `request.jwt.claims`, inte verkliga signerade JWT.
- Syntetiska Node-tester i `tests/inbox-pairing-guard.test.mjs` täcker oförändrat par, ändrat konto, saknat par och ändrad epok för samma två konton. Övriga isolerade inkorgstester och Chromium-mockar uppdaterade.
- Före migration: **2 privata meddelanden, 1 oläst, 2 familjemedlemmar, 100 IPIP-svar och 167 swajpsvar**. Den nya funktionen innehåller ingen DML eller någon operation som ändrar dessa poster.

**Kvarvarande verifiering:** Faktiska autentiserade tvåkontosessioner och riktig avparning/omparning i webbläsare saknas. Testet skapar inte om ett par i databasen, för att inte riskera tidigare godkännanden och svar. Fysisk mobil och samtidiga nätverksförlopp återstår. P0 INT-03 och SEC-02 ska därför inte markeras färdiga.
