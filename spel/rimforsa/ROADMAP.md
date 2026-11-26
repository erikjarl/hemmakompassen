# Lage i Rimforsa – aktiv arbetskö

**Projekt:** `erikjarl/hemmakompassen` · **Spel:** `spel/rimforsa/index.html`  
**Publicerad adress:** https://erikjarl.github.io/hemmakompassen/spel/rimforsa/  
**Senast rensad:** 2026-11-26 · **Källa för uppgiftsstatus och arbetsordning:** denna fil.

**NY AVGRÄNSNING 26 november 2026 (uttrycklig användarinstruktion, företräde framför äldre regler):** Användaren är nöjd med spelet i övrigt. Arbeta endast med de nya önskemålen i ROADMAP: drakstridens ljud/musik, helikopterträffar med strikt eldklotsgräns och synlig förmögenhet vid hemmet. Tidigare öppna uppgifter är återkallade, inte verifierat färdiga, och får inte återinföras eller väljas som reservuppgift utan ny användarinstruktion. Den stående generella spriteinventeringen upphör; bildarbete görs endast för aktuella krav. Behåll SNES-kvalitetsregeln för ny grafik. Rotera mellan de nya aktiva uppgifterna; om endast en återstår får den bearbetas flera pass i följd. När kön är tom avslutas Jobb lage utan nya oombedda förändringar. Leveransgrinden gäller inom denna avgränsning.

## Bindande leveransgrind för varje Jobb lage (26 november 2026)

**Läsning, planering, inventering, kodgranskning, testning och rapportering är förberedelser – inte ett avslutat utvecklingspass.** Börja verktygsarbetet omedelbart och fortsätt i samma körning till en konkret leverans. Ingen ny användarbekräftelse behövs.

1. Läs aktiv kö och instruktioner. Välj nästa genomförbara huvuduppgift enligt rotationen. Avgränsa vid behov uppgiften till en liten men verklig användarnyttig förändring.
2. Om vald uppgift blockeras (t.ex. binär bildöverföring, fysisk Safari eller extern prisdata), dokumentera exakt hindret och byt **omedelbart** till nästa andra öppna genomförbara uppgift. Upprepa tills en konkret förändring kan göras. Ett hinder i en enskild uppgift är aldrig skäl att avsluta hela passet. Om alla aktiva punkter är blockerade, välj en mindre genomförbar del inom samma nya krav; ändra inte andra funktioner.
3. Utför minst en substantiell speländring i kod eller integrerade resurser som förbättrar faktisk funktion, spelupplevelse eller grafik; rena dokumentationsändringar, cacheversionshöjningar, kosmetiska kodomskrivningar, testfiler eller enbart genererade men ointegrerade bilder uppfyller inte detta krav. Prioritera integrerad bildgrafik när den behövs för aktuella krav.
4. Kontrollera ändringen med lämplig syntaxkontroll, avgränsat funktionstest eller konkret kodgranskning. Vid fel: rätta och kontrollera igen, eller välj en mindre genomförbar ändring. Granska öppna punkter och stryk verifierat klara direkt.
5. Committa/pusha speländringen till main enligt fullmakten, synkronisera ROADMAP.md, båda AGENTS.md och övriga berörda instruktioner samt färdigarkiv/arbetslogg där tillämpligt. Uppdatera rotationen efter faktiskt utfört arbete. Läs tillbaka ändrade filer på main och kontrollera commitresultat; kontrollera publicering där tillgängligt. Påstå inte att Pages är publicerat om detta inte verifierats.
6. **SLUTGRIND:** Innan slutrapport: kontrollera att (a) en verklig speländring finns på main, (b) relevant kontroll utförts och redovisats, (c) samtliga obligatoriska dokument är synkroniserade, (d) rotation och status är korrekta. Om något saknas, fortsätt med nästa nödvändiga verktygsanrop i stället för att avsluta. En blockerad uppgift eller ett misslyckat verktygsanrop räcker inte; försök en rimlig alternativ metod eller annan uppgift. Prioritera tidigt en liten levererbar ändring så att passet inte förbrukas av läsning.

Undantag: endast verkligt övergripande hinder (t.ex. nekad skrivbehörighet, samtliga rimliga verktygsvägar otillgängliga eller en hård körgräns) får göra passet ofullständigt. Leverera då allt faktiskt genomförbart, uppdatera dokumentationen om möjligt och rapportera exakt vilka alternativa försök som gjordes och vilka slutvillkor som inte uppfylldes. Ändra inte rotationsfält som om passet lyckats. Kalla aldrig ett sådant pass genomfört. Inga löften om arbete efter avslutad körning. Denna leveransgrind har företräde framför äldre formuleringar som kan tolkas som att en granskning eller blockerad enskild uppgift räcker.

## Rotation

**SENAST BEARBETAD HUVUDUPPGIFT: `DRAKE-03` – isbollsljud och närhetsmusik.**

**NÄSTA ROTATIONSPOSITION: `SKATT-01`.**

Rotation: DRAKE-03 → SKATT-01. Om endast en uppgift återstår får den väljas igen. Stryk verifierat färdiga delmoment direkt, flytta färdiga uppgifter till färdigarkivet och uppdatera antalen. Behåll återkallade uppgifter utanför kön.

**Senaste avslutningsnotis:** 2026-11-26 – DRAKE-03: egna isbollsskott- och drakträffljud samt närhetsmusik även vid helikopterflygning implementerade på main (7639767, 0409c3e), återlästa och kodgranskade. Befintlig helikopterträff och terränggräns finns men verklig träffmöjlighet och gränser behöver kontrolleras. Ljuduppspelning/Pages ej verifierade. Nästa SKATT-01.

## Kvar att göra – aktiv arbetskö (2)

- [ ] **DRAKE-03 – Drakstridens ljud och säkra eldbollar.** · [Krav](docs/TASK_DETAILS.md#drake-03--drakstridens-ljud-och-säkra-eldbollar) · **Kvar:** Kontrollera faktisk eldklotsträff på flygande helikopter och att hela projektilbanan aldrig når väg 23, bensinmackens närhet eller andra skyddade områden; åtgärda konkreta fel.
- [ ] **SKATT-01 – Växande skatt vid hemmet.** · [Krav](docs/TASK_DETAILS.md#skatt-01--växande-skatt-vid-hemmet) · **Kvar:** Skattplatta nära hemhuset med växande glittrande skatt som speglar alla mynt i den gemensamma plånboken.

## Status

46 tidigare verifierat färdiga uppgifter i [COMPLETED_TASKS.md](docs/COMPLETED_TASKS.md). Nio tidigare öppna uppgifter har återkallats av användaren 26 november 2026: MOBIL-01, ODLING-03, LJUD-02, GRAF-01, MYNT-03, HELI-02, NPC-04, BRÄNSLE-02, KARTA-01. De är historiska krav i TASK_DETAILS.md och inte aktiva eller färdigmarkerade. MINI-01 och [GAME_RULES.md](docs/GAME_RULES.md) gäller som kvalitetsregler för ändrad grafik/spelmekanik, inte som extra utvecklingsuppgifter. Dokumentera faktiskt genomförda delsteg i [WORKLOG.md](docs/WORKLOG.md) och synkronisera båda AGENTS-filerna vid varje utvecklingspass.
