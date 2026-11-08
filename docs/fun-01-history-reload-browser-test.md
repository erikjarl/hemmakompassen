# FUN-01 – webbläsarhistorik och direktlänkar

Testningen i `tests/visual.mjs` utökar den befintliga funktionsinventeringen med en **verklig Chromium-historikresa**, fortfarande med helt syntetiska konton och serverdata.

## Scenario
Tre miljöer: förälder 320 px, tonåring 390 px och förälder desktop 1440 px.

Varje test startar på Hem, klickar på Gillaswajpen, Personlighet och Kommunikation i den faktiska navigeringen, går två gånger bakåt och en gång framåt via webbläsarhistoriken, laddar om Personlighet, följer en direktlänk till `#kommunikation/pausa`, går till NVC, går tillbaka till övningen, laddar om och kontrollerar att övningen verkligen öppnas. Okänt övnings-ID och felkodad hash ska inte öppna otillåten eller påhittad vy.

Varje steg verifierar URL-hash, exakt markerad aktiv huvudflik, att sidan har ett rubrikfält och att dokumentet inte får horisontell overflow. Bekräftade steg skrivs i `artifacts/fun-01-browser-history-synthetic.json` och följer med övriga CI-artefakter.

## Avgränsning
Inga autentiserade Supabase-sessioner, användarsvar eller verkliga mobiltelefoner berörs. Tester i Chromium ersätter inte iOS Safari, VoiceOver, verklig kortsvarspersistens eller riktiga utloggningar. Ett grönt syntetiskt resultat betyder inte att dessa delar är fullständigt verifierade.

**Status:** inväntar CI-resultat på aktuell PR; dokumentera verifierat utfall och eventuella brister efter körning.
