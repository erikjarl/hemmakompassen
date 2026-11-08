# SEC-02 / INT-01 / SW-03 – läsbaserad isolering av samtliga kortlekar

**Datum:** 8 november 2026. **Miljö:** ansluten Supabase-testdatabas.

## Testmetod

SQL-filen [sec02_all_decks_role_isolation_readonly.sql](../supabase/tests/sec02_all_decks_role_isolation_readonly.sql) anropar faktisk installerad kod i `shared_swipe_matches`, `shared_swipe_priorities` och `shared_understanding_cards` under en enda databastransaktion. Den väljer den befintliga tvåpersonsfamiljens förälder och tonåring samt ett existerande konto **utanför** familjen. Ingen kontoinformation skrivs till projektet.

`SET LOCAL ROLE authenticated` och `request.jwt.claims` **simulerar** identiteterna; detta är uttryckligen **inte signerad Supabase Auth**. För varje av sju kortlekar jämför SQL de kort-ID:n som parent och teen får via matchnings-RPC:n och den delade prioritets-RPC:n. Det utomstående kontot måste få **noll rader i samtliga**. En separat kontroll jämför B-kortens uttryckligen delade ID:n mellan de två rollerna och kräver noll för utomstående konto. Testet kräver dessutom att minst en verklig gemensam matchning finns: att båda parter bara får tomma svar räknas inte som positivt test av matchnings-RPC:n.

SQL använder enbart läsande frågor och `set_config` för transaktionens claims, samt `BEGIN … ROLLBACK`. **Inga befintliga svar eller samtycken ändras**.

## Verifierat resultat

Den exakta incheckade SQL-filen kördes på ansluten Supabase och returnerade:

```text
PASS: 7-deck match/priority RPC isolation and B-share RPC role parity; read-only full rollback
```

Det fanns **23** faktiska gemensamma Ja-matchningar på de sju lekarna vid denna kontroll: `general` 12, `samtal` 4, `aktiviteter` 5, `regler` 2 och 0 i övriga tre. Samma uppsättning visades för båda simulerade parade roller; utomstående konto fick noll. Projektets Supabase-databas innehöll vid testtillfället **167** individuella swajpsvar, **0** aktiva förståelsekortsdelningar och **0** delade prioriteringar.

Viktigt: detta testar en **positiv matchningsläsning** men endast **tomma delningsresultat** för B-kort och viktighetsskattningar. Det verifierar inte positiva delningar eller återkallelse av aktiva delningar, och ingen familjeomparning genomfördes. Dessa luckor måste fortfarande hanteras i INT-01 och SW-03.

## Fortfarande ej verifierat

- Riktiga signerade förälder-/tonåring-sessioner och webbläsarflöden.
- Faktiska delningar av B-kort och trelägesskattningar med separata samtycken, återkallelse och omparning.
- Isolering mellan **två samtidigt aktiva familjer**; det utomstående kontot i testet var oparat.
- Fysisk mobil och användbarhet.

Detta är en ny, reproducerbar **P0-regression** för faktiskt installerade läs-RPC:er, inte en komplett P0-verifiering.
