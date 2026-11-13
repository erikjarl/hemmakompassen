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

## Särskilt regressionsfall: förslagsställaren godkänner först

Detta kompletterar huvudflödets steg 1–5. Ett skickat förslag är **inte automatiskt ett eget JA**.

1. Föräldern skapar ett nytt neutralt förslag. Kontrollera att det tydligt framgår att föräldern själv också måste välja **Jag godkänner** och att regeln ännu inte är accepterad.
2. Föräldern väljer **Jag godkänner** en gång. Kontrollera en bekräftad serverskrivning och att UI visar **Du har godkänt – väntar på den andra**. Registrera inte ny röst vid extra klick eller vid att vyn uppdateras.
3. Ladda om förälderns sida helt. Kontrollera att samma ensidiga JA visas och att **Jag godkänner** inte återkommer för just den regelversionen. Kontrollera att **Ta tillbaka mitt ja** är synlig och möjlig att använda, men aktivera den inte i detta scenario.
4. Ladda om tonåringens separata autentiserade session. Kontrollera att tonåringen fortfarande kan godkänna och att regeln inte redovisas som gemensamt accepterad före tonåringens JA.
5. Tonåringen godkänner en gång. Ladda om **båda** sessionerna och kontrollera gemensamt accepterad status, två aktuella JA och frånvaro av upprepad beslutsbegäran.
6. Upprepa med rollerna omvända, så att tonåringen föreslår regeln och godkänner först. Registrera resultat separat för vardera ordningen.

Vid varje steg: skilj **synlig UI-text**, **antal beslutsskrivningar** och **serveråterläst version/status** åt i protokollet. Ett korrekt UI utan kontrollerad serverkvittens räcker inte för att stänga FBK-02-05. Dokumentera testmiljön och resultaten internt utan personuppgifter eller regeltext.

## Verifiera data utan att röja testarnas information

- För varje testregelversion: jämför serverns status med de **aktuella** besluten från båda familjemedlemmarna, utan att klistra in identifierare eller innehåll i ett offentligt ärende.
- Kontrollera att den accepterade versionen har exakt två aktuella JA, att ingen gammal röst räknats för en ny regelversion och att ett upprepat klick inte skapat ett nytt beslutsanrop.
- Vid avvikelse: spara intern felsökningsinformation om nätverksanrop, serverkvittens, tidpunkt och resultat före/efter omladdning i en åtkomstbegränsad plats, aldrig i ett offentligt issue.
- Markera rapporten löst **endast** om verklig reproduktion/verifiering stöder det och testaren kan bekräfta att det observerade felet inte kvarstår. Om felet inte kan reproduceras: dokumentera detta som *inte reproducerat*, inte *bevisat löst*.

## Återupprepbar, läsbaserad datakontroll

Kör följande SQL som enbart använder `SELECT` för en aggregerad lägesbild. Frågan lämnar **inte ut regeltexter, användar-ID, familje-ID eller datum**. Den skiljer lagrad status från verklig UI-beteende; noll avvikelser kan inte bevisa att testaren aldrig behövt godkänna igen.

```sql
WITH counts AS (
  SELECT a.id, a.status,
    count(v.user_id) FILTER (
      WHERE v.agreement_version = a.agreement_version AND v.approved IS TRUE
    ) AS current_yes,
    count(v.user_id) FILTER (
      WHERE v.agreement_version <> a.agreement_version
    ) AS stale_votes,
    count(v.user_id) FILTER (
      WHERE v.user_id NOT IN (a.paired_parent_id, a.paired_teen_id)
    ) AS outside_pair_votes
  FROM public.agreements a
  LEFT JOIN public.agreement_approvals v ON v.agreement_id = a.id
  GROUP BY a.id, a.status, a.agreement_version
)
SELECT status, count(*) AS rules,
  count(*) FILTER (
    WHERE status = 'accepted' AND current_yes <> 2
  ) AS accepted_without_two_yes,
  count(*) FILTER (
    WHERE status = 'proposed' AND current_yes = 2
  ) AS proposed_with_two_yes,
  coalesce(sum(stale_votes), 0) AS stale_version_votes,
  coalesce(sum(outside_pair_votes), 0) AS votes_from_outside_pair
FROM counts
GROUP BY status
ORDER BY status;
```

**Läsbaserad kontroll 13 november 2026:** tre `accepted` (två aktuella JA var), två `proposed` (ett aktuellt JA var), en `rejected`; noll accepterade utan två JA, noll föreslagna med två JA, noll föråldrade röster och noll röster utanför regelns parningssnapshot. En separat aggregerad kontroll av `agreement_approvals` gav nio röster, varav noll saknade giltig regel. Dessa siffror är en ögonblicksbild och kan förändras. För att hitta intermittenta problem behövs autentiserade tester med nätverksspår och serverkvittens.

## Nuvarande automatiserade skydd

`tests/visual.mjs` innehåller redan ett syntetiskt tvårollsflöde för ett godkännande från vardera parten, spärr mot återupprepat JA samt verifiering efter `page.reload` att båda ser den accepterade regeln och saknar nya beslutsknappar. Mobilhierarkin för accepterade regler kontrolleras i både 320 och 390 px. Dessa tester ska behållas; detta protokoll kompletterar dem med ett separat autentiserat end-to-end-test.

**Pass 2026-11-13:** detta är verifieringsplanering, inte utförd autentiserad testning eller bekräftad buggfix. Rapporter och sparade användarsvar har inte ändrats.
