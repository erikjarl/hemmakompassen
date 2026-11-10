# FBK-02-05 – verkligt återtest av Schyssta listans godkännande

**Status:** testprotokoll; **inte** ett genomfört tvåkontotest. Gäller `index.html#regler` för förälder och tonåring. Följ [ACTIVE_ROADMAP](ACTIVE_ROADMAP.md), rapporten FBK-02-05 och projektets instruktioner i `AGENTS.md`.

## Syfte och förutsättningar

Avgör om en användares godkännande (1) verkligen sparas, (2) visas korrekt efter omladdning och sidbyte och (3) aldrig krävs igen för **samma oförändrade regelversion**. Testa separat att en **ändrad** regel kräver ett nytt beslut: det är förväntat beteende, inte nödvändigtvis en bugg.

Använd två inloggade, faktiskt parade testsessioner (förälder + tonåring), gärna två separata webbläsarprofiler. Ändra **inte** befintliga användarsvar, godkännanden eller överenskommelser utan särskild testöverenskommelse. För ett skrivande test: skapa först en ny, tydligt märkt tillfällig testregel efter godkännande från projektägaren. Undvik att återanvända verkliga överenskommelser.

## Reproduktion – fyll i faktiskt resultat för varje steg

| Steg | Handling | Förväntat resultat | Verkligt resultat / bevis |
| --- | --- | --- | --- |
| 1 | Öppna Schyssta listan på båda kontona, registrera om regeln är ny, föreslagen, godkänd eller avvisad. | Samma verkliga regelversion och rimlig beslutstatus i båda sessionerna. | Ej kört |
| 2 | Godkänn **en gång** med kontot som har ett väntande beslut. Avvakta serverbekräftelse. | Eget JA markeras; först när båda har godkänt visas regeln som gemensam överenskommelse. | Ej kört |
| 3 | Gå till annan modul och återvänd i båda sessionerna. | Ingen ny prompt för samma godkända version. | Ej kört |
| 4 | Ladda om webbsidan och logga in på nytt om nödvändigt. | Godkännandet är kvar utan nytt klick. | Ej kört |
| 5 | Expandera den godkända regeln och granska alternativ. | Kortfattad huvudlista med tydlig utfällningspil; ändra/avsluta syns först i expanderat läge. | Ej kört |
| 6 | Endast med tillstånd: skapa ett separat ändringsförslag till **testregeln**. | Ny version begär nya beslut och tidigare JA på föregående version räknas inte automatiskt som nya JA. | Ej kört |
| 7 | Upprepa steg 1–5 på fysisk mobil/Safari vid 320–390 CSS-px, med båda rollerna. | Inga avklippta knappar, dolda överenskommelser eller svårfunna väntande beslut. | Ej kört |

Ange datum, testmiljö, roll, sidans tillstånd, reproduktionssteg och gärna avidentifierad skärmbild för eventuellt fel. För inte in råa privata rapporter, personidentifierare, regeltexter eller skärmbilder med privata svar i publika GitHub-dokument.

## Läsbaserad serverkontroll (Supabase SQL Editor)

Denna fråga ger bara **aggregerade antal**. Den skriver ingenting och visar inga privata regeltexter eller användar-ID:n:

```sql
SELECT a.status,
       COUNT(DISTINCT a.id) AS regler,
       COUNT(ap.user_id) FILTER (
         WHERE ap.agreement_version = a.agreement_version
           AND ap.approved IS TRUE
       ) AS aktuella_ja,
       COUNT(ap.user_id) FILTER (
         WHERE ap.agreement_version <> a.agreement_version
       ) AS gamla_roster
FROM public.agreements AS a
LEFT JOIN public.agreement_approvals AS ap
  ON ap.agreement_id = a.id
GROUP BY a.status
ORDER BY a.status;
```

**Läsbaserad kontroll 2026-11-10:** `accepted`: 3 regler/6 aktuella JA; `proposed`: 2 regler/2 aktuella JA; `rejected`: 1 regel/0 aktuella JA; 0 gamla röster i samtliga grupper. Detta visar endast databasens läge vid förfrågan, **inte** att klientens godkännandeflöde fungerar i alla situationer.

## Stängningsvillkor

- Dokumentera både faktisk klientobservation i **två inloggade roller** och serverbekräftelse av samma oförändrade regelversion.
- Retesta efter sidbyte/refresh och efter en uttryckligen tillåten versionsändring.
- Granska kompaktlista/utfällning på dator och fysisk mobil.
- Markera FBK-02-05 `resolved` i Supabase **först när** relevanta scenarier har gått igenom; annars behåll `reviewing` och beskriv exakt blockerande lucka.
