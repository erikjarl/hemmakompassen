# Hemmakompassen — aktuell utvecklingskö

**Granskad:** söndag 1 november 2026, efter PR #78.  
**Källa:** `main`-historiken 31 oktober–1 november (155 commits inklusive merge-commits), kod och konfiguration i `main`, dokumenterade tester/migrationer samt PR #56–#78.  
**Syfte:** En enda kort, uppdaterad handlingslista för manuellt och schemalagt utvecklingsarbete. `ROADMAP.md` bevarar detaljerna och äldre beslut.

## Statusregler
- **[x] Implementerat och automatiskt testat** = kod på `main`, med verifierat kontrakt/CI. Det betyder **inte** att riktig tvåläsarsession, användbarhet eller klinisk effekt har validerats.
- **[ ] Kräver arbete/verifiering** = kvarstående funktion, integration, uppföljning eller verkligt test. Punkten kan ha fungerande delkod.
- **Avstängt** = kod kan finnas och migrationsfil kan vara installerad, men aktuell feature flag är `false`. Det är inte en aktiv användarfunktion.
- **Historisk text** i den omfattande ROADMAP ska inte läsas som nulägesstatus; dessa uppgifter gäller om de motsäger tidigare anteckningar.

## Genomfört under helgen

### Schyssta listan och inkorg (PR #56–#69)
- [x] Felaktiga eller manipulerade backend-payloads avvisas utan partiell visning (#56).
- [x] Förslags-/röstflöde för A-matchade regelkort med separat aktivt godkännande av båda, samt parningsisolering och backend-kontrakt (#57–#59 samt tidigare grund).
- [x] Manuella förslag från båda rollerna, förfrågningsstatus, ändringsförslag, versionshantering och särskild åtgärdsvy (#59, #61, #65).
- [x] Regelnotiser i inkorgen, oläst/läststatus, startsidesuppmaningar och navigationsmärken (#60, #64–#67).
- [x] Återkallelse, avslut och behörigt arkiv/versionshistorik (#62–#64).
- [x] Sökning, filter, neutral ”Inte nu”, återupptagning, tillgänglighets- och timeoutförbättringar (#66–#67).
- [x] Privata tvåvägsmeddelanden mellan nuvarande familjepar med skilda läskvittenser, historia och serverbaserat säkerhetskontrakt (#68–#69).
- [x] `enableSchysstaList: true` på den interna webbplatsen. Aktuella RPC-migrationer anges som installerade i tidigare ROADMAP; verkligt heltäckande tvåkontotest **inte dokumenterat som klart**.

### Big Five/personlighetstest (PR #70–#78)
- [x] Versionssatt svenskspråkigt IPIP-50 med 50 frågor, omvänd kodning, 5 skalor, egna sparade svar och återupptagning (#71–#73).
- [x] Serverkontrollerad delning **enbart av fem skalpoäng** efter två aktiva samtycken, med möjlighet att återkalla (#72–#73).
- [x] Visuell svarsmarkering och redovisning av amerikanskt vuxenreferensurval, M/SD (#74).
- [x] Fem horisontella jämförelsestaplar i en **linjär uppskattad percentilskala**, med korrekt P50/P75-position och normalmodellbaserade SD-zoner (#75).
- [x] Versionssäker cache-uppdatering så att Safari hämtar den nya profilen (#76).
- [x] Regelstyrda likheter/skillnader med redaktionella gränser och riktade råd (#77).
- [x] Fördjupade, separat skrivna texter för förälder och tonåring, alla fem skalor, vardagsexempel, frågor och relevanta länkar till verkligt existerande funktioner (#78).
- [x] Automatiska poäng-/integritets-/UI-tester och mobilskärmbilder för ovanstående. Frågornas svenska ungdomsvaliditet och referensens generaliserbarhet är **inte** fastställda.

### Tidigare Gillaswajpen-arbete som behöver skiljas från release
- [x] Stabil kortmodell med A (matchning) och B (förståelse), versionssatta ID:n, 34 allmänna kort och omfattande temakortlekar (inklusive **104 Aktiviteter** och **104 Samtalsämnen**); redaktionell riskgranskning dokumenterad.
- [x] Egen svarssparning, återupptagning, defensiv JA+JA-filtrering och automatiska integritetstester finns i koden.
- [x] A-only-servervitlistan och separat B-delning finns dokumenterade som installerade per 30 oktober. Detta är **inte** samma sak som att samtliga delningsvyer är aktiverade eller slutverifierade.
- [ ] `enableSharedPriorities`, `enableSharedPolling`, `enableSharedInsights` och `enableSharedUnderstanding` är fortfarande **false** i `backend-config.js`; kontrollera och aktivera varje del separat **först efter sitt verkliga tvåkontotest**.

## Prioriterad nästa arbetskö

### P0 – riktiga integrations-/samtyckestester
- [ ] **INT-01: Fullt Gillaswajpen-test med två autentiserade testkonton.** JA+JA, NEJ, olika svar, B-delning + återkallelse, alla sju kortlekar, gamla historiska svar, oparad/omparad användare och annan familj. Ändra inte befintliga testsvar. Dokumentera exakta steg, utslag och eventuella blockeringar. Därefter kan relevant feature flag prövas.
- [ ] **INT-02: Schyssta listans fulla tvåkontoflöde.** Båda rollerna: manuellt förslag → separat eget beslut → inkorg och oläststatus → två ja → ändringsförslag → återkallelse → historik → omparning; kontrollera i riktiga servern och i två webbläsarsessioner. Automatisk pgTAP/Playwright är bra grund men ersätter inte detta.
- [ ] **INT-03: Inkorgen med riktiga parade konton.** Skicka/läs i båda riktningar, läskvittenser, paginering, återanslutning, isolering efter avparning, XSS-risken och mobilens skroll/fokus. Utred uttryckligen hantering av meddelanderadering och retention före pilot.
- [ ] **INT-04: Big Five i två riktiga sessioner.** Prova återupptagning, svarsversion, dubbelsamtycke, återkallelse, utloggning/omparning, korrekta rolltexter och samma poäng i tabell/graf. Begränsa testdata och ändra inte tidigare testsvar.

### P1 – funktioner som ännu inte är klara/aktiverade
- [ ] **SW-01: Slutför säker B-förståelsedelning** i UI och backend, inklusive tonåringens separata JA, nej/överhoppning, återkallelse, rollanpassad sammanfattning och kontrollerad aktivering av `enableSharedUnderstanding`.
- [ ] **SW-02: Slutför den gemensamma insiktsytan** för alla kortlekar: endast serververifierat A JA+JA, separat behörig B-information, ”Möjligt att utforska” och ”Så här funkar jag/min tonåring”, korta förskrivna råd och meningsfull prioritering; därefter `enableSharedInsights`.
- [ ] **SW-03: Koppla privat viktighetsskattning (tre lägen)** till faktisk gemensam prioritetsordning för godkända resultat. Behåll integritet och tydlig skillnad mellan individuell prioritet och gemensamt beslut; därefter `enableSharedPriorities`.
- [ ] **SW-04: Validera överhoppning och live-matchningar** över stora kortlekar, inklusive ofullständig kortlek, återbesök, lås-/upplåsningslogik och ändrade kortversioner. Rätta eventuella kvarvarande synkfel innan polling aktiveras.
- [ ] **MI-01: Skriv och implementera separat rollanpassad MI-sida för föräldrar** i Kommunikationsråd, med källor och tydlig gräns mellan lyssnande och manipulation; länka från Schyssta listan.
- [ ] **PF-01: Gör testomgångar versionssäkra.** Ny omtestningssession, datum, aktiv version, historik och självständig radering/export utan att tyst skriva över svar.
- [ ] **PF-02: Fullfölj metodgranskning.** Översättningens begriplighet/validitet för ungdomar, mätinvarians mellan tonåring och vuxen, den amerikanska vuxenreferensens begränsningar samt lämpligheten av normalmodellerade percentiler.
- [ ] **PF-03: Textkvalitet och återkoppling.** Testa råpoängsgränsernas begriplighet, att hypoteser inte uppfattas som diagnoser, textlängd och praktiskt värde från både föräldra- och tonårsperspektiv. Separera sorteringsgränser från psykometrisk säkerhet.
- [ ] **UX-01: Gör slutlig mobil- och tillgänglighetsgenomgång.** Granska den tidigare rapporterade avklippta nedersta menyn, bredder 320/390 px, stora tecken, skärmläsare, tangentbord, fokus, felmeddelanden och scrollbar.
- [ ] **UX-02: Fullfölj ikonbaserad och kortfattad Gillaswajpen-sammanfattning**, inklusive strukturerade råd, prioriterade kort och tillgängliga alternativa texter.
- [ ] **NOT-01: Samla behöriga aviseringar på startsidan** från kortaktiviteter, inkorg, regler och nya resultat utan att avslöja privata svar eller skapa störande påminnelser.

### P1 – AI-medlaren i intern testutveckling (2026-11-01)
- [x] **AI-01A: Driftsatt separat Worker, Workers Free, autentisering, verklig D1-kvot och svensk fiktiv modellprovsvar.** Ingen publik webbplatsmerge.
- [x] **AI-01B: Privat D1-chatt med skapande, lista, historik, radering, serverstyrd ägarisolering och rollstyrt stöd (parent/teen via verifierad RPC).** En ren AI-featurebranch mergades via PR #81 till `main` och chattgränssnittet ingår i webbplatsens källkod; live-test på Pages återstår.
- [x] **AI-01C: Fiktiva databas- och V8-kodkontroller.** 28 automatiserade testfall från GitHub-koden passerade i simulerad körning; verklig D1 bekräftar ägarfilter, kaskadradering och stabil meddelandeordning. CI är ännu inte verifierad.
- [ ] **AI-01D: Verifiera två verkligt autentiserade testkonton, webbläsare/mobil och reella Worker-anrop** innan aktivering på GitHub Pages. Kontrollera även att säkerhetsmeddelanden och konto-/sessionsbyte fungerar som avsett.
- [ ] **AI-01E: Granska barn-/ungdomsskydd, kliniska risker, säkerhet och dataskydd.** Endast fiktiva samtal hittills; enkel riskfrasmatchning är INTE en klinisk säkerhetslösning.
- [ ] **AI-02/03: AI-genererade frivilliga och rollanpassade Gillaswajp-/personlighetssammanfattningar** efter att AI-01 och serververifierat delningssamtycke fungerar.

### P2 – framtida tjänstekvalitet
- [ ] **AI-01: Produktionsklar AI-medlare** återstår trots driftsatt intern testserver och kod för privat chatthistorik. Följ AI-01D/E samt ROADMAP FAS 5; markera inte som färdig före verklig tvåkontotestning och skyddsgranskning.
- [ ] **DATA-01: Datahantering och juridik för pilot.** Radering/export/retention, rättslig grund, information till ungdomar, incidenthantering och eventuell DPIA. Genomför innan externa verkliga användare.
- [ ] **PILOT-01: Genomför verklig användbarhets- och etisk granskning** med föräldrar/ungdomar innan offentlig lansering. Mät förståelse och upplevd press; inga påståenden om behandlingseffekt utan evidens.

## Arbetsregel för följande utvecklingspass
1. Börja med högst prioriterade oavslutade `INT-*` / `SW-*` uppgifter och korrigera dokumenterade blockerare; om autentiserat test blockeras, fortsätt med en kod- eller UX-uppgift som går att genomföra utan extern hjälp.
2. Spara i `ROADMAP.md` eller här: PR/commit, exakta kontroller, vad som är **implementerat**, **verifierat med mock/CI**, **verifierat i verkligt tvåkontoflöde** samt vad som inte är känt.
3. Dra inte slutsatsen att en migrationsfil i GitHub är installerad eller att en flagga är på. Verifiera via rätt källa.
4. Bevara befintliga svar, samtyckeskrav och serveravgränsningen. Publicerad Pages-URL är fortfarande en internetåtkomlig sida, även om projektet är avsett för intern testning.
