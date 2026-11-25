# Lage i Rimforsa – gemensamma spel- och grafikregler

**Bindande standard för alla uppgifts-ID:n i [ROADMAP.md](../ROADMAP.md).** Dessa regler läses vid behov vid relevant kod- och grafikarbete, men får aldrig kringgås för att de inte upprepas i varje uppgiftsbeskrivning. För varje framtida uppgift gäller samma villkor.

## Hög prioritet – gemensam grafik och riktiga minispelsmiljöer (19 november 2026)

### OBLIGATORISK GRAFIKSTANDARD – GÄLLER VARJE ENSKILD ATT-GÖRA-PUNKT, UTAN UNDANTAG

**SKAPA ALLTING I EN ENHETLIG 16-BITARS SUPER NINTENDO-STIL, HELT I ENLIGHET MED HUVUDKARTAN OCH LAGES ORIGINALKARAKTÄR. SAMMA PIXELSKALA, DETALJRIKEDOM, SKÄRPA, FÄRGHARMONI, LJUS/SKUGGOR OCH PROPORTIONER SKA GÄLLA I VARJE MILJÖ, FÖREMÅL, FORDON, FIGUR, ANIMATION OCH MINISPEL. LAGES ANSIKTE SKA HA IGENKÄNNBARA OCH TYDLIGA PIXELRITADE ANSIKTSDRAG OCH HÅR – INTE ERSÄTTAS AV ENKLARE ELLER GRÖVRE SPRITES. INGA GRAFISKA AVVIKELSER, SUDDIGA SKALNINGAR, PLATSHÅLLARE ELLER FIGURER MED LÄGRE VISUELL DETALJNIVÅ ÄN HUVUDKARTAN GODKÄNNS.**

- **Visuella riktmärken:** huvudkartan och den befintliga Lage-figuren är facit. Dykspelet, rutschkanan, båtspelet och trollspelet är särskilt nämnda som omtyckta visuella exempel; behåll det som fungerar i dem och säkerställ att de och alla andra minispel använder samma enhetliga grafikstandard. Ingen ny scen får se stilmässigt enklare eller avvikande ut.
- **Pixlar och kvalitet:** bevara samma upplevda detalj- och pixeltäthet som kartan/Lages ansikte vid samma visningsstorlek. Använd skarpa pixelkanter och konsekvent skalning; undvik både lågdetaljerade grova blockfigurer och oskarp utjämning. Återanvänd Lages originalsprite och motsvarande karaktärsdesign i alla spelvyer där det är möjligt.
- **Alltid vid uppgiftsarbete:** varje punkt nedan har samma bindande grafikvillkor, även ljud-, teknik-, kart- och redan avbockade punkter: om en uppgift skapar, förändrar eller berör synlig grafik måste grafiken följa standarden. Redan avbockad funktionalitet innebär **inte** att visuell kvalitet är slutgodkänd. Kontrollera grafisk enhetlighet vid fortsatt arbete, utan att ändra befintliga avbockningar enbart på grund av denna instruktion.
- **Omfattning:** originalgjord SNES-inspirerad pixelkonst, inte kopierat material från kommersiella spel. Vanliga textmenyer får vara tydligt läsbara och tillgängliga, men själva spelvärlden och minispelsmiljöerna får inte bryta bildstilen.

**Stående designkrav för hela spelet:** Huvudkartans grafiska uttryck är facit. All befintlig och framtida spelgrafik – karaktärer, miljöer, föremål, fordon, animationer och minispel – ska vara sammanhängande **16-bitars pixelkonst med SNES-känsla**, i samma detaljnivå, proportioner, skuggning, färgpalett och pixeltäthet som huvudkartan. Använd tydliga sprites och konsekvent pixelrendering utan blandning av generiska emoji, enkla geometriska platshållare, fotorealism eller stilmässigt avvikande illustrationer i själva spelvärlden. Menyer och tillgänglig text får vara modern och läsbar. Skapa originalgrafik, inte kopierade SNES-speltillgångar.

**Stående krav för alla minispel och byggnader:** När Lage går in i en byggnad eller startar ett minispel ska det öppnas en **egen detaljerad, spelbar visuell miljö**, inte bara en vanlig dialogruta med text och köpknappar. Miljön ska ha bakgrund, rekvisita, karaktärer och tydlig interaktion i huvudkartans SNES-inspirerade stil; dialog används som en del av scenen när figurer pratar. Minispel i öppen miljö (t.ex. troll, rutschkana och bad) ska på motsvarande sätt ha en genomarbetad scen med samma grafik. Styrning, återgång, ljudval, befintliga mynt/hjärtan/inventarier samt mobilstöd ska bevaras.

## Gemensamma tekniska hänsyn (förslag för genomförandet, inte ytterligare användarkrav)

- **Ekonomi:** Låt myntplånboken som används till ICA och pizzerian ha en tydlig koppling till insamlade mynt. Samordna avdrag och återställning av mynt när hjärtan tar slut; undvik att räkna samma mynt två gånger.
- **Ljud i webbläsaren:** Mobilwebbläsare kräver normalt en användargest innan ljud får starta. Starta ljud efter en faktisk spel-/knappinteraktion, och stoppa eller byt ljud vid miljöbyte. Använd originalskapade eller rättighetsklarerade ljud och musik.
- **Kollisioner:** Bevara hinderreglerna i gångläget, förutom bilens egna körzoner (bilvägar, mindre vägkantstolerans, infarter och parkeringar; vatten alltid spärrat). Se till att en kollision inte tar flera hjärtan omedelbart genom samma kontakt.
- **Trygg och begriplig barnupplevelse:** Gör köp, hjärtförlust, myntförlust och omstart tydliga och lätta att förstå. Håll styrning och ljudnivå lämpliga för mobil.
- **Verifiering:** Lägg till tester för respektive uppgift, spela igenom huvudflödet och kontrollera samma publicerade URL. Redovisa separat om fysisk iPhone/Safari inte har testats.
