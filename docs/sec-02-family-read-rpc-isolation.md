# SEC-02: sju familje-RPC:er testade med fyra existerande konton

**Datum:** 7 november 2026. **Miljö:** Ansluten Supabase-databas för Hemmakompassen.

## Testförfarande

Kör `supabase/tests/sec02_family_read_rpc_isolation.sql` med en behörig SQL-koppling. SQL är **enbart läsande** beträffande applikationens tabeller och körs i `BEGIN`/`ROLLBACK`.

Följande användarkontexter testades:

1. Den befintliga parade familjens förälder.
2. Samma familjs tonåring.
3. En befintlig användare utan familjemedlemskap.
4. Ytterligare en befintlig användare utan familjemedlemskap.
5. Autentiserad databasroll men utan `sub` (användar-ID) i de simulerade JWT-uppgifterna.

Varje sammanhang prövades mot:

- `my_family_members`
- `my_schyssta_rules`
- `my_schyssta_rule_history`
- `my_schyssta_replacement_links`
- `my_schyssta_notifications`
- `shared_understanding_cards`
- `my_family_unread_message_count`

**Totalt 35 funktionsanrop (5 kontexter × 7 RPC:er)**. För varje konto utanför familjen och sammanhanget utan `sub` krävdes **noll familjerader eller olästa meddelanden**. För både föräldern och tonåringen krävdes att `my_family_members` gav exakt två familjemedlemmar.

## Faktiska observationer

Databasen rapporterade:

```text
PASS: 2 paired, 2 outside, missing-subject; 7 read RPCs; no writes
```

Testet kördes efter att aktuella funktionsdefinitioner kontrollerats i `pg_proc` med `pg_get_functiondef`. De granskade kropparna för `my_schyssta_notifications`, `my_schyssta_rule_history` och `my_schyssta_replacement_links` begränsar resultat med aktuell exakt parning och familjens medlemskapstid. `my_family_members` söker med anroparens aktuella familjemedlemskap. `shared_understanding_cards` kräver ett par med en förälder och en tonåring och ett explicit delat förståelsekort med sant svar som inte har hoppats över. Det är **kodgranskning av villkor**, inte fullständig bevisning av alla race- och revokeringsfall.

## Begränsningar

- `SET LOCAL ROLE authenticated` och `set_config('request.jwt.claims',...)` **simulerar** identitet i PostgreSQL. Ingen signerad JWT validerades, och inga två Supabase Auth-webbläsarsessioner användes.
- Databasen innehöll en befintlig tvåpersonersfamilj och två familjeutanförstående användare vid körningen. Det finns ingen andra aktiv tvåpersonersfamilj att genomföra ett verkligt **par mot par**-test mot.
- Flera Schyssta-historik- och notifieringsresultat kan legitimt vara tomma; deras negativa utfall verifierar inte ett positivt flöde.
- Ingen återkallelse, omparning, avslag, race condition eller faktisk HTTP Worker-/Pages-behörighet testades.
- Testet gör inga ändringar av tidigare användarsvar, konton eller delningsinställningar.

**Nästa steg:** Auth-test med separata riktiga kontosessioner samt konkret test av återkallelse, gammal familjeepok och positiv notiskvittens. Varken SEC-02 eller INT-01–04 är därmed fullt verifierade.
