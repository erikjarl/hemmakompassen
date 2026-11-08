# FUN-04 – Radering av privat IPIP-50-omtest efter förlorad serverkvittens

**Datum:** 9 november 2026 (lokal tid; CI körd 8 november UTC). **PR:** [#238](https://github.com/erikjarl/hemmakompassen/pull/238), mergad som `7630045`.

**Verifierad PR-CI:** [GitHub Actions #42536923867](https://github.com/erikjarl/hemmakompassen/actions/runs/42536923867): **397/397 Node-tester**, statisk byggkontroll, **6/6 nya syntetiska Chromium-kontroller** och den fullständiga webbläsarsviten med **77 skärmbilder**.

## Funktionsfel och ändring

En användare kan radera en privat personlighetstestomgång och få ett misslyckat svar från nätverket trots att DELETE redan genomförts i databasen. Tidigare behöll sidan då omtestet och meddelade att raderingen inte kunde bekräftas, med risk att användaren försöker radera igen.

Vid missad, felaktig eller kastad DELETE-kvittens läser klienten nu tillbaka den aktuella användarens **exakt valda omtest-ID** från `personality_test_attempts` med `select('id').eq('user_id',...).eq('id',...).maybeSingle()`.

- **Bekräftat borttaget:** Om servern ger en giltig frånvaromarkering tas omtestet bort från lokal historik och aktuella utkast. Inget andra DELETE görs. Ett kommunikationsfel beskrivs korrekt som att raderingen **är bekräftad av servern**.
- **Bekräftat kvarvarande:** Om servern fortfarande visar just detta ID behålls historiken, ett begripligt meddelande visas och användaren kan aktivt välja ett nytt raderingsförsök.
- **Okänt utfall:** Om serverläsningen misslyckas eller ger ett inkonsekvent svar visas **Kontrollera omtestets status**, och en ny destruktiv handling blockeras tills användaren har läst om den egna serverhistoriken.
- Den uttryckliga bekräftelsedialogen före radering är oförändrad. Andra omtest och ursprunglig IPIP-50-profil lämnas orörda i det verifierade UI-flödet.
- Filversionen `20261109-retest-delete-ack1` används i HTML och importkedjan för att hämta den uppdaterade koden efter publicering.

## Testmetod och utfall

**Fem nya Node-regressionstester** simulerar tappad kvittens efter faktiskt genomförd radering, transportexception, tom kvittens, nekad radering, misslyckad serverläsning, korrekt manuell uppföljning, historik med två avslutade omtest och kontobyte. De försäkrar att ingen automatisk extra DELETE görs och att endast rätt omtest och dess svar tas bort i testdatabasen.

**Sex nya Chromium-fall** testar förälder (390 px) och tonåring (320 px) × tre scenarier (raderat men ACK saknas, radering nekad, kontrolläsning otillgänglig). Här sker verkliga klick på historikens Radera-knappar och godkännande av webbläsarens bekräftelsedialog. Kontroll görs av korrekt visad status, antalet skriv- och läsanrop, kvarstående historik och att ursprungsprofilen är kvar. Rådata sparas i GitHub Actions-artifact `fun-04-retest-deletion-ack-browser-synthetic.json`.

**Databasens schema kontrollerades endast läsande:** `personality_attempt_answers` har en främmande nyckel via `(user_id, attempt_id)` till `personality_test_attempts(user_id,id)` med `ON DELETE CASCADE`. Det förklarar hur tillhörande svar tas bort vid verklig radering, men vi genomförde **ingen** verklig radering.

## Begränsningar och nästa funktionstest

Chromium körde med syntetisk Auth och in-memory-Supabase, inte med riktiga testkonton eller verklig trasig nätverkskvittens. Vi har inte heller testat fysisk iOS/Safari. **Inga befintliga användarsvar har ändrats eller raderats** i detta arbete. Därför förblir FUN-04 **Pågår**.

Nästa praktiska verifiering bör ske med uttryckligt disponibla testomgångar i två verkligt inloggade testkonton: bekräfta att radering av en vald omgång syns efter omladdning/ny inloggning, att dess svar försvinner och att ursprungsprofil samt andra omtest lämnas kvar. Gör nätverksfelinjektion bara i en isolerad tillåten testmiljö.
