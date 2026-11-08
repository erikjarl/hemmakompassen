# FUN-02-BSTATE-ACK-01 – förlorad skrivkvittens vid B-svar och överhoppning

**Datum:** 8 november 2026. **PR:** [#232](https://github.com/erikjarl/hemmakompassen/pull/232), squash-merge `164ac2237aef651446de57acb364fc54809b6598`. **Grön CI:** [#42517333461](https://github.com/erikjarl/hemmakompassen/actions/runs/42517333461).

## Felväg

Tonåringens förståelsekort lagras via `set_understanding_card_state`. RPC:n lagrar ett privat Ja/Nej-svar i `swipe_answers` och tar bort överhoppning i `swipe_skips`, **eller** tar bort svaret och lagrar privat överhoppning. Operationen är atomär enligt befintlig migration `20261025150000_understanding_card_state.sql`.

Vid en lyckad skrivning med förlorad nätverkskvittens kunde klienten tidigare inte avgöra om valet faktiskt sparats. För B-kort blev detta en osäker felstatus utan kontrolläsning. Vid överhoppning visades dessutom ett meddelande som direkt antog att sparningen misslyckats.

## Ändring

- Vid RPC-fel används den nya produktionshjälparen `reconcileOwnUnderstandingCardState(cardId, viewer, expected)`. Den läser parallellt `swipe_answers` (`deck_id`, `card_id`, `answer`) och `swipe_skips` (`deck_id`, `card_id`) filtrerat på **inloggad egen `user_id`**, `deck_id='general'` och exakt B-kort-ID. Ingen skrivning eller delning utförs av kontrolläsningen.
- Ja/Nej bekräftas endast vid ett korrekt booleskt lagrat svar med rätt värde **och saknad skip-post**. Överhoppning bekräftas endast vid korrekt skip-post **och saknat Ja/Nej-svar**.
- Avvikande eller saknat giltigt tillstånd (`different`) behåller kortet och ger möjlighet till nytt manuellt försök. Ogiltiga poster, både svar och skip samtidigt, läsfel eller undantag (`unknown`) behåller kortet och redovisar uttryckligen att det inte går att veta om valet sparats. Ingen dubbelskrivning sker när kontrolläsningen redan bekräftar det avsedda utfallet.
- Kontosessionen kontrolleras före och efter de asynkrona återläsningarna. Delningsfunktionen `set_understanding_card_share` och befintliga frivilliga delningsval ändras inte. Ingen databas- eller migrationändring gjordes.

## Tester och utfall

- **Node VM:** `tests/understanding-state-write-reconciliation.test.mjs` kör produktionshjälparen med aktuella Ja/Nej/skip-värden, gamla eller motstridiga värden, saknade och missformade rader, svar+skip samtidigt, läsfel och exception. Frågorna verifieras som filtrerade till eget konto och exakt kort. `tests/live-swipe-session.test.mjs` täcker fortsatta sessionspärrar samt båda återläsningarna vid ett nekad överhoppningsskrivning.
- **Chromium:** `tests/visual.mjs` genomför faktiska knapptryck i en syntetiskt autentiserad tonårsvy vid **320 och 390 px**, med **Nej respektive Vill inte svara just nu** och tre avsiktliga felutfall per handling: kvittensförlust efter lagring, nekad skrivning och kvittensförlust med misslyckad kontrolläsning. **2 vybredder × 2 val × 3 utfall = 12 fall**. Kontroll av kortposition, feltext, två tabellåterläsningar och exakt antal RPC-skrivningar före/efter frivilligt nytt klick.
- **Slutligt CI-resultat:** [#42517333461](https://github.com/erikjarl/hemmakompassen/actions/runs/42517333461) passerade **362/362 Node-tester**, bygge och full syntetisk Chromiumsvit. Resultat: **12/12 B-flöden PASS**, tidigare 12 A-/temakortsflöden passerade också och **77 skärmbilder** skrevs. Tidiga röda PR-körningar hade dels ett äldre kodkontrakt, dels en testregex som förväntade fel grammatisk formulering; båda korrigerades och hela slutkörningen blev grön.

## Begränsningar och kvarvarande P0

Verifieringen använder enbart mockad Supabase Auth/RPC och temporär in-memory-lagring. Den innebär **inte** att riktiga inloggade föräldra- och tonårskonton, fungerande tvåkontosynk, fysisk Safari/iOS eller verklig nätverksförlust över Supabase är verifierade. Inga befintliga användarsvar har ändrats. Fristående säkerhetsarbete är pausat enligt aktiv roadmap; detta pass gäller observerbart användarbeteende.
