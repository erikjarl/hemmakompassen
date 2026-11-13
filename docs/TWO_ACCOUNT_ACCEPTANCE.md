# Hemmakompassen – acceptanstest med två verkliga testkonton

**Status:** Protokoll, inte genomfört test. Ingår i FUN-00–06 och FBK-02 i `docs/ACTIVE_ROADMAP.md`.

## Förutsättningar och säkerhet

- Använd endast särskilda testkonton för förälder respektive tonåring, inte verkliga patient- eller familjeuppgifter.
- Använd separata webbläsarprofiler/privata sessioner och dokumentera vilken profil som är inloggad. Spara aldrig lösenord, sessionsnycklar, åtkomsttoken eller privata meddelanden i GitHub.
- Notera testmiljö, datum, webbläsare, viewport (320 px, 390 px och desktop), Pages-version om den går att fastställa samt vilken roll som utför varje steg.
- **Skriv inte över befintliga svar för att testa.** Använd nya särskilt skapade testobjekt eller kör enbart läsbaserad kontroll. Samtycke och privat/delad information ska respekteras.
- Klassificera utfallet som **PASS**, **FAIL**, **BLOCKERAD** eller **EJ KÖRD** per steg. CI-fixturer och syntetiska Chromium-tester får aldrig räknas som autentiserade tvåkontotester.

## Kontroller i rekommenderad ordning

| ID | Flöde | Handling och kontroll | Kriterium |
| --- | --- | --- | --- |
| A01 | Inloggning | Logga in i varsin separat session, ladda om båda sidorna och kontrollera roll/identitet. | Rätt roll visas efter omladdning och privat innehåll korsas inte. |
| A02 | Parning | Kontrollera befintlig parning utan att byta eller bryta koppling. Vid oparade *nya* testkonton, prova ordinarie inbjudningsflöde. | Båda konton ser samma familjekoppling; inget privat innehåll från andra hushåll. |
| A03 | Gillaswajpen | Med nya testkort där så är möjligt: svara JA/JA och därefter olika svar. Ladda om båda kontona. | Endast faktisk gemensam JA/JA presenteras som matchning; olika svar räknas inte som överenskommelse. |
| A04 | Temakortlekar | Avsluta den allmänna testkortleken där särskilda testdata tillåter det; kontrollera snabbvalet till fler teman på 320/390 px och med tangentbord. | Knappen är synlig, öppnar temaväljaren och fokuserar rätt kontroll utan horisontell overflow. |
| A05 | Gemensamma insikter | Navigera till Inkorg och till gemensamma insikter från båda rollerna. | AI-reflektion, om funktionen är påslagen och har underlag, går att hitta direkt högt upp; annars visas begripligt tom-/felläge. |
| A06 | Schyssta listan | Skapa ett nytt ofarligt testförslag. Godkänn i ena kontot, uppdatera/öppna om båda, godkänn i andra kontot. | Först väntande, sedan accepterat; inget extra godkännande krävs efter verifierad lagring; accepterad regel syns i tydlig lista. |
| A07 | Beslut efter förlorad kvittens | Testa enbart om kontrollerad felinjicering är möjlig utan att skada riktiga data. Kontrollera utfallet efter serveråterläsning. | Inget automatiskt dubbelskick; serververifierat respektive osäkert utfall framgår. |
| A08 | Inkorg, läsmarkering | Skapa ett separat testmeddelande/en avisering, läs i mottagarkontot och jämför märket i mobilnavigering, startsida och Inkorg efter omladdning. | Antalet överensstämmer med serverstatus och ändras när just den aviseringen är läst. |
| A09 | Kontobyte | Logga ut, logga in i den andra testrollen i samma profil och ladda om. | Föregående kontos privata uppgifter, väntande skrivningar och olästantal återanvänds inte. |
| A10 | Tillgänglighet | Kör 320/390 px och desktop, tangentbordsnavigera till primär handling och expansionskontroller. | Synligt fokus, begriplig knapptext, ingen oavsiktlig horisontell overflow eller dolt viktigt fel-/samtyckesbesked. |

## Registrera utfall

För varje rad: `ID | datum/tid | miljö/version | roll(er) | PASS/FAIL/BLOCKERAD/EJ KÖRD | kort observation | reproduktionssteg | evidens utan persondata`.

Ett misslyckat steg dokumenteras som ett observerat fel, inte som gissad orsak. Ett passerat steg gäller endast den testade kombinationen av webbläsare, version, roller och handlingar. Användarrapporter i `public.test_feedback` får inte stängas automatiskt: jämför konkret testutfall mot respektive rapport före statusändring.

## Publiceringskontroll

Öppna den faktiska GitHub Pages-adressen från en separat session. Kontrollera `meta[name="hk-ui-version"]` och/eller filernas cacheversion mot den version som förväntas från `main`, med faktisk tidpunkt och URL. En mergad PR eller grön CI räcker inte som bevis för att Pages serverar den nya versionen.
