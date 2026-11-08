# FUN-03 – hela livscykeln för en gemensam regel i två simulerade roller

**Datum:** 8 november 2026. **Testmiljö:** riktig UI-navigering och klick i två separata Chromium-kontexter (förälder 390 px, tonåring 320 px), med gemensam deterministisk in-memory-simulering av Supabase/Auth och Schyssta-RPC.

**Testkod:** `verifyPairedRuleRevisionAndHistory()` i `tests/visual.mjs`, rapport `artifacts/fun-03-rule-replacement-history-synthetic.json` i GitHub Actions. **Testet berör inte verkliga användarsvar eller befintliga överenskommelser.**

## Genomförda UI-flöden och kontroller

1. Föräldern skapar ett konkret manuellt regelförslag. Det blir inte automatiskt godkänt; tonåringen och föräldern röstar **ja var för sig** innan första regeln får status `Godkänd av båda`.
2. Från den godkända regeln väljer föräldern `Föreslå ändring`. Formuläret fylls med tidigare formulering, därefter skickas ny text. **Den tidigare regeln förblir accepterad** medan ändringsförslaget är väntande.
3. Tonåringen godkänner ändringsförslaget. Den gamla regeln ligger fortfarande kvar bland godkända regler, och ingen historik skapas innan båda sagt ja till den nya formuleringen.
4. Föräldern godkänner ändringsförslaget separat. Den gemensamma server-simuleringen ersätter då den gamla accepterade regeln med den nya och flyttar den gamla till historiken. Båda rollernas uppdaterade vyer ska visa enbart den nya som aktiv och den gamla i historiken.
5. Tonåringen laddar ner aktuell regellista till textfil. Filen ska innehålla den nya, accepterade formuleringen och **inte den utgångna**.
6. Tonåringen väljer `Avsluta överenskommelsen`, men avbryter först i bekräftelserutan: ingen serverändring tillåts. Vid ett nytt, uttryckligt `Ja, avsluta` försvinner den nya regeln från den aktiva listan och läggs till historiken. Föräldern ser därefter **två tidigare överenskommelser**, inga aktuella och ingen nedladdningsknapp för gamla accepterade regler.

Testet kontrollerar även horisontell dokumentöverströmning vid 320/390 px.

## Metodologiska begränsningar

Backendlogiken för förslagslänkar, dubbelgodkännande, arkivering och historik **är simulerad** i JavaScript-testfixturen. Ett passerande test innebär att gränssnittet hanterar dessa svar på rätt sätt; det **bevisar inte** att riktiga Supabase-RPC:er eller serverns regelrättigheter uppträder identiskt. Verklig Auth, nätverksavbrott, samtidiga skrivningar, samtyckesövergångar och fysisk Safari/iOS måste testas separat. Slutlig teststatus ska hämtas från CI på den senaste PR-committen; anta inte PASS från enbart incheckad testkod.
