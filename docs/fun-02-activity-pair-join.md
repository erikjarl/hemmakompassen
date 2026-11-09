# FUN-02/03-ACTIVITY-PAIR-JOIN-01 – aktivitetsförslag medan familjen kontrolleras

**Datum:** 9 november 2026 · [PR #245](https://github.com/erikjarl/hemmakompassen/pull/245) · **Status:** PR #245 mergad (`c8860ae`), Node/Chromium och publicerad GitHub Pages-kod verifierade; två riktiga Auth-konton och fysisk Safari återstår.

## Reproducerat användarflödesfel

I Gillaswajpens gemensamma aktivitetsmatchningar finns knappen **Föreslå tid i inkorgen**. Den ska skapa ett frivilligt meddelandeutkast som föräldern eller tonåringen själv får välja att skicka. Före rättningen kunde ett normalt 15-sekunders bakgrundsanrop till `recheckInboxPair()` vara igång när knappen användes.

I föregående leverans [PR #244](https://github.com/erikjarl/hemmakompassen/pull/244) infördes möjlighet för manuella inkorgsåtgärder att **ansluta till samma pågående familjekontroll**. Aktivitetshandlingen `prepareActivityMessage()` hade däremot kvar en separat spärr på `inboxPairCheckBusy` som avbröt klicket direkt och visade Försök igen — även om den aktiva serverkontrollen strax därefter bekräftade samma familj. Den kunde alltså ge en onödig återvändsgränd i ett vanligt användarflöde.

**Avsiktligt rött test:** [CI #42547566868](https://github.com/erikjarl/hemmakompassen/actions/runs/42547566868) körde oförändrad produktion med tre nya Node/VM-fall: **436 PASS, 2 FAIL av 438**. De två felaktiga fallen avsåg förälder och tonåring. En simulering av misslyckad familjeverifiering förblev korrekt spärrad.

## Ändring

Ta bort den föråldrade tidiga `if(inboxPairCheckBusy)`-avvisningen i `prepareActivityMessage()`. Använd i stället den redan implementerade `await recheckInboxPair()`, som delar samma in-flight resultat för aktuell konto-/familjesession.

Användaren får väntestatus medan kontrollen pågår. Endast efter godkänd aktuell familj görs en separat kontrolläsning av serverns JA+JA-matchning för just aktiviteten. Bara om båda kontrollerna lyckas öppnas Inkorgen med ett **oskickat** utkast; meddelandet skickas aldrig automatiskt. Vid okänd/återkallad familj eller om matchningen försvunnit skapas inget utkast.

Ingen ändring i Supabase, server-RPC:er, befintliga användarsvar, meddelanden eller delningsinställningar.

## Testmetod och begränsningar

Ny `tests/activity-invite-shared-pair-check.test.mjs` kör verkliga implementationerna av **både** `recheckInboxPair()` och `prepareActivityMessage()` ur `live-app.js` i en Node VM. Syntetiska parnings-RPC:er kan pausas och slutföras deterministiskt; varje förälder/tonåring har eget fiktivt konto, ingen produktionsauth. Verifierar (1) förälderns klick medan bakgrundskontroll väntar, (2) tonåringens motsvarande klick, (3) ogiltig/ej verifierbar familj som inte får visa utkast eller hämta gemensamma aktiviteter.

Befintligt `tests/activity-invite-pair-recovery.test.mjs` får den nya, avsiktliga semantiken: en redan pågående kontroll är inte ett permanent fel utan något som användarhandlingen väntar på.

**Viktigt:** Node/VM kontrollerar produktionsfunktioner och ordningsföljd under simulerade nätverkssvar. Den ordinarie syntetiska Chromium-sviten och serverad GitHub Pages-kod kontrolleras i CI/publicering. Inget av detta ersätter två verkliga autentiserade testkonton med faktisk Supabase och fysisk Safari, som fortfarande behövs för att klassificera de större FUN-02/03-flödena som helt verifierade.

## Slutlig verifiering 9 november 2026

- **Före fix:** [Röd CI #42547566868](https://github.com/erikjarl/hemmakompassen/actions/runs/42547566868), **436/438 Node PASS**, två fel reproducerade för förälder och tonåring.
- **Första kodrättade körningen:** [CI #42547703100](https://github.com/erikjarl/hemmakompassen/actions/runs/42547703100), **438/438 Node PASS** men Chromium FAIL eftersom äldre test ännu förväntade sig det borttagna avvisningsmeddelandet. Testet ändrades till att vänta på att samma knappklick skapar ett utkast efter parningskontroll; inget ytterligare produktionsfel indikerades av den körningen.
- **Slutlig grön PR-CI:** [#42547988573](https://github.com/erikjarl/hemmakompassen/actions/runs/42547988573), **438/438 Node PASS**, statisk byggkontroll och syntetisk Chromium PASS med **77 skärmbilder** och `visual-audit.json`.
- **Merge:** [PR #245](https://github.com/erikjarl/hemmakompassen/pull/245), commit [`c8860ae`](https://github.com/erikjarl/hemmakompassen/commit/c8860ae6faff47a3336db9f22cee0384f79d956a).
- **Publicerad kod:** [GitHub Pages #42548418511](https://github.com/erikjarl/hemmakompassen/actions/runs/42548418511) och [bytekontroll #42548418977](https://github.com/erikjarl/hemmakompassen/actions/runs/42548418977) godkända. Först serverades äldre `live-app.js` på tre försök under utrullning; därefter matchade **fyra av fyra** kontrollerade filer byte för byte med mergecommitten.

Den syntetiska kontrollen visar relevant användarflöde för båda rollerna i Node och verkligt CTA-klick i Chromium, men **inte** att två riktiga inloggade användare får samma resultat mot aktuell Supabase, eller att fysisk Safari fungerar. FUN-02 och FUN-03 kvarstår som **Pågår**.
