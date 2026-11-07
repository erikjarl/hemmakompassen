# SEC-02 / INT-03 – Inkorg: meddelanden i båda riktningarna och läskvittenser

**Datum:** 2026-11-07. **Miljö:** installerad Supabase för Hemmakompassens interna tester.

## Metod

Det reproducerbara testet `supabase/tests/sec02_inbox_message_roundtrip_rollback.sql` anropar de verkliga installerade RPC:erna `send_family_message`, `my_family_messages`, `mark_family_messages_read` och `my_family_unread_message_count` med tre befintliga konton: parad förälder, parad tonåring och utomstående. UUID:n hämtas endast lokalt i databasen.

Hela körningen sker inom `BEGIN` / `ROLLBACK`, med PostgreSQL `SET LOCAL ROLE authenticated` och simulerade `request.jwt.claims`. Det är **inte verklig signerad Supabase Auth eller två faktiska webbläsarsessioner**.

Vid förkontrollen fanns **2 tidigare meddelanden**, varav **1 oläst hos tonåringen** och **0 olästa hos föräldern**. Därför testar skriptet läskvittens enbart på föräldrakontot, så att tidigare olästa meddelanden inte ens temporärt markeras som lästa.

## Kontroller med faktiskt utfall

| Test | Resultat |
| --- | --- |
| Utomstående försöker skicka meddelande | Nekas |
| Utomstående försöker läsa privata meddelanden eller olästräknare | Tom inkorg, 0 olästa |
| Blanksteg som meddelandetext | Nekas |
| 1 501 tecken som meddelandetext | Nekas |
| Tonåring skickar till förälder | Förälder ser inkommande, oläst meddelande |
| Samma avsändare skickar identisk request key och text igen | Samma meddelande-ID; ingen dubblett |
| Samma request key används med annan text | Nekas |
| Föräldern markerar sina inkommande som lästa | Exakt 1 nytt meddelande kvitteras, olästräknaren blir 0 |
| Tonåringen granskar sitt skickade meddelande | Syns som skickat, med mottagarens läskvitto |
| Förälder skickar svar till tonåring | Tonåringen ser inkommande och oläst meddelande; olästräknaren ökar |

**Körresultat mot faktiskt installerad Supabase:**

```text
PASS: outsider blocked, malformed messages rejected, bidirectional send/receive, retry-key idempotency, parent-only read receipt, teen historical unread untouched; full rollback
```

En **separat efterkontroll** visade oförändrade **2 meddelanden, 1 oläst (hos tonåringen), 0 olästa hos föräldern**. De temporära meddelandena och förälderns nya läskvitto rullades tillbaka.

## Återstående verifiering

Testet verifierar inte riktiga signerade JWT, HTTP/Supabase Auth, två verkliga inloggade webbläsarsessioner, paging efter minst 50 meddelanden, samtidig skickning/kvittens, familjeavparning eller annan aktiv familjs isolering. Inte heller verifierar det användargränssnittets notifierings-/läsuppdatering i realtid eller datalagring/retention. Dessa är egna acceptanskriterier under INT-03 och DATA-01.

Testet motiverar därför **inte** att INT-03 markeras som helt färdig.
