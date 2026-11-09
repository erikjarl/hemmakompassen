# FUN-04 – timeout och återhämtning i privata IPIP-50-omtest

**Datum:** 9 november 2026. **PR:** [#263](https://github.com/erikjarl/hemmakompassen/pull/263). **Filer:** `personality/ipip50-retest.js`, `personality/ipip50-ui.js`, `tests/ipip50-retest-timeout.test.mjs`.

## Reproducerat funktionsproblem

Första IPIP-50-testet hade redan en begränsad väntetid, men separata nätverksanrop i **privat omtest** kunde fortsätta vänta obegränsat. Sju nya regressionstestfall med obesvarade syntetiska Supabase-Promises misslyckades därför före fix. [Röd Node-baslinje #42578476877](https://github.com/erikjarl/hemmakompassen/actions/runs/42578476877): **504 godkända, sju underkända av 511**. De tidigare funktionstesterna påverkades inte.

De reproducerade flödena:

1. Läsa den privata omtestningshistoriken – obegränsad `Hämtar privata omtest…`.
2. Läsa privata svar i ett påbörjat omtest – samma fastlåsning.
3. Spara ett svar där både skrivkvittens och efterföljande kontrolläsning saknas – `Sparar ditt privata svar…` utan slut.
4. Starta en ny omgång när dess skapandekvittens aldrig kommer – `Startar en ny privat omgång…` utan slut.
5. Avsluta 50 besvarade frågor när både uppdateringskvittens och återläsning uteblir.
6. Radera en omgång när kvittens och återläsning uteblir – **inget automatiskt nytt DELETE**.
7. Exportera en omgång när den nödvändiga serverläsningen hänger – inget föråldrat nedladdningsunderlag.

## Korrigering och verifierbar återhämtning

En gemensam **15-sekundersgräns per Supabase-anrop** används nu inom omtestmodulen. Den omfattar läsning av omgångar och svar samt skrivning, start, slutförande och radering inklusive deras befintliga kontrolläsningsvägar. Eftersom en operation kan ha både ett skrivförsök och en efterföljande kontrolläsning kan dess totala varaktighet överstiga 15 sekunder; varje enskilt anrop har en gräns.

- Vid läsfel visas **Försök igen** och en ny serverläsning krävs.
- Vid osäkert svarssparande visas **Kontrollera sparat svar**. Frågan flyttas inte vidare på obekräftad skrivning; ingen dubbelpost görs automatiskt.
- Vid osäker start, avslutning eller radering följs existerande kontrollflöden för användarstyrd verifiering. Inget omtest får felaktigt deklareras som startat, avslutat eller raderat enbart på grund av en nätverkstimeout.
- Historik-/exportläsningar som saknar svar avbryter åtgärden med synligt fel utan att nedladdning skapas.
- Första testets och omtestets tidsgränser samordnas via `createPersonalityExperience()`, och cachekedjan har versionsnumret `20261109-private-retest-deadline1`.

## Testnivå och kvarstående osäkerhet

`tests/ipip50-retest-timeout.test.mjs` simulerar obesvarade anrop med privat, kontrollerad minnesdata och kontrollerar även syntetiska förälder-/tonårsroller, återhämtning utan dubbelskrivning och synlig osäkerhetsstatus. Den existerande större Node-/Chromiumsviten kontrollerar angränsande omtestflöden, däribland 50-frågeomtest och två separata rollsessioner.

Detta **bevisar inte** verkliga Supabase-avbrott, autentiserat beteende mellan två riktiga konton, fysisk Safari/iPhone eller klinisk giltighet. Inga riktiga användarsvar eller databasinställningar har ändrats. Samtliga P0-punkter FUN-00–FUN-06 har fortfarande krav på verkliga användarflöden innan de kan betraktas som fullständigt verifierade.
