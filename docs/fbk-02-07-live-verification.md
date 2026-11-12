# FBK-02-07 – verifiering av AI-reflektion direkt i inkorgen

**Upprättad:** 2026-11-12. **Status:** testprotokoll; ej genomförda produktionskontroller. **Relaterat:** `docs/ACTIVE_ROADMAP.md`, PR #400–401, `AGENTS.md`.

## Syfte och avgränsning

Verifiera att AI-reflektionen visas högt upp på `index.html#inkorg` för en faktiskt serververifierad familjeparning, med endast uttryckligen delad information. Testa två autentiserade separata konton (en förälder och en tonåring). Syntetiska Chromiumtester och grön CI är **inte** bevis för dessa scenarier. Återanvänd befintliga testkonton; ändra inte användarnas sparade svar för testning utan särskilt godkännande. Om nödvändig delning saknas ska scenariot markeras *ej testbart*, inte kringgås.

## Reproducerbar kontrollmatris

| ID | Förutsättning och steg | Förväntat utfall | Bevis att samla |
| --- | --- | --- | --- |
| L1 | Logga in som förälder; öppna `#inkorg` på 390 px skärmbredd | Reflektionssektion högt upp utan att inkorgens meddelandeformulär försvinner | Tid, roll, skärmbild, konsolfel |
| L2 | Logga in separat som tonåring; öppna samma route på 320 px | Anpassad rubrik och endast rätt familjs tillåtna delningar | Tid, roll, skärmbild |
| L3 | Öppna inkorgen utan aktuell serverbekräftad parning (endast med tillgängligt säkert testtillstånd) | Ingen gammal reflektion eller delad korttext visas | Skärmbild och relevant nätverksrespons utan persondata |
| L4 | Använd faktiskt delade A-kort och frivilligt delade B-kort där detta redan finns | A/JA+JA och frivilliga B skiljs åt; inga privata kort exponeras | Anonymiserad förväntad/visad mängd |
| L5 | Besök `#insikter`, gå tillbaka till `#inkorg`, navigera fram och tillbaka | Ingen reflektion från föregående session/parning återanvänds | Händelseordning och anonymiserad logg |
| L6 | Skriv ett oskickat meddelande och trigga inkorgsuppdatering | Text, fokus och markörposition förblir intakta | Videoklipp eller stegbeskrivning |
| L7 | Tillfälligt nätverksfel/offline under inläsning | Tydligt felläge; ingen tidigare analys felaktigt märkt aktuell | Skärmbild och nätverksstatus |
| L8 | Återkomst till fliken efter session-/parningskontroll | Inga gamla parningsdata visas utan aktuell verifiering | Anonymiserad händelselogg |
| L9 | Safari på fysisk mobil; 320/390px och förstorad text | Läsbar text, ingen horisontell overflow, användbar scroll och fokus | Enhet/OS, skärmbilder |
| L10 | Kontrollera publicerade Pages-filer efter merge till `main` | Version i serverad HTML och versionssatta skript motsvarar avsedd release | HTTP-status, versionssträng, hämtningstid |

## Resultatredovisning

För varje rad: datum, miljö, faktisk åtgärd, observerat resultat, **PASS/FAIL/BLOCKERAD/EJ KÖRD**, begränsning, fel-ID och bevislänk. Redovisa tydligt om enbart källkod, mockad browser eller verkliga konton har verifierats. Kopiera aldrig identifierande eller privata rapportuppgifter till GitHub. Ändra `public.test_feedback.status` först efter verifierad lösning och dokumenterad triage enligt FBK-02.

**Aktuell verifiering:** Alla L1–L10 = **EJ KÖRDA** i detta protokoll. Att testplanen finns betyder inte att rapporten har lösts.
