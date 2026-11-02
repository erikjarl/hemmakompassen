# AI-reflektioner – verifieringsprotokoll för två interna testkonton

**Startläge (2 november 2026):** Workern är distribuerad och AI-resultatflaggan aktiverad genom PR #85–86. Automatisk CI och Supabase-funktionernas signaturer har kontrollerats. Inga JWT-inloggade tvåkontotester har ännu genomförts i det här protokollet. Använd **enbart fiktiva testuppgifter**.

## Test 1: Big Five – egen profil

- [ ] Logga in som **Tobbetonåring**. Välj *Min personlighet*. Bekräfta att inte halvfärdiga resultat skickas till AI.
- [ ] Slutför de 50 frågorna. På samma resultatsida ska **AI:n analyserar resultatet…** visas innan en AI-genererad, rollanpassad reflektion.
- [ ] Reflektionen ska återge just fem skalfaktorer, utan diagnoser, statistiskt påhittade normer, enskilda frågesvar eller kategoriska slutsatser.
- [ ] Vid tillfälligt fel/kvottak ska felstatus visas och inte ersättas med en fabricated sammanfattning. Knappen *Generera ny reflektion* ska bara finnas vid lämpligt läge.
- [ ] Ändra ett svar. När profilen är komplett igen ska gammal AI-text inte stå kvar som om den beskrev nya poäng.

## Test 2: Frivillig dubbeldelning

- [ ] Kontrollera med båda kontona att partnerprofilen **inte** nämns utan bådas aktiva samtycke.
- [ ] Aktivera delning från båda kontona. Verifiera att en förälders AI-analys får se endast ungdomens **fem sammanlagda** poäng, inte individuella item.
- [ ] Jämför samma uppgifter mellan rollerna. Texten ska vara validerande och konstruktiv men lägga större ansvar för trygghet och relation på föräldern.
- [ ] Återkalla delning från ena kontot. Ladda om resultatet med den andra; en **ny AI-generering** ska utesluta partners profil. Kontrollera både i UI och, om tillgängligt, Worker-responsen utan att logga verkliga svar.
- [ ] Byt konto eller ta bort familjeparningen. Se till att tidigare AI-text inte läcker till den nya inloggade användaren.

## Test 3: Gillaswajpen – A JA+JA

- [ ] Svara JA på ett fiktivt matchningskort med båda kontona och kontrollera att AI-reflektionen skapas automatiskt när säkra gemensamma resultat hämtas.
- [ ] Låt bara ena kontot svara JA på nästa kort; det kortet får inte förekomma i den andras AI-reflektion.
- [ ] Svara NEJ eller välj *Vill inte svara just nu* (förståelsekort); inga dessa uppgifter får omtolkas till ömsesidig matchning.
- [ ] Jämför förälder- och tonåringstext för samma JA+JA; AI:n får inte hitta på relationskonflikter utifrån en gemensam aktivitet.
- [ ] Byt kortlek, uppdatera matchningar och kontrollera att eventuella tidigare reflektioner inte presenteras under fel kortlek.

## Test 4: Förståelsekort (B) – ännu inte aktiverade

- [ ] Bekräfta att inga B-kort går till AI med nuvarande standardflaggor.
- [ ] Innan separat aktivering: testa uttryckligt tonåringssamtycke, återkallelse, parbyte och förälders begränsade läsrätt i databasen. Det räcker **inte** att ett B-svar är JA.
- [ ] Godkänn sedan separat, om säkerhets- och klinisk granskning passerat, båda feature flaggorna i klient och Worker.

## Test 5: Kvot, integritet och återhämtning

- [ ] Kontrollera att AI-medlarens och resultatanalysernas anrop **delar** samma kvot, och att slut på kvot ger begriplig information i båda vyerna.
- [ ] Kontrollera att utloggning och byte av användare rensar eventuell lokal AI-text och att en fördröjd serverrespons inte kan visas i en annan sessions vy.
- [ ] Kontrollera att otillåten användare får 403 och att ogiltig token får 401; en browser ska aldrig kunna skicka egna poäng/kortsvar som AI:n använder.
- [ ] Läs AI-texter för flera fiktiva fall med svensk förälder/tonåring och dokumentera faktafel, överdrifter, skuldbeläggning av tonåring, hallucinerade motiv och praktisk användbarhet.

## Bevis och avslut

För varje test: skriv datum, aktuell git-commit, anonym testroll, förväntat/observerat resultat och kort felbeskrivning i GitHub-issue eller detta protokoll. Lägg **aldrig** in privata testsvar, JWT eller meddelanden i issues, skärmbilder eller loggar. Kryssa enbart av ett test efter att det faktiskt genomförts.

**Automatiserade tester är redan gröna. Alla ovanstående manuella steg är uttryckligen oavklarade.**
