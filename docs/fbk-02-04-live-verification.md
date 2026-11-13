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

## Särskild kontroll efter PR #451: utebliven läskvittens för privat chatt

Den nyligen mergade klientändringen visar okänt olästantal när kvittens för `mark_family_messages_read` saknas. Denna presentationsförbättring behöver skiljas från ett lyckat eller misslyckat serveranrop.

1. Med en separat testkonversation och utan att ändra gamla meddelanden: notera först serverbekräftat antal olästa privata meddelanden och menyindikatorn i en autentiserad roll.
2. Vid ett **kontrollerat** fel där kvittensen för markera-som-läst inte når klienten: kontrollera att en gammal siffra inte presenteras som verifierad och att användaren instrueras att uppdatera konversationen. Detta är ett särskilt syntetiskt scenario; det får inte framkallas genom att ändra riktiga befintliga meddelanden.
3. Försök inte upprepa lässkrivningen från den osäkra vyn direkt. Använd den synliga uppdateringshandlingen först och kontrollera att den faktiskt genomför en ny serverläsning innan knappen åter blir aktiv.
4. Kontrollera **två separata utfall** efter uppdatering: (a) servern har registrerat läst och menyn visar bekräftad nolla för chattkategorin; (b) servern har inte registrerat läst och korrekt olästantal visas. En misslyckad uppdatering måste behålla okänd status – inte låtsas noll.
5. Växla mellan mobilens nedre meny och desktopmenyn och gör full omladdning i samma autentiserade roll. Kontrollera att okända respektive verifierade antal inte förväxlas med aktiviteternas eller reglernas olästa poster.

**Godkänt kriterium:** I båda utfallen överensstämmer visningen med en ny verifierad serverläsning. **Bevisnivå:** PR #451:s syntetiska tester är gröna enligt roadmapen, men dessa steg är ännu inte genomförda med autentiserade tvåkontosessioner; rapport FBK-02-04 förblir öppen.

## Avgränsning

Detta dokument är ett genomförbart manuellt testprotokoll, **inte** ett utfört autentiserat end-to-end-test. Det innebär ingen ändring i produktionskod, sparade läskvittenser, feedbackstatusar eller befintliga användarsvar.
