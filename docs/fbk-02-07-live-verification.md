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

## Bedömningskriterier för synlighet och integritet (12 november)

Detta är **acceptanskriterier inför verklig testning**, inte utförda PASS-kontroller:

1. På mobil ska inkorgens AI-reflektion vara synlig i innehållets första huvudsektion utan att användaren måste följa länken *Visa gemensamma insikter*. Om analyserade kort saknas ska den istället visa ett korrekt tom-/laddnings-/felläge, aldrig en tidigare familjs analys.
2. Vid både 320 och 390 px ska kontrollanten dokumentera ordningen mellan reflektion, inkorgsaviseringar och privat chatt samt om användaren kan nå chattens skrivruta med normal scroll. Ta skärmbild både före och efter eventuell laddning; en skärmbild av endast sidans överdel styrker inte att chatten fortfarande fungerar.
3. Kontrollera i nätverkspanel att innehållet hämtas för aktuell parnings-/delningsepok och att inget fördröjt svar från tidigare konto/parning visas efter byte. Ingen privat B-text får inkluderas utan frivillig delning.
4. AI-reflektionens synlighet och innehållets kvalitet är två skilda resultat: synlig placering kan få PASS samtidigt som faktiskt AI-svar, språk eller samtyckesvillkor får FAIL/BLOCKERAD. Markera inte hela FBK-02-07 löst enbart på grund av en godkänd skärmbild.

**Datakontroll 12/11, läsbehörighet:** SELECT i Supabase bekräftade två `new` och fem `reviewing` bland öppna `public.test_feedback`-poster. De två nya gäller reflektionens placering i inkorgen och tydlig ingång till fler Gillaswajp-kortlekar. Detta är en inventering, inte autentiserad UI-verifiering. Ingen status eller användardata ändrades.

## Resultatredovisning

För varje rad: datum, miljö, faktisk åtgärd, observerat resultat, **PASS/FAIL/BLOCKERAD/EJ KÖRD**, begränsning, fel-ID och bevislänk. Redovisa tydligt om enbart källkod, mockad browser eller verkliga konton har verifierats. Kopiera aldrig identifierande eller privata rapportuppgifter till GitHub. Ändra `public.test_feedback.status` först efter verifierad lösning och dokumenterad triage enligt FBK-02.

**Aktuell verifiering:** Alla L1–L10 = **EJ KÖRDA** i detta protokoll. Att testplanen finns betyder inte att rapporten har lösts.

## Kontrolljournal – 2026-11-12 (separat Jobb hk-pass)

- **L10 – BLOCKERAD (inte PASS):** försök att hämta den publicerade `https://erikjarl.github.io/hemmakompassen/index.html` via extern webbåtkomst gav otillgänglig resurs; separat HTTPS-försök från körmiljön misslyckades med DNS-upplösning. Ingen serverad HTML, version eller HTTP-status kunde därför verifieras. Detta är en åtkomstbegränsning i testmiljön, inte belägg för driftfel på webbplatsen.
- **Supabase-feedback – läsbaserat verifierad:** `public.test_feedback` innehåller fortsatt 7 öppna rapporter: 2 `new`, 5 `reviewing`, 0 `planned`. De två `new` hör till `#inkorg` (12/11) och `#swipe` (11/11). Ingen status eller privat rapporttext ändrad.
- **L1–L9 – EJ KÖRDA:** ingen autentiserad dubbelkontosession eller fysisk Safari fanns att verifiera. L10 kräver en miljö med fungerande åtkomst till Pages innan dess versionskrav kan godkännas.

**Slutsats:** FBK-02-07 förblir öppen. Inget produktions-/kontotest får markeras slutfört utifrån denna kontrolljournal.
