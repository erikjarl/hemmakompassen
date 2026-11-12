# FBK-02-05 – granskning av upprepade godkännanden, 2026-11-12

**Status:** Fortfarande öppen. **Kontrollnivå:** läsbaserad SQL mot ansluten Supabase, inte autentiserad dubbelkontoreproduktion eller UI-test. **Relaterat:** `docs/ACTIVE_ROADMAP.md`, `AGENTS.md`.

## Frågeställning

En testare upplever att samma regel måste godkännas upprepade gånger. Avgränsa om sparade beslut för aktuell regelversion är inkonsekventa innan klientens cache, notifieringar och UI-förflyttning felsöks. Ingen fri regeltext, användar-ID eller familjeidentifierare redovisas här.

## Faktisk kontroll 2026-11-12

Mot `public.agreements` och `public.agreement_approvals` kördes endast aggregerad `SELECT`:

| Regelstatus | Antal regler | Två ja på aktuell version | Ett ja på aktuell version | Noll ja | Äldre versionsbeslut |
| --- | ---: | ---: | ---: | ---: | ---: |
| accepted | 3 | 3 | 0 | 0 | 0 |
| proposed | 2 | 0 | 2 | 0 | 0 |
| rejected | 1 | 0 | 0 | 1 | 0 |

Denna ögonblicksbild visar ingen accepterad regel som saknar två ja-beslut för aktuell version. Den kan **varken verifiera eller motbevisa** tidigare upprepade knapptryckningar, sena RPC-svar, klientcache, versionsbyten, dubbletter av innehåll eller återkommande aviseringar. Att en regel har ett enda ja är förväntat för ett ännu obesvarat förslag.

### Återanvändbar läsbaserad kontroll

```sql
WITH decisions AS (
  SELECT
    a.id,
    a.status,
    a.agreement_version,
    count(*) FILTER (
      WHERE ap.agreement_version = a.agreement_version
        AND ap.approved IS TRUE
    ) AS yes_count,
    count(*) FILTER (
      WHERE ap.agreement_version = a.agreement_version
        AND ap.approved IS FALSE
    ) AS no_count,
    count(*) FILTER (
      WHERE ap.agreement_version <> a.agreement_version
    ) AS stale_count
  FROM public.agreements a
  LEFT JOIN public.agreement_approvals ap
    ON ap.agreement_id = a.id
  GROUP BY a.id, a.status, a.agreement_version
)
SELECT
  status,
  count(*) AS n,
  count(*) FILTER (WHERE yes_count = 2) AS with_two_yes,
  count(*) FILTER (WHERE yes_count = 1) AS with_one_yes,
  count(*) FILTER (WHERE yes_count = 0) AS with_zero_yes,
  sum(stale_count) AS stale_version_decisions
FROM decisions
GROUP BY status
ORDER BY status;
```

## Nästa reproducerbara kontroller (inte utförda)

1. Använd två faktiskt autentiserade testkonton i separata sessioner och en uttryckligen avsedd testregel; ändra inte befintliga regler/svar enbart för felsökning.
2. Dokumentera regelversion, båda parters registrerade beslut och serverrespons **före** klick. Redovisa inga personuppgifter i offentliga artefakter.
3. Godkänn en gång, låt den pågående förfrågan slutföras och kontrollera att knappen spärras under skrivningen. Uppdatera vyn och logga in på nytt.
4. Jämför serverns aktuella version/beslut med klientens `Behöver ditt svar`, `Våra överenskommelser` och inkorgens aviseringar. En accepterad regel ska inte presenteras som nytt obesvarat godkännande.
5. Upprepa vid långsam nätverksrespons och dubbelklick. Kontrollera separat om ett ändringsförslag skapar en **ny version** och därmed legitimt kräver ett nytt beslut.
6. Kontrollera fysisk Safari/mobil. Redovisa tidpunkt, testmiljö, observerat utfall och PASS/FAIL/BLOCKERAD för varje scenario.

**Beslut:** Behåll FBK-02-05 `reviewing`. Ingen lagringsbugg är bevisad eller avfärdad av denna aggregerade kontroll. Ingen rapportstatus, regel, beslutsrad eller användarsvar ändrades.
