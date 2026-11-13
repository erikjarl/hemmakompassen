# FBK-02-04 – verifiera kvarstående olästmarkering i Inkorgen

**Status:** öppen funktionell verifiering · **Datum:** 2026-11-13 · **Prioritet:** P1

## Frågan som behöver avgöras

En testare har rapporterat att navigeringens olästmarkering kan finnas kvar efter att Inkorgen lästs. Tidigare syntetiska tester visar att navigeringen kan skilja på verifierat antal, partiellt okänt antal och fel, men de bevisar inte att läskvittenser sparas och återläses rätt med faktiska konton.

**Håll isär tre observationer:** (1) den faktiska serverns olästa aktiviteter, (2) Inkorgens visuella översikt och (3) märkningen i mobilens nedre meny och desktopmenyn. Att dessa tre avviker från varandra är en reproducerbar observation; att en badge syns är inte i sig ett fel om en annan kategori fortfarande är oläst.

## Förutsättningar

1. Bekräfta vilken commit som faktiskt serveras i testmiljön. Om den inte kan styrkas, notera det som *ej verifierat*.
2. Använd två separata, autentiserade webbläsarsessioner (förälder och tonåring) i rätt testpar. Blanda inte profiler och skriv inte ut token, namn, mejl, familje-ID eller meddelandetext i GitHub.
3. Börja med befintliga aktiviteter utan att förändra sparade svar, läsa den andra personens privata data eller skapa falska testhändelser. Om ett skrivande test krävs används endast särskilt godkänd neutral testdata.
4. Anteckna klockslag, enhet, viewport, webbläsare, roll, serverad commit och om nätverket fungerar.

## Reproducerbart förlopp

| Steg | Handling | Kontroll och förväntat beteende |
| --- | --- | --- |
| 1 | Notera navigeringens märkning **innan** Inkorgen öppnas. | Separera verifierad siffra (t.ex. 2), minst en verifierad med osäker kategori (2+) och helt okänt antal (?). |
| 2 | Öppna Inkorgen och läs översikt, regelhändelser, gemensamma kort och eventuella andra olästa kategorier. | Dokumentera vilken kategori som visar läsbar, oläst, laddar eller fel. Enbart att öppna sidan innebär inte nödvändigtvis att allt markeras läst. |
| 3 | Utför den användarhandling som faktiskt markerar respektive händelse som läst. | Bekräfta synlig återkoppling och om läskvittenseffekten har serverkvittens; dra inte slutsatser från enbart lokalt försvunnen badge. |
| 4 | Växla till annan sida och tillbaka utan omladdning. | Alla verifierat lästa poster ska vara lästa; okända kategorier ska fortfarande redovisas som okända och inte tyst som noll. |
| 5 | Ladda om hela sidan. | Lässtatus ska hämtas på nytt utan att lästa händelser felaktigt blir olästa. Följ laddnings-/felstatus. |
| 6 | Upprepa i **390 px och 320 px**, samt datorvy. | Nedre mobilmeny och desktopmeny ska använda samma bekräftade antal och begriplig tillgänglig etikett. Kontrollera även att menytext inte klipps av. |
| 7 | Upprepa med den andra autentiserade rollen. | De två rollerna ska se sin egen aktuella lässtatus, inte få ett värde överfört från den första sessionen. |
| 8 | Prova en *kontrollerad* kort nätverksstörning i läsanropet, utan att skriva testdata. | En misslyckad kontroll får inte beskrivas som '0 olästa'. Efter återanslutning ska en ny hämtning kunna återställa verifierad status. |

## Diagnos vid reproducerat fel

- Registrera den minsta reproduktionen, inklusive **vilken olästkategori** som står kvar och om just den kategorin har fått en positiv serverkvittens.
- Skilj på nätverksfel, fördröjd serveråterläsning, en gammal klientcache och faktiskt felaktigt lagrad läskvittens.
- För läsbaserad SQL: sammanställ enbart aggregerade statusantal eller fråga på tillåtna testidentifierare i privat felsökning; lägg aldrig meddelandetext eller användar-ID i offentliga commits.
- Kontrollera om märkningen försvinner efter helt ny session. Ett enstaka försvinnande utan verifierad serverstatus är inte bevis för grundorsaken.
- Markera **FBK-02-04 fortsatt öppen** tills verkliga konton och motsvarande serverstatus visar att felet är reproducerat/åtgärdat, samt den rapporterande testaren kunnat bedöma förbättringen.

## Avgränsning

Detta dokument är ett genomförbart manuellt testprotokoll, **inte** ett utfört autentiserat end-to-end-test. Det innebär ingen ändring i produktionskod, sparade läskvittenser, feedbackstatusar eller befintliga användarsvar.
