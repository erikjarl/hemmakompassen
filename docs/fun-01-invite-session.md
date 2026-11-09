# FUN-01-INVITE-01 – genererad QR-inbjudan vid sessionbyte

**Datum:** 9 november 2026 · **PR:** [#240](https://github.com/erikjarl/hemmakompassen/pull/240) · **Status:** syntetiska automatiska tester inväntas.

## Funktionell brist

Kontosidan behöll `#new-invite`, `#invite-qr-image` och `#invite-link` i DOM efter att en ny kontosession hade laddats. `refresh()` dolde QR-koden vid utloggning men rensade inte gammal genererad kod eller länk, och visade inte QR-koden konsekvent för en ny användare. Ett fördröjt `create_family_invite`-anrop kunde dessutom presentera gammal inbjudning efter att ett senare kontobyte redan registrerats.

Detta är en **kodgranskningsgrundad användarflödesbrist**, inte en uppmätt incident i riktiga konton.

## Åtgärd

- Spåra vilken inloggad identitet kontosidans DOM faktiskt visar. Vid byte av användar-ID eller utloggning: rensa den skapade textkoden och ta bort QR-bildens `src` och länkattributets `href`, och dölj QR-figuren.
- Vid vanlig `refresh()` av **samma användare** bevaras den pågående QR-inbjudan; ingen onödig ny familjekod skapas.
- Vid **kontoändring** döljs också föregående familjs namn och paneler direkt, innan ny familjehämtning är klar; de fylls först från den nya kontosessionens svar.
- När familjen blir fullt parad (två medlemmar) eller inte längre har en aktiv ensammedlemsvy rensas tidigare genererad inbjudningskod/QR-länk så den inte dyker upp igen vid framtida ändringar.
- När `create_family_invite` returnerar verifieras **kontot som faktiskt är inloggat** mot kontot som begärde koden. Ett annat konto får inte se gammalt svar, medan en vanlig uppdatering av samma konto inte kastar bort en redan skapad inbjudan.
- Ingen förändring av backend, befintliga inbjudningsposter, inloggnings-/parningsregler eller användarsvar.

## Reproducerbara, syntetiska kontroller

`node --test tests/account-invite-session.test.mjs` kör produktens verkliga `konto.js` i Node VM med avsiktligt styrda in-memory svar och simulerat DOM:

1. En skapad inbjudan syns efter normal uppdatering av samma konto, utan nya RPC-kallelser.
2. Inloggning som annat konto rensar gammal kod, QR-bild och länk.
3. Utloggning rensar alla genererade inbjudningsfält.
4. Ett gammalt RPC-svar anländer efter kontoändring och får inte återinföra den gamla koden.
5. En Auth-uppdatering av **samma konto medan inbjudningsanropet väntar** ska inte förlora den giltiga, nyskapade koden.
6. En färdigparad familj ska rensa den gamla QR-inbjudan; när familjeläget senare ändras tillbaka får den inte dyka upp igen.

Ett kompletterande test i `tests/account-refresh-race.test.mjs` håller den nya familjeläsningen avsiktligt väntande och verifierar att det tidigare kontots familjenamn/paneler inte fortsätter synas innan korrekt svar kommer.

**Avgränsning:** Mockad Supabase/Auth, inga riktiga användare/servrar, inget nätverksavbrott och ingen Safari/VoiceOver eller manuell QR-skanning. En grön CI är inte bevis för autentiserad tvåkontoparning. FUN-01 kvarstår som **Pågår** tills verklig funktionsverifiering har gjorts.
