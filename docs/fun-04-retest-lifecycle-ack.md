# FUN-04 – Serverkontroll av privat omtests start och avslut

**Datum:** 9 november 2026 (lokal tid; CI körd 8 november UTC). **PR:** [#237](https://github.com/erikjarl/hemmakompassen/pull/237), mergad som `a6acb24`.

**Verifierad PR-CI:** [GitHub Actions #42534842548](https://github.com/erikjarl/hemmakompassen/actions/runs/42534842548): **392/392 Node-tester**, statisk byggkontroll, **6/6 nya syntetiska Chromium-kontroller** samt hela webbläsarsviten med 77 skärmbilder.

## Funktionsproblem

Ett nätverksavbrott efter att databasen skapat ett nytt privat omtest, eller markerat ett omtest avslutat, kan göra att klienten aldrig får ett giltigt svar. Tidigare gav det en generell feltext medan sidan behöll en lokal status som kunde vara fel. Användaren riskerade att tro att start/avslut misslyckats, och behövde prova igen trots att åtgärden redan hade genomförts.

## Ändring

**Start av privat omtest:** Ett felaktigt eller uteblivet INSERT-svar följs av en ny läsning av just det inloggade kontots omtestlista. Om servern visar en påbörjad omgång erbjuds *Fortsätt privat omtest*, utan nytt INSERT-anrop. Detta används också när en annan flik redan har skapat en omgång (`23505`). Om servern bekräftar att ingen omgång finns kan användaren försöka igen. Vid misslyckad läsning visas endast möjligheten att läsa om historiken – ingen gissning om att omgången skapats.

**Avslut av privat omtest:** Ett felaktigt eller uteblivet UPDATE-svar följs av en egen ägar- och ID-specifik läsning av `personality_test_attempts.id` och `completed_at`. Bekräftad avslutstid flyttar omgången till historiken utan ytterligare UPDATE. Vid misslyckad eller oklar läsning visas i stället **Kontrollera omtestets status**. Återupprepning av avslutsförsöket hålls spärrad tills serverhistoriken lästs om.

**Filversion:** HTML och JavaScript-importkedjan använder samma cacheversion `20261109-retest-lifecycle1` för att nya modulen ska laddas efter publicering. Inga databasmigrationer.

## Testmetod

- **Sju nya Node-regressionsfall** med in-memory-lagring simulerar skapande och avslut där ACK förloras efter commit, en exception kastas, kvittot saknas, lagringen verkligen avvisas och serverhistoriken inte går att läsa; även efterföljande manuella försök och kontobyte kontrolleras.
- **Sex nya Chromium-kontroller** av verkliga knappar och 50 radioklick i syntetisk testmiljö: två roller (förälder 390 px och tonåring 320 px) × tre kontroller var: förlorad startkvittens, återhämtning efter avvisad start, och förlorad avslutskvittens efter fullständiga 50 svar.
- Råresultat: Actions-artifact `fun-04-retest-lifecycle-ack-browser-synthetic.json`. Hela befintliga Node- och Chromium-sviten passerade.
- Läsbaserad kontroll av Supabases faktiska tabellstruktur bekräftade `id`, `user_id`, `instrument_id`, `created_at` och `completed_at`, med förväntade datatyper. Det är inte ett funktionstest av att en riktig testinloggning kan spara/läsa.

## Begränsningar och nästa test

Chromium kör med **syntetisk Auth och mockad Supabase**. Vi har inte genomfört förlorad HTTP-kvittens i verkliga Supabase, sparning med riktiga två testkonton eller fysisk Safari-/iOS-verifiering. Inga tidigare användarsvar har skrivits över under denna uppgift. FUN-04 ska därför förbli **Pågår**, inte 'färdig och verifierad'.

Nästa funktionella kontroll: två signerade testkonton med disponibla testuppgifter; starta och avsluta privata omtest, kontrollera att ursprungsprofil och andra omtest är opåverkade, och verifiera historiken efter ny inloggning. Testa verklig nätverksförlust endast i en tillåten isolerad miljö.
