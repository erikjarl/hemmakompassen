# FUN-02-ACK-01 – B-kort: korrekt delningsstatus trots förlorad kvittens

**Datum:** 8 november 2026  
**PR:** [#227](https://github.com/erikjarl/hemmakompassen/pull/227), squash-merge `8cc89d834ec90f3832d96070e0c86d64ed076b25`.

## Reproducerbar funktionsbrist

Klienten förklarade tidigare ett delat/återkallat förståelsekort med endast RPC-skrivkvittensen som grund. Om databasen hade sparat ändringen men nätverkssvaret inte nådde webbläsaren kunde det stå att ingenting hade ändrats, trots att det i själva verket hade delats eller återkallats. Att visa ett tydligt felmeddelande **utan** korrekt delningsstatus löser inte själva användarproblemet.

## Genomförd ändring

1. `setUnderstandingShare()` läser efter varje skrivförsök tillbaka tonåringens egen `understanding_card_shares` via användarfiltrerad läsning och avgör utifrån den aktuella serverstatusen, inte kvittensen.
2. Förlorad kvittens med lyckad serverändring ger det faktiskt sparade valet. Avvisad skrivning ger ett begripligt meddelande och serverns tidigare sparade val.
3. Om statusläsningen också misslyckas står valet som **okänt**, knappens `aria-pressed` tas bort och nya ändringar spärras. Gamla B-resultat döljs, pågående insiktsläsning ogiltigförklaras och användaren erbjuds **Kontrollera delningen igen**. Den kontrollen läser på nytt utan att skriva något till servern.
4. Vid kontobyte får en sen kvittens inte ändra det nya kontots vy. Tidigare autentisering, datalagring och delningsregler behålls.

## Testbevis

- [PR-CI #42509933524](https://github.com/erikjarl/hemmakompassen/actions/runs/42509933524): **success** för Node-kontrakt, statiskt bygge och syntetisk Chromium/browser.
- `tests/understanding-consent-reconciliation.test.mjs`: fem nya körbara Node-VM-scenarier mot faktisk kod: bekräftad dela/återkalla, två tappade skrivkvittenser, serveravslag, misslyckad serverläsning + skrivfri retry samt kontobyte.
- `tests/visual.mjs`: genomspelar tonåringens inloggade **simulerade** insiktsvy i Chromium, ändrar förståelsekort, tappar kvittenser, simulerar läsfel, kontrollerar synlig/funktionshindrad status och gör skrivfri retry.
- Syntetisk UI-testning använder **mockade** Auth/RPC; inga befintliga användarsvar ändrades.

## Kvar att verifiera

Testa **två faktiskt autentiserade konton** på den publicerade sidan, med två verkliga klienter och serverns riktiga sparade värden: dela, se hos föräldern, återkalla, kontrollera att förälderns gamla vy försvinner vid aktiv uppdatering, och kontrollera återanslutning på mobil. Simulerad Chromium och en grön Github Pages-publicering utgör inte bevis på detta. Inte heller har faktisk nätverkskvittens tappats mot riktig Supabase.

## Kompletterande verkligt schemakontrakt (read-only, 8 november 2026)

Med anslutet Supabase-projekt `Hemmakompassen` (status `ACTIVE_HEALTHY`) lästes **enbart metadata** från `pg_proc` och `information_schema.columns`. Utan att läsa eller ändra några användarrader bekräftades att publika databasfunktioner finns med rätt namn och parametrar:

- `set_understanding_card_share(p_card_id text, p_share boolean)` → `void`.
- `shared_understanding_cards()` → `TABLE(deck_id text, card_id text)`.
- `shared_swipe_matches(p_deck_id text)` → `TABLE(deck_id text, card_id text, answer boolean)`.

Tabellen `public.understanding_card_shares` innehåller bland annat de tre kolumner som klienten behöver för eget, kontofiltrerat återläsningsanrop: `user_id uuid`, `deck_id text`, `card_id text`. Tabellen har dessutom `family_id uuid` och `shared_at timestamptz`.

**Avgränsning:** detta är schema- och signaturkompatibilitet i ett verkligt projekt, inte ett uppspelat inloggat RPC-/delningsflöde. Därför ändras inte status för två autentiserade användare till verifierad.
