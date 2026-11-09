# FUN-03 – tidsgränser för Schyssta listans skrivknappar

**Datum:** 9 november 2026 · **Pull request:** [#256](https://github.com/erikjarl/hemmakompassen/pull/256).

## Funktionellt problem

Fem användarinitierade handlingar i Schyssta listan väntade tidigare utan tidsgräns på ett RPC-svar: skapa eller ändra ett manuellt förslag, skicka ett fördefinierat kortförslag, godkänna/avböja, avsluta en överenskommelse samt markera en regelavisering som läst. Om förfrågan aldrig avslutades förblev `schysstaSubmitting` eller `schysstaSaving` aktiv och användaren saknade ett tydligt sätt att återhämta sig. Detta gäller ett användarflöde och är inte en fristående säkerhetsrevision.

`tests/schyssta-write-timeout.test.mjs` kör de **verkliga produktionsfunktionerna** i ett Node VM-hölje med avsiktligt olösta RPC-promises och injicerad 15-sekundersklocka. Testet täcker **fem handlingar × två syntetiska roller** plus ett återförsök med samma idempotensnyckel. Före kodändringen gav [CI #42565044353](https://github.com/erikjarl/hemmakompassen/actions/runs/42565044353) FAIL i funktions-/kontraktssteget.

## Ändring

En gemensam klientfunktion `schysstaWriteRpc(operation)` ger de fem skrivhandlingarna samma 15-sekunders svarstidsgräns som befintlig listläsning. Timern städas både vid lyckat svar och vid fel. En timeout innebär att **svaret saknas**, inte att servern säkert har avvisat ändringen. Därför används formuleringar om **obekräftad status** och uppmaning att kontrollera aktuell lista.

Vid manuell förslagssändning bevaras text, redigeringsläge och `p_request_key` så ett återförsök med samma text kan utnyttja serverns befintliga idempotensstöd utan att klienten startar en automatisk duplicerad skrivning. Vid godkännande/avböjande rensas den lokalt visade föråldrade listan på fel, som tidigare. Svar som kommer efter klientens timeout kan inte via denna väntande funktion ändra senaste klienttillståndet.

Befintlig kontroll av aktuell familjekoppling före skrivning och separation mellan kontosessioner behålls. Klientens befintliga cacheversionskedja uppdateras så att nya `live-app.js` hämtas på den publicerade sidan.

## Vad testningen faktiskt visar

Testningen provar klientens hantering vid ett uteblivet svar och när ett senare försök får svar, **inte** att servern faktiskt hann skriva eller inte skriva under den okända perioden. Den kör i Node/VM med simulerade föräldra- och tonårskonton. Äldre regressioner för parallella klick, sessionbyte och förlorat svar körs fortsatt. Bygg-, Chromium- och Pages-resultat ska anges separat efter att de passerat.

**Fortfarande inte verifierat:** två verkligt autentiserade konton, faktisk timeout mot Supabase, verklig parning, fysiskt mobilgränssnitt, och faktiska konsekvenser av tidsgränsen i nät med lång latens. Inga befintliga användarsvar eller produktionsdata har ändrats under testningen.
