# FUN-02-ACK-01 – återläs privat kortsvar efter förlorad skrivkvittens

**Datum:** 8 november 2026. **Merge:** [PR #231](https://github.com/erikjarl/hemmakompassen/pull/231), `e9413991ed913bafe86782c48c10a8c91554dab5`. **Grön Node/bygge/Chromium-CI:** [#42515868189](https://github.com/erikjarl/hemmakompassen/actions/runs/42515868189).

## Funktionellt fel och lösning

Om en vanlig A-korts-/temakortsskrivning till `swipe_answers` lyckades i databasen men webbläsaren tappade RPC-/HTTP-kvittot, visade UI tidigare meddelandet att svaret inte kunde sparas och lät kortet ligga kvar. Detta blandade ihop en misslyckad lagring med ett misslyckat nätverkskvitto.

Vid rapporterat skrivfel läser `reconcileOwnSwipeAnswer(row)` tillbaka endast `deck_id,card_id,answer` från `swipe_answers`, filtrerat till **eget user_id, exakt deck_id och exakt card_id**, med `maybeSingle()`. Svar med rätt booleanskt värde och samma lek/kort returnerar `confirmed`; saknat eller annat sparat svar returnerar `different`; läsfel, undantag och felaktig form returnerar `unknown`. Klienten kontrollerar användarsessionen på nytt efter väntan innan UI och privata cachevärden uppdateras.

**Användarbeteende:** `confirmed` leder vidare utan ytterligare skrivning. `different` låter kortet ligga kvar och anger att önskat svar inte kunde bekräftas. `unknown` låter kortet ligga kvar men förklarar att det inte går att veta om svaret sparades, med uppmaning att kontrollera efter omladdning. Ingen felaktig framgång eller säker misslyckandestatus hittas på. Förståelsekort/B-kort har separat `set_understanding_card_state`-RPC och återläses **inte** felaktigt via den vanliga A-svarstabellen; där används en försiktig osäker-status vid skrivfel.

## Testmetod och bevis

- `tests/swipe-answer-write-reconciliation.test.mjs`: VM kör produktionskodens kontrolläsning mot syntetisk fråga och testar rätt JA och NEJ, motstridigt/missande/ogiltigt svar, annat kort/annan lek, kastade undantag och läsfel. Kontrakt kontrollerar att de båda vanliga sparfunktionerna anropar återläsningen endast på skrivfel.
- `tests/live-swipe-session.test.mjs`: tidigare sessionstester använder nu samma produktionshjälpare, och ett nekat skrivförsök får inte markeras som lyckat; stale-session-kontroller kvarstår.
- `tests/visual.mjs`: syntetiskt Chromium, riktig DOM-klickning och simulerad Supabase med avsiktligt förlorad ACK efter lagring, avvisad skrivning före lagring och förlorad ACK följd av otillgänglig läsning. **2 roller × 2 lekar (allmänna A-/Förändring) × 3 felutfall = 12 genomförda kontrollresor.** Verifierar kortets position, antal skrivningar, återläsning och ett uttryckligt nytt användarklick efter okänt eller avvisat utfall.
- Full CI [#42515868189](https://github.com/erikjarl/hemmakompassen/actions/runs/42515868189): **342/342 Node-tester PASS**, bygge PASS, hela syntetiska Chromiumsviten PASS, inklusive **12/12 nya scenarier**, **77 skärmbilder** och `visual-audit.json`. Tidigare röd CI [#42515746980](https://github.com/erikjarl/hemmakompassen/actions/runs/42515746980) berodde på ett äldre fristående VM-test som saknade den nya hjälpfunktionen; testfixturen korrigerades utan att ändra den avsedda produktfunktionen.

## Kvar och verifieringsgräns

Denna verifiering genomfördes endast i Node och Chromium med **simulerad autentisering och databas**. Ingen riktig Supabase-skrivning, förlorat kvitto över verkligt nät, två autentiserade konton, fysisk iOS Safari, VoiceOver eller psykologisk effekt har verifierats. Inga befintliga kontons sparade svar ändrades. Även B-kortens särskilda skrivkvittens och andra modulers fullständiga liveflöden återstår.
