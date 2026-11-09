# FUN-01-INVITE-01 – genererad QR-inbjudan vid sessionbyte

**Datum:** 9 november 2026 · **PR:** [#240](https://github.com/erikjarl/hemmakompassen/pull/240) · **Status:** syntetiska automatiska tester inväntas.

## Funktionell brist

Kontosidan behöll `#new-invite`, `#invite-qr-image` och `#invite-link` i DOM efter att en ny kontosession hade laddats. `refresh()` dolde QR-koden vid utloggning men rensade inte gammal genererad kod eller länk, och visade inte QR-koden konsekvent för en ny användare. Ett fördröjt `create_family_invite`-anrop kunde dessutom presentera gammal inbjudning efter att ett senare kontobyte redan registrerats.

Detta är en **kodgranskningsgrundad användarflödesbrist**, inte en uppmätt incident i riktiga konton.

## Åtgärd

- Spåra vilken inloggad identitet kontosidans DOM faktiskt visar. Vid byte av användar-ID eller utloggning: rensa den skapade textkoden och ta bort QR-bildens `src` och länkattributets `href`, och dölj QR-figuren.
- Vid vanlig `refresh()` av **samma användare** bevaras den pågående QR-inbjudan; ingen onödig ny familjekod skapas.
- När `create_family_invite` returnerar efter att en ny konto-uppdatering påbörjats ignoreras det gamla resultatet.
- Ingen förändring av backend, befintliga inbjudningsposter, inloggnings-/parningsregler eller användarsvar.

## Reproducerbara, syntetiska kontroller

`node --test tests/account-invite-session.test.mjs` kör produktens verkliga `konto.js` i Node VM med avsiktligt styrda in-memory svar och simulerat DOM:

1. En skapad inbjudan syns efter normal uppdatering av samma konto, utan nya RPC-kallelser.
2. Inloggning som annat konto rensar gammal kod, QR-bild och länk.
3. Utloggning rensar alla genererade inbjudningsfält.
4. Ett gammalt RPC-svar anländer efter kontoändring och får inte återinföra den gamla koden.

**Avgränsning:** Mockad Supabase/Auth, inga riktiga användare/servrar, inget nätverksavbrott och ingen Safari/VoiceOver eller manuell QR-skanning. En grön CI är inte bevis för autentiserad tvåkontoparning. FUN-01 kvarstår som **Pågår** tills verklig funktionsverifiering har gjorts.
