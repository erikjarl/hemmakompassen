# FBK-02-05 – verifiering av sparade regelgodkännanden med två konton

**Status:** öppen verifieringsuppgift · **Senast granskad:** 2026-11-13 · **Prioritet:** P1

## Vad rapporten gäller

En testare upplevde att samma regel behövde godkännas flera gånger. Det önskade resultatet är att ett bekräftat godkännande sparas, att redan gemensamt godkända regler visas först, och att redigering finns bakom regelns utfällbara detaljer.

**Viktigt:** Tidigare regressionstester använder en syntetisk gemensam RPC-fixtur. De visar att klienten kan hantera godkännanden och omladdning korrekt med den fixturen, men verifierar inte faktiska inloggningssessioner, nätverksfel, RLS eller verkligt sparade rader. Lämna ärendet öppet tills felet reproducerats och åtgärden bekräftats med de två testkontona.

## Förberedelser

1. Kör mot avsedd intern testmiljö. Kontrollera exakt Pages-version/commit som serveras innan försöket; rapportera `ej verifierat` om versionen inte kan styrkas.
2. Logga in i två skilda, faktiskt autentiserade webbläsarsessioner: ett föräldrakonto och ett tonårskonto i samma verifierade familj. Använd separata profiler eller privata fönster så att sessioner inte blandas.
3. Välj en **ny neutral testregel**. Ändra inte användarnas befintliga regler, svar eller samtycken. Testkontonas nya regel får endast skapas inom överenskommen testning; annars stoppa före skrivsteget.
4. Anteckna browser/version, tid, användarroll, skärmbredd och aktuell commit. Skriv inte namn, mejl, identifierare eller regeltext i offentliga GitHub-rapporter.

## Teststeg och förväntat resultat

| Steg | Handling | Förväntat resultat |
| --- | --- | --- |
| 1 | Förälder föreslår en neutral ny regel. | Regeln visas som förslag och är **inte** gemensamt godkänd. |
| 2 | Tonåring öppnar Schyssta listan och godkänner. | Ett bekräftat JA sparas. Regeln väntar fortfarande på den andra personens godkännande. |
| 3 | Tonåring laddar om sidan, går till annan modul och tillbaka. | Det redan sparade JA:et finns kvar; inga nya godkännandeknappar visas för samma person och regelversion. |
| 4 | Förälder godkänner samma oförändrade version. | Regeln flyttas till godkända överenskommelser först **efter två aktuella JA**. |
| 5 | Båda laddar om, växlar modul och öppnar sidan igen. | Godkänd regel ligger i den avskalade listan överst, utan ny godkännandeförfrågan till någon av dem. |
| 6 | Båda öppnar och stänger regelns detaljer med tangentbord och pekskärm. | Redaktionella alternativ visas först när detaljerna öppnas; regelns godkännandestatus ändras inte. |
| 7 | Om testmiljön tillåter: simulera ett enskilt nätverksavbrott före serverkvittens på en **annan** neutral testregel. | UI får inte påstå att ett okvitterat JA är säkert sparat. Vid återanslutning ska aktuell serverstatus visas och användaren få en tydlig handlingsväg. |
| 8 | Kontrollera originalregeln efter eventuellt ändringsförslag. | Den ursprungliga accepterade regeln ska fortsatt gälla tills eventuell ersättning fått två aktuella JA. |

## Verifiera data utan att röja testarnas information

- För varje testregelversion: jämför serverns status med de **aktuella** besluten från båda familjemedlemmarna, utan att klistra in identifierare eller innehåll i ett offentligt ärende.
- Kontrollera att den accepterade versionen har exakt två aktuella JA, att ingen gammal röst räknats för en ny regelversion och att ett upprepat klick inte skapat ett nytt beslutsanrop.
- Vid avvikelse: spara intern felsökningsinformation om nätverksanrop, serverkvittens, tidpunkt och resultat före/efter omladdning i en åtkomstbegränsad plats, aldrig i ett offentligt issue.
- Markera rapporten löst **endast** om verklig reproduktion/verifiering stöder det och testaren kan bekräfta att det observerade felet inte kvarstår. Om felet inte kan reproduceras: dokumentera detta som *inte reproducerat*, inte *bevisat löst*.

## Nuvarande automatiserade skydd

`tests/visual.mjs` innehåller redan ett syntetiskt tvårollsflöde för ett godkännande från vardera parten, spärr mot återupprepat JA samt verifiering efter `page.reload` att båda ser den accepterade regeln och saknar nya beslutsknappar. Mobilhierarkin för accepterade regler kontrolleras i både 320 och 390 px. Dessa tester ska behållas; detta protokoll kompletterar dem med ett separat autentiserat end-to-end-test.

**Pass 2026-11-13:** detta är verifieringsplanering, inte utförd autentiserad testning eller bekräftad buggfix. Rapporter och sparade användarsvar har inte ändrats.
