# Hemmakompassen – aktiv roadmap

**Senast prioriterad:** 7 november 2026 · **Gäller för:** internt testprojekt med två testkonton · **Ansvarig arbetsrutin:** [AGENTS.md](../AGENTS.md)

Detta är **den enda prioriterade arbetskön** för nya `Jobb hk`-pass. Tidigare långa [ROADMAP.md](../ROADMAP.md) och [CURRENT_TASKS.md](CURRENT_TASKS.md) är historik, beslut och verifieringslogg – inte parallella öppna checklistor. Uppdatera alltid denna fil när status förändras; länka sedan till PR, commit, CI eller verkligt test. Öppna äldre punkter flyttas hit **bara om de fortfarande kräver en konkret åtgärd**.

## Statussystem

- **Inte påbörjad** – uppgiften saknar verifierad implementation.
- **Pågår** – konkret arbete eller tester påbörjade men utan färdig verifierad leverans.
- **Implementerad men ej verifierad** – kod finns på `main`/i testmiljön, men minst ett väsentligt funktions-, integritets- eller autentiserat test saknas. Ange alltid *vad* som faktiskt är testat.
- **Färdig och verifierad** – samtliga specificerade acceptanskriterier uppfyllda och styrkta med relevant bevis; grön mock-CI ensam räcker inte när två autentiserade sessioner krävs.

**Två nivåer av verifiering måste skiljas åt:** (a) kod/Node/pgTAP/syntetisk Chromium/Pages och (b) riktiga autentiserade testkonton, faktisk Supabase/Worker samt fysisk mobil. Skriv inte `färdig` för en b-beroende uppgift med enbart a-bevis.

## P0 – första prioritet: autentisering, säker delning och end-to-end

| ID | Konkreta acceptanskriterier | Status | Nästa steg / verifieringslucka |
| --- | --- | --- | --- |
| **INT-01 – Gillaswajpen** | Två riktiga inloggningar: JA+JA och privat NEJ/olika/ensidiga svar, alla kortlekar, B-delning/återkallelse, omparning, andra familjer; gamla testsvar bevaras | **Implementerad men ej verifierad** | Genomför läsbaserade tvåkontotester; använd separata nya syntetiska testkort bara efter kontroll av att inga gamla svar påverkas |
| **INT-02 – Schyssta listan** | Förälder↔tonåring: eget förslag, två separata ja, inkorg, ändring, avslag/Inte nu, återkallelse, versioner, historik, parbyte, isolering | **Implementerad men ej verifierad** | Två inloggade roller och negativa testfall; kontrollera förslagets versionsbundna samtycke |
| **INT-03 – Inkorgen och notiser** | Verkliga privata meddelanden i båda riktningar, kvitton, paginering, fel, avparning, kontobyte, notifieringars återkallelse samt ingen läcka mellan familjer | **Implementerad men ej verifierad** | Tester med två riktiga konton; planera retention/radering som separat DATA-01 |
| **INT-04 – IPIP-50** | Egen fullständig testomgång, återupptagning, dubbelsamtycke, enbart delade fem skalor, återkallelse, omparning, stabil graf | **Implementerad men ej verifierad** | Två autentiserade sessioner; ändra inte äldre enkätsvar |
| **SEC-02 – Supabase/Worker** | Granska exponerade RPC/SECURITY DEFINER, RLS, JWT-behörighet, negativt test mot annan familj och upphävt samtycke | **Pågår** | 7/11: live read-only katalogprov 0 saknade RLS, 0 anon-körbara privilegierade publika RPC, 0 policyfria SELECT-grants; två syntetiska okända identiteter fick 0 rader i åtta ägarstyrda tabeller. Se `docs/sec-02-live-readonly-audit.md`. Återstår: granska kroppar i 30 autentiserat anropbara SECURITY DEFINER-funktioner samt riktiga tvåkontotester/återkallelse; ändra aldrig breda policies bara för att tysta lintervarningar. |

**Regel:** Om tvåkontotestet faktiskt är blockerat av saknad behörig inloggningssession eller miljö, dokumentera exakt hindret och gå omedelbart till nästa självständigt genomförbara punkt (P1), inte ytterligare enbart liten notisfix utan prioriteringsskäl.

## P1 – konkret funktionsutveckling, efter/bredvid P0

| ID | Konkreta acceptanskriterier | Status | Nästa steg |
| --- | --- | --- | --- |
| **SW-03 – Gemensam prioritering** | Privata trelägesskattningar kan påverka översikt **endast efter giltig, separat delning**; tydlig individuell/gemensam skillnad; omparning och återkallelse fungerar | **Pågår** | Granska nuvarande SQL/UI; fullfölj anslutning och negativa tester. `enableSharedPriorities:false` tills behörighet verifierad |
| **SW-01/02/04 – Insikter och kortlekar** | B-delning frivillig och återkallelig; gemensamma A-resultat är strikt JA+JA; sammanfattningar korta och rollanpassade; stora/halvfärdiga lekar och överhoppade kort fungerar | **Implementerad men ej verifierad** | Prioritera faktiska synkfel och tillgänglig sammanfattning; `enableSharedPolling:false` tills testad |
| **SL-02/08/21 – Schyssta listans livscykel** | Versionssäker tillståndsmodell, tydliga kvittenser, negativa regressionsfall och äkta tvåkontoflöde | **Pågår** | Inventera vilka delar som redan är kodade, gör endast återstående gap och hänvisa till INT-02 |
| **PF-01 – Omtestning och datahantering** | Ny versionssatt IPIP-testomgång utan att skriva över tidigare svar; historik och säker export/radering | **Pågår** | Kartlägg datamodell, ta fram säker migrationsplan och implementera i teststeg |
| **UX-01/02 – Mobil och sammanfattningar** | 320/390px, stora tecken, fokus, tangentbord, VoiceOver, ikon- och textalternativ | **Implementerad men ej verifierad** | 7/11: verkliga Chromium-PNG visar för stor logotyp och brutet kontolänkstext vid 320px; ny header-CSS och test införs via PR. Fysisk iOS/VoiceOver kvarstår. |
| **NOT-01 – Samlad notisupplevelse** | Relevanta, behöriga händelser från aktiviteter, regler, inkorg och resultat utan privata detaljer eller påträngande påminnelser | **Pågår** | Granska faktiskt täckta händelser; ändra inte redan säker notiskod utan motiverad lucka |
| **KOM-01/05 – Kommunikationsstöd** | Begripligt NVC/MI/övningar, rätt föräldra-/tonårsroll, säkra korslänkar, trygghetsstöd vid hot/kontroll | **Implementerad men ej verifierad** | Manuell roll-, språk-, käll- och mobilgranskning |

## P2 – AI-kvalitet, metod och pilotberedskap

| ID | Konkreta acceptanskriterier | Status | Nästa steg |
| --- | --- | --- | --- |
| **AI-01/02/03** | Verkliga tvåkontosamtal, korrekt AI-kontext och opt-out, samtyckesåterkallelse, kvot, trygga svar och relevanta kommunikationslänkar | **Implementerad men ej verifierad** | Testa verklig Worker med behöriga testkonton; granska faktisk modelltext och ungdomsrisker |
| **PF-02/03 – Psykometri** | Kritiskt granskad svensk IPIP-översättning, ungdomsbegriplighet, jämförbarhet med vuxna, referensens representativitet och textkvalitet | **Pågår** | Dokumentera evidens, osäkerhet, begränsningar; undvik kliniska percentil-/diagnosanspråk |
| **DATA-01 – Data och GDPR** | Datakarta, retention, komplett radering/export, rättslig grund, information till minderåriga, incident-/biträdeshantering och eventuell DPIA | **Pågår** | Teknisk inventering nu; juridisk slutgranskning före externa användare |
| **PILOT-01 – Etik och användbarhet** | Ungdoms-/föräldratest av begriplighet och press, riskgranskning, faktisk tillgänglighet, avgränsad pilotplan | **Inte påbörjad** | Planera när teknisk P0 är klar; inga ogrundade påståenden om klinisk effekt |

## Senast verifierad teknisk baslinje

- **7 november 2026, SEC-02:** Read-only körning mot faktisk Supabase: 3 katalogkontroller = 0 anmärkningar; 2 syntetiska ej registrerade identiteter = 0 läsbara poster i 8 RLS-skyddade tabeller och 7 delade RPC. Detta bevisar INTE verklig tvåkontoflöde eller att samtliga RPC-kroppar är säkra.
- **7 november 2026, PR #133:** förbättrat skydd mot gammalt notissvar vid byte till nytt familjepar; Node/Chromium godkända ([PR](https://github.com/erikjarl/hemmakompassen/pull/133)). Rapporterad senaste Pages-/filkontroll och UI-körning efter merge godkänd för `9c88e31`.
- **PR #132:** automatiskt HTTP/byte-prov för tre serverade GitHub Pages-filer fungerar ([PR](https://github.com/erikjarl/hemmakompassen/pull/132)); detta är inte ett tvåkontotest.
- **Backend:** serververifierad A JA+JA och explicit B-samtycke finns dokumenterat som installerade; kontrollera aktuell databas innan nya påståenden.
- **Intern testmiljö:** inga externa familjeanvändare enligt projektägaren; den publicerade URL:en är ändå internetåtkomlig. Ändra inte sparade svar och håll privat/delad data isär.

## Uppdateringsregel för varje `Jobb hk`

1. Läs **denna fil först** och `AGENTS.md`; kontrollera `main`, öppna PR och verifierade blockerare. Läs historisk roadmap enbart för detaljer.
2. Välj **högsta genomförbara prioritet**: P0-test med äkta konton om möjligt; annars självständigt P1-arbete. Genomför så många sammanhängande, konkreta deluppgifter som verktygen medger.
3. Uppdatera status per ID. För varje leverans: exakt PR/commit, CI/Pages/Worker/Supabase och vilken testnivå som faktiskt uppnåtts. Kryssa inte av utifrån plan eller green CI när verklig verifiering saknas.
4. Skapa inte parallella aktiva checklistor i historiska filer. Vid större beslut hänvisa hit och lägg en kort historisk notering. Färdig funktion flyttas till avsnittet baslinje eller versionshistorik.
5. Behåll uttryckligt fullmakt för PR, commit, merge och publicering enligt `AGENTS.md`; respektera skydd mot dataläckage och användarnas tidigare svar.
