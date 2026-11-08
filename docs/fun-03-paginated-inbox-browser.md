# FUN-03 – äldre meddelanden, sidindelning och läskvitton

**Datum:** 8 november 2026. **Miljö:** verkliga UI-handlingar i Chromium med två separata syntetiska föräldra-/tonårskontexter och en gemensam in-memory-RPC-fixture. Ingen anslutning till verklig Supabase eller användarmeddelanden.

## Testmetod

Testfunktionen `verifyLinkedInboxOlderPages()` i `tests/visual.mjs` konstruerar en familjehistorik med **57 meddelanden från föräldern till tonåringen**. Två meddelanden på gränsen mellan första och andra sidan har samma `created_at`, men skilda UUID, för att testa markörbaserad sortering och paginering på både tid och ID.

1. Öppna den riktiga Inkorg-vyn på **320 px** för tonåringen och **390 px** för föräldern. Förväntat: de senaste 50 meddelandena syns, en användbar **Visa äldre meddelanden**-knapp finns, och äldre poster är ännu inte insatta i DOM. Vyn ska inte automatiskt skapa något läskvitto.
2. Låt den första serverliknande begäran om äldre meddelanden misslyckas. Förväntat: synlig feltext i inkorgen, de 50 redan hämtade meddelandena kvar, och knappen för nytt försök finns fortfarande.
3. Klicka **Visa äldre meddelanden** igen. Förväntat: exakt **57 distinkta meddelanden** i kronologisk visningsordning och inte längre någon knapp när den äldre sidan innehåller färre än 50 poster. Begäran ska återanvända samma markör (senast hämtade gränsmeddelandets tidsstämpel och UUID) trots tidigare fel. Samtliga 57 meddelanden ska fortfarande vara olästa fram till explicit läsmarkering.
4. Klicka **Markera alla meddelanden som lästa** i tonåringens inkorg. Förväntat: samtliga 57 poster får lästid i den simulerade gemensamma familjedatan. När föräldern väljer **Uppdatera konversationen**, visas `Läst` för de 50 senaste skickade posterna.

Testet gör även horisontell överströmningskontroll för båda viewportstorlekarna.

## Spårbarhet

Testkod: `tests/visual.mjs`, `verifyLinkedInboxOlderPages()`, anropad i den vanliga Playwright-regressionssviten. Skriver JSON-underlag `artifacts/fun-03-paginated-inbox-synthetic.json` i testkörningens Actions-artifact. Slutligt testutfall ska bedömas från GitHub Actions på den aktuella PR-committen – själva testmetoden innebär inte att CI automatiskt har passerat.

## Begränsningar

Testet kontrollerar klientflödet och ett deterministiskt **simulerat** backendkontrakt. Det bevisar inte verkliga behörighetsregler, nätverksförhållanden, synkning över verkliga Supabase-konton, mobil Safari eller hur många meddelanden som finns på produktionsservern. Ingen verklig familjedata ändras.
