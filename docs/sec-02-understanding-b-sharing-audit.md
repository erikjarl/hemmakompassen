# SEC-02 / INT-01 – verifiering av B-förståelsekort med frivillig tonårsdelning

**Datum:** 7 november 2026. **Källa:** aktuell installerad Supabase-databas, faktiska RPC-kroppar `public.set_understanding_card_share` och `public.shared_understanding_cards`.

## Metod

`supabase/tests/sec02_understanding_b_share_rollback.sql` kör hela testet i en PostgreSQL-transaktion med `SAVEPOINT` och `ROLLBACK`. Det använder två befintliga parade testkonton och ett befintligt utanförstående konto. Användarnas ID:n läses lokalt i databasen och sparas inte i GitHub.

Testkort är `general-03` som tonåringen redan besvarat JA på och `general-02` som tonåringen redan besvarat NEJ på. **Testet ändrar inga befintliga swajpsvar**. En temporär B-delning skapas och återkallas genom riktiga databasanrop; allt återställs i transaktionen. `SET LOCAL ROLE authenticated` och `request.jwt.claims` **simulerar identitet**; ingen verklig signerad Supabase Auth-session användes.

## Kontrollerade fall

| Kontroll | Förväntat och observerat utfall |
| --- | --- |
| Inget B-samtycke | Varken förälder eller tonåring ser B-kortet i den delade RPC:n |
| Förälder försöker dela tonåringens B-kort | Anropet nekas |
| Tonåringen försöker dela ett befintligt NEJ-svar | Anropet nekas |
| Tonåringen delar sitt befintliga JA-svar | Både förälder och tonåring ser exakt detta kort |
| Utomstående konto läser den delade B-vyn | Inga synliga B-kort |
| Förälder försöker återkalla tonåringens delning | Försöket ändrar inte tonåringens aktiva delning |
| Tonåringen återkallar sitt B-samtycke | Kortet försvinner från bådas delade vy |

Databasresultat:

```text
PASS: B sharing requires teen true answer and explicit opt-in; paired see, outsider denied, parent cannot revoke, teen revocation hides; rollback
```

Både testets egna radräkningar och den avslutande `ROLLBACK` säkerställer att testet inte lämnar några nya B-delningar eller ändrade svar.

## Begränsningar

Resultatet bekräftar inte att den verkliga webbläsaren, Supabase Auth, signerad JWT eller AI-medlaren hanterar delning och återkallelse korrekt. Inte heller testades omparning, en *annan aktiv tvåpersonersfamilj*, samtidiga ändringar, att ett redan delat B-svar ändras till NEJ eller att tonåringen väljer `vill inte svara just nu`. De kräver separata regressionstester eller riktiga autentiserade flöden. Detta är ett avgränsat, **positivt och negativt backendtest** och inte färdig verifiering av hela INT-01.
