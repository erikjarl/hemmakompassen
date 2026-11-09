# FUN-03 – synligt kvitto efter skickat privat meddelande

**Datum:** 9 november 2026 · **Delområde:** Inkorg, bekräftat meddelandeutskick.

## Observerad orsak

Efter ett lyckat svar från `send_family_message` satte klienten `familyChatStatus='Meddelandet har skickats.'` och anropade direkt `fetchFamilyChat()`. Den efterföljande funktionen rensade `familyChatStatus` redan **innan** serverläsningen började. Därför kunde gränssnittet aldrig visa den bekräftade sändningsstatusen efter automatiskt omhämtning. Även om `my_family_messages` misslyckades försvann kvittot för den **redan serverbekräftade** sändningen. Vid en redan pågående konversationsläsning hoppade den automatiska hämtningen dessutom över en ny render, och sändknappen kunde visuellt ligga kvar i `Skickar…` trots att `familyChatSending` internt var falskt.

Detta gäller visuell/statusmässig återkoppling, **inte** ett bevis för dubblettsändning eller förlorade meddelanden.

## Begränsad ändring

- `fetchFamilyChat(older=false,{quiet=false,preserveStatus=false}={})` har ett explicit `preserveStatus`-val. Vanliga användarstyrda omhämtningar rensar gamla kvitton som tidigare, och tysta bakgrundsuppdateringar förblir oförändrade.
- Efter en lyckad, giltig sändningskvittens ritas inkorgen om en gång så att texten **Meddelandet har skickats.** syns och formuläret åter aktiveras. Därefter hämtas meddelandelistan med `preserveStatus:true`. Om läsningen misslyckas visas oberoende läsfel, utan att det korrekta sändningskvittot raderas.
- Ingen ändring i idempotensnycklar, medlemskontroll, lagring, databas eller andra användares svar.

## Testmetod

`tests/family-chat-send-confirmation.test.mjs` kör både den verkliga sändnings- och hämtningsfunktionen i samma Node-VM med simulerad Supabase-RPC, rendering och konversationsstatus. Fyra fall: lyckad sändning + omladdning, lyckad sändning + läsfel, avsiktlig manuell uppdatering som rensar kvittot, och samtidig pågående inboxhämtning som inte får lämna sändformuläret låst.

**Reproduktion före fix:** [röd CI #42556933824](https://github.com/erikjarl/hemmakompassen/actions/runs/42556933824): **454 PASS, 3 FAIL av 457 tester** (samtliga tre nya fellägen reproducerade). Den redan gröna fjärde kontrollen verifierade att manuell uppdatering fortsatt får rensa ett gammalt kvitto.

`tests/visual.mjs` har två ytterligare kontroller i en simulerad mobil-Chromium-inkorg: synligt sändningskvitto efter meddelandelistans omhämtning och borttagning av kvittot vid uttryckligt manuellt uppdateringsklick.

**Slutligt utfall 9/11:** [PR #250](https://github.com/erikjarl/hemmakompassen/pull/250) **mergad** som [`8f7493ba`](https://github.com/erikjarl/hemmakompassen/commit/8f7493ba54bd29138d1e023057ca1a05541e6c35). [Grön PR-CI #42557255599](https://github.com/erikjarl/hemmakompassen/actions/runs/42557255599): **457/457 Node-tester** och **77 skärmbilder** i godkänd mockad Chromium-svit. [Main UI #42557712793](https://github.com/erikjarl/hemmakompassen/actions/runs/42557712793), [Pages #42557712101](https://github.com/erikjarl/hemmakompassen/actions/runs/42557712101) och [serverade tillgångar #42557712739](https://github.com/erikjarl/hemmakompassen/actions/runs/42557712739) **PASS** efter merge. Tre äldre testharness anpassades till det nya explicita renderingssteget; produktionens parnings-/meddelanderPC ändrades inte.

**Avgränsning:** Synthetic Node-VM och mockad Chromium är inte ett signerad tvåkontotest mot produktions-Supabase, och inte fysisk Safari/VoiceOver. Inga riktiga privata meddelanden har skickats eller ändrats. Grön CI och bekräftad Pages-publicering ska dokumenteras separat när de faktiskt finns.
