# Lage i Rimforsa – kravspecifikation (både öppna och färdiga uppgifter)

**OBS: DETTA ÄR INTE EN ATT-GÖRA-LISTA.** Många av kraven nedan är redan genomförda. **Endast** [ROADMAP.md](../ROADMAP.md) visar vad som återstår och prioritetsordningen. Avslutade uppgifter är flyttade till [COMPLETED_TASKS.md](COMPLETED_TASKS.md). Här finns bara funktionella krav och referensbeskrivningar: använd uppgifts-ID för att läsa rätt avsnitt, och behandla inte rubriker eller gamla beskrivningar som nya öppna uppgifter. Alla synliga ändringar omfattas fortfarande av [grafik- och spelstandarden](GAME_RULES.md).

## Gemensam grafik och minispelsmiljöer

#### GRAF-01

**Prioritet hög: Harmonisering av alla scener.**

Inventera huvudkartan och samtliga minispel, fastställ gemensamma riktlinjer för färger, pixelskala, sprites, ljus/skuggor, proportioner och animationer och rätta avvikande grafik successivt. Gör före-/efter-skärmbilder på mobil och dator och säkerställ att samma karaktär känns igen mellan scener.

#### GRAF-02

**Prioritet hög, börja här: Bygg om trollminispelets grafik.**

Ersätt visuellt avvikande eller förenklade element med en detaljerad SNES-inspirerad skogsmiljö som tydligt hänger ihop med huvudkartans sten och troll. Rita Lage, trollet, bajsprojektiler, bakgrund och effekter i konsekvent pixelskala, med animationer och läsbara träffeffekter. **Bevara befintlig kastmekanik, poäng, ljud, start/avslut och mobilstyrning.**

#### BUTIK-01

**Prioritet hög: ICA som riktigt inomhusminispel.**

När Lage går in på ICA ska spelaren mötas av en detaljerad pixelritad butik med hyllor, glassfrys, varor, kassadisk och **en synlig kassaperson** i samma stil som huvudkartans figurer. Lage ska kunna interagera med personalen och köpa päron- eller vaniljglass **inne i butiksscenen**. Befintliga priser, myntavdrag, väska och sparregler ska fungera som tidigare; inte enbart en dialogruta.

#### BUTIK-02

**Prioritet hög: Pizzerian som riktigt inomhusminispel.**

När Lage går in på Bella Donna ska en detaljerad pixelritad pizzeria visas med pizzaugn, arbetsbänk, pizzor, inredning och **en synlig pizzabagare eller kassaperson**. Beställ ananaspizzaslice genom interaktion med personen i scenen. Bevara nuvarande pris, myntsaldo, inventarium och återgång; inte enbart en dialogruta.

#### MINI-01

**Stående kontroll av framtida minispel.**

Alla nya minispel ska planeras som egna igenkännbara, spelbara scener i huvudkartans grafiska stil redan från första versionen. Granska SNES-känsla, detaljnivå, figurer, föremål, mobila kontroller och återgång innan de markeras färdiga. Befintliga minispel uppgraderas successivt enligt GRAF-01.


#### SPORT-01

**Hackelhallen: fotbollsminispel med Maja.**

När Lage går in i Hackelhallen öppnas en egen spelbar, detaljrik 16-bitars inomhushall där Maja är en tydligt ritad medspelare eller motspelare. Lage ska kunna spela fotboll med Maja, sparka boll mot mål och se mål/poäng. Spelet ska fungera på mobil och med tangentbord och gå att avsluta tillbaka till huvudkartan utan att övriga sparade framsteg försvinner.


## Nya utvecklingsuppgifter – sorterade 19 november 2026

### Fordon och drivmedel
#### FORDON-02

**Riktningsanpassad grafik för bil och båt.**

Använd egna bilder för höger, vänster, uppåt, nedåt och diagonala färdriktningar. Taket ska alltid vara uppåt i bild; perspektivet ska fungera även på mobil. **Felhänvisning 19 november:** bilens fram- och bakdel ser inte ut att vara samma modell som sidovyn. Skapa konsekventa vyer av samma vita bil med samma tak, proportioner, fönster, hjul, ljus, färger, skuggning, pixelskala och detaljnivå. Granska alla riktningsvyer sida vid sida och i mobilvyn. Båtens riktningsvyer ingår fortfarande.

#### BRÄNSLE-01

**Tankmätare, bensinförbrukning och inköp.**

Bil och båt ska starta med tomma tankar, kunna tankas på macken och inte gå att köra utan bensin. Planera så att spelaren kan komma vidare även när tanken är tom.

#### BRÄNSLE-02

**Aktuellt Ingo-pris på skylt.**

Visa verifierat dagspris på en skylt i huvudkartan och låt tankningskostnaden utgå från detta. Undersök prisdatakälla och uppdateringsmöjligheter först; visa inte ett inaktuellt pris som dagens.


### Karaktärer, inventarier och odling
#### NPC-02

**Unika utseenden för Oliver och Saga.**

Egna sprites i samma 16-bitarsstil, inte bara nya färger.

#### INV-02

**Tydligare bilder av föremål.**

Framför allt nycklar och andra upphittade eller köpta saker.

#### ODLING-01

**Odla potatis på ett av fälten.**

Plantera, vänta fem minuter på tillväxt och skörda. Visa tiden tydligt, inklusive hur den fungerar vid omladdning.

#### ODLING-02

**Sälj potatis till ICA-handlaren.**

Ge spelmynt vid försäljning och håll köpta/sålda mynt åtskilda från skattjaktsmålet. Beror på ODLING-01.


### Ljud
#### LJUD-01

**Läs upp karaktärernas repliker.**

Utöver skriven text; med respekt för ljudknappen.

#### LJUD-02

**Åtgärda ljud i Safari på mobil.**

**Återkommande felrapport 19 november:** ljudet fungerar återigen inte fullt ut i mobilvyn. Undersök vad som faktiskt är tyst: bakgrundsmusik, effekter och tal på huvudkarta och i minispel. Kontrollera ljudknapp av/på, första användargesten, byte mellan scener, paus/återupptagning, flikbyte och att ljudmotorn inte fastnar tyst. Testa i faktisk iPhone/Safari och ange vad som verifierats; kringgå inte webbläsarens regler för ljudstart.

#### LJUD-03

**Fler effekter för spelhändelser.**

Skapa många men välavvägda originalskapade ljudeffekter.

#### LJUD-04

**Pruttigare bajsljud.**

Ersätt den nuvarande ljudeffekten med ett kort, originalskapat pruttljud.


## Kravbeskrivningar – Kinda båtklubb

#### BÅT-01

**Vattenambience.**

Lägg till bakgrundsljud med **vågskvalp och fiskmåsar** när man befinner sig i båtminispelet.

#### BÅT-02

**Motorljud.**

Lägg till **båtmotorljud när motorbåten kör**. Ljudet ska följa körningen, och stanna när båten stannar eller minispelet lämnas.


## Kravbeskrivningar – huvudkartan

#### HUV-01

**Myntljud.**

Spela ett tydligt **pengaljud när ett mynt samlas in**.

#### HUV-02

**Musik.**

Lägg till **mysig bakgrundsmusik** på huvudkartan.

#### HUV-03

**Vit bil vid hemmet.**

Lägg till **en vit bil vid Hem/Ulrikavägen**. Lage ska kunna välja att köra den. När bilen kör ska den ha **motorljud**, och bilen ska kunna köra **över alla terränger utom vatten**.

#### HUV-04

**Bajskorvar.**

Lägg till **bajskorvar** som hinder. Lage **förlorar ett hjärta** när han kommer i kontakt med en bajskorv.

#### HUV-05

**Hjärtan och omstart.**

När **alla hjärtan försvinner** ska spelet **börja om**, och spelaren ska **förlora alla insamlade mynt**. **Återöppnad efter felrapport 19 november:** gemensamt myntsaldo, även intäkter från minispel, ska bli **0** när sista hjärtat försvinner, och den nollställda statusen måste bestå efter omladdning. Återställ nödvändiga insamlingsflaggor så att en ny omgång är möjlig, utan att oavsiktligt radera andra ägodelar. Delvis hjärtförlust får inte nollställa mynten.


#### HUV-06

**Gör bajskorvarna tydligare – ändra inte storleken.**

Förbättra deras synlighet på gräs, mark och väg genom mer distinkt siluett, kanter, färgkontrast och små pixelerade skugg-/ljusdetaljer. Behåll spriteytans storlek, placering, kollisionsyta och hjärtförlust. Ändringarna ska följa huvudkartans exakta pixelskala och SNES-detaljnivå.

#### MYNT-03

**Mynt från minispelen ska följa med till huvudkartan.**

Mynt som Lage plockar upp eller vinner i minispel ska överföras till samma gemensamma myntsaldo som syns på huvudkartan och används vid inköp. Saldot ska finnas kvar vid scenbyte och omladdning, utan dubbla tilldelningar när minispel avslutas eller spelas om. När sista hjärtat försvinner ska dessa mynt också nollställas enligt HUV-05.


## Nya förbättringar – huvudspel och spelvärld (2026-11-18)

#### BIL-01

**Finare vit bil.**

Ersätt bilens nuvarande förenklade pixelgrafik med en mer detaljerad, välgjord **16-bitarsbil i samma grafiska stil som motorbåten**. Visa Lage i bilen, bevara styrning, motorljud, möjlighet att kliva in och ur och regeln att bilen inte får köra i vatten. Kontrollera utseende i rörelse och på mobil.


#### MYNT-01

**Fler mynt på kartan.**

**Öka antalet insamlingsbara mynt** på huvudkartan och sprid ut dem på ett lekfullt sätt. Se till att alla kan nås, att HUD/räknare visar rätt totalantal och att insamlade mynt kan användas i framtida butiker. Undvik att pengar försvinner oavsiktligt vid byte till minispel.


#### MYNT-02

**Grattis när alla mynt hittats.**

När Lage samlat **alla mynt** ska spelet ge en tydlig och festlig belöning, exempelvis texten **”Grattis! Du har samlat alla mynt!”** med en enkel animation och ett passande ljud. Den ska bara utlösas när målet är uppnått, gå att stänga och fungera på mobil. Anpassa till framtida köp och mynt som tillkommer vid kartutbyggnad.


#### NPC-01

**Vandrande karaktärer och samtal.**

Skapa **andra karaktärer i samma pixelgrafik som Lage** som går omkring på gator och stigar, utan att blockera spelaren. Lage ska kunna gå fram och **prata med dem** via en lättbegriplig samtalsruta. Ge figurerna egna repliker och bevara stöd för mobilstyrning.


#### INV-01

**Föremål och väska.**

Inför möjlighet att **samla in, förvara och spara föremål** i en enkel inventarievy/väska som kan öppnas igen efter att spelet stängts. Börja med lokal lagring på samma enhet (om den är tillåten), med tydlig återställningsfunktion. Planera föremål så att de kan återanvändas i framtida minispel och inköp. Myntsaldo och inventarieobjekt ska skiljas åt.


#### DRAKE-01

**Drake i skogen.**

Skapa en **animerad drake i samma 16-bitarsstil** som rör sig bland skogspartier på huvudkartan och **sprutar eld med animation**. När draken är nära ska den vanliga musiken växla till **läskig/spännande musik**, och växla tillbaka när Lage lämnar området. Eldanimation och rörelse ska fungera även på mobil. Eventuella skador eller ytterligare spelregler bestäms senare; de ingår inte som uttryckligt krav här.


#### DRAKE-02

**Farlig drake vid skogen längst till vänster och riktade eldklot.**

Flytta drakens rörelseområde till skogen längst ut på vänsterkanten på huvudkartan utan att blockera vägar eller minispelsingångar. Lage förlorar ett hjärta om han nuddar draken. Draken ska skjuta tydliga animerade eldklot mot Lage **och helikoptern**; träff på Lage kostar ett hjärta. Ha en kort skadepaus så samma kontakt/eldklot inte tar flera hjärtan direkt. Helikoptern ska kunna bli träffad och reagera begripligt utan att spelet låser sig. Anpassa eldklot, ljudeffekter och spritekonst till huvudkartans SNES-stil.


## Trollet vid stenen nordväst om rondellen

#### TROLL-01

**Placering och interaktion.**

Lägg ett troll på den befintliga stenen nordväst om rondellen, med transparent pixelgrafik från den godkända referensbilden. Trollet ska vara lite större än Lage, synas i huvudkartan och gå att hälsa på till fots; placeringen ska inte ändra den befintliga gång- eller bilkollisionen.

#### TROLL-02

**Bajskastnings-minispel.**

Bygg ett separat minispel där Lage kastar bajs på trollet. Återanvänd trollets fasta världspunkt och ingången `window.RimforsaTrollMinigame.start({troll,player,returnToMap})`. Kaststyrning, poäng, grafik, ljud och återgång till huvudkartan är nu implementerade med särskild minispelsmodul och regressionstester.


## Kravbeskrivningar – minispel

### ICA-affären
#### ICA-01

**Glassköp.**

Använd insamlade pengar för att **köpa glass av en ICA-personal**. Spelaren ska kunna välja mellan **päronglass** och **vaniljglass**.


### Pizzeria / Bella Donna
#### PIZ-01

**Pizza.**

Låt spelaren **köpa en pizzaslice med ananas på**, betald med insamlade pengar.


### Förskolan
#### FÖR-01

**Rutschkana.**

Skapa ett rutschkane-minispel där Lage **åker nerför rutschkanan**. **Ju längre spelaren håller knappen nedtryckt, desto längre flyger Lage**.

#### FÖR-02

**Andra barn.**

Lägg till **andra barn** i förskolemiljön.

#### FÖR-03

**Utomhusljud.**

Lägg till **barnambient ljud** i förskolans utomhusmiljö.


### Åsundabadet
#### BAD-01

**Simning och dykning.**

Lägg till ett **2D-simspel med sidovy där man ser ner i vattendjupet**. Spelaren ska kunna **trycka på en knapp för att simma nedåt** och **hitta pengar på botten**.

#### BAD-02

**Hajar.**

Lägg till **hajar som simmar förbi**. Om Lage **nuddar en haj förlorar han ett hjärta**.

#### BAD-03

**Vågskvalp.**

Lägg till **vågskvalpsljud i bakgrunden** vid Åsundabadet.


## Framkomlighet på befintliga huvudkartan

#### KARTA-02

**Utöka gångytans bredd på vägar och stigar, inte deras grafik.**

Öka den osynliga gångbara zonen och toleransen för vägkanter så Lage inte fastnar eller behöver gå alltför exakt på vägar. Ändra **inte** vägarnas ritade bredd eller bakgrundsbilder. Bevara kollisionshinder för hus, stenar och vatten; tillåt förflyttning på övrig öppen mark enligt huvudkartans regler. Kontrollera att olika vägar och viktiga minispelsentréer är nåbara med mobilstyrning och tangentbord.


## Långsiktig, återkommande världsexpansion – efter övriga uppgifter

#### KARTA-01

**Utöka Rimforsakartan till mer av Kindabygden.**

**Sök och jämför verkliga kartor över Rimforsa och närområdet i Kinda** för att skapa en allt större, geografiskt igenkännbar pixelvärld med orter, vägar, skog, sjöar, broar, byggnader och utflyktsmål som ansluter till den nuvarande kartan. Dokumentera vilka geografiska detaljer som är bekräftade från kartkällor och vilka som är fria speltolkningar. Bevara samma 16-bitarsgrafik, spelkänsla och befintliga platser.


  **Arbetsprincip:** Denna punkt är **lågprioriterad tills övriga konkreta uppgifter är klara**. Därefter är den ett **öppet, nästan obegränsat fortsättningsarbete** för kommande `jobb lage`-pass: utöka en sammanhängande region åt gången, återkom till punkten upprepade gånger och markera den inte slutligt färdig bara för att en enskild utbyggnad publicerats. Planera kartladdning, gångbarhet, bilens vattenmask, minikarta, NPC-rutter och myntplacering så att världens storlek kan växa utan att befintliga sparade framsteg förstörs. Använd geografiska källor som får användas och dokumentera källor/licenser innan kartmaterial anpassas.
