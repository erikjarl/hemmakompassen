# SEC-02 / INT-02 – verkligt ändrings-RPC för Schyssta listan

**Datum:** 7 november 2026. **Miljö:** ansluten Supabase-testdatabas. **Mål:** Kontrollera hela övergången mellan gammal godkänd regel och ersättningsförslag, inte bara en administrativ versionstalsändring.

## Metod

Kör `supabase/tests/sec02_schyssta_replacement_rpc_rollback.sql` mot intern testdatabas med behörighet att läsa testkonton. Skriptet kör `BEGIN` … `ROLLBACK`, hämtar den redan parade förälderns och tonåringens UUID lokalt samt ett existerande oparat konto, skapar två **nya temporära regler** och testar sedan **verkliga installerade** `propose_manual_schyssta_rule`, `set_schyssta_rule_decision`, `propose_schyssta_change`, `my_manual_schyssta_rules`, `my_schyssta_replacement_links` och `my_schyssta_rule_history`. Den installerade triggern `private.schyssta_retire_replaced_rule` får hantera arkivering.

Användarkontexterna körs med PostgreSQL `SET LOCAL ROLE authenticated` och `request.jwt.claims` – **inte verkliga signerade JWT eller inloggade webbläsare**. Inga gamla regler eller röster uppdateras; alla nya uppgifter återställs i transaktionen. Testet läser de konton som redan finns och lagrar inte deras ID:n i GitHub.

## Kontroller och resultat

| Kontroll | Observerat utfall |
| --- | --- |
| Ursprunglig regel skapas och godkänns med JA+JA | `accepted` |
| Utomstående försöker föreslå ändring | Nekad |
| Förslag med oförändrad text | Nekat |
| Samma ändring skickas med samma request key | Samma ID (idempotens) |
| Återanvänd nyckel med ändrad text | Nekad |
| Två samtidiga öppna förslag om samma original | Andra nekas |
| Ett ersättningsförslag väntar | Originalet fortfarande `accepted` |
| Familjemedlemmar hämtar ersättningslänk | Båda ser länken |
| Utomstående läser länk eller röstar | Ingen länk, röst nekad |
| Enbart tonåringens JA till ny lydelse | Nytt förslag fortfarande `proposed`; originalet `accepted` |
| Förälderns andra JA till ny lydelse | Nytt förslag `accepted`; originalet tas bort från aktiva listan och syns i historiken |
| Ett annat ersättningsförslag får NEJ | Ändringsförslag `rejected`, originalet fortsätter `accepted` |

**Utfall i ansluten Supabase:** `PASS: real replacement RPC, idempotency, one-vote pending, two-vote replacement retirement, outsider denied edit/vote, unchanged wording denied, rejection preserves old; ROLLBACK`.

Separat efterkontroll: **5 befintliga regler, 5 röster, 7 notiser, 167 swajpsvar och 100 IPIP-svar**, samma antal som innan testet.

## Begränsningar

Detta bevisar backendlogiken för aktuell tvåpersonersfamilj under simulerad JWT-identitet. Det bekräftar **inte** signerad Supabase Auth, faktiska två inloggade sessioner, webbläsargränssnittets synk, race conditions vid två samtidiga transaktioner, omparning/medlemskapsepok eller en andra aktiv familj. En SQL-transaktion kan inte reproducera den verkliga samtidighet som krävs för race-test. Även notifieringarnas läskvittenser kräver särskilt test.

INT-02 och SEC-02 kvarstår därför som **inte fullt verifierade**; inget skäl att ändra säkerhetspolicies eller exponera funktioner.
