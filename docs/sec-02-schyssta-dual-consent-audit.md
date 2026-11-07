# SEC-02 / INT-02 – Schyssta listans manuella regel: två röster och versionssäker återkallelse

**Datum:** 2026-11-07. **Miljö:** Hemmakompassens anslutna Supabase-testdatabas.

## Metod

Det reproducerbara testet i `supabase/tests/sec02_schyssta_manual_lifecycle_rollback.sql` startar en enda databastransaktion (`BEGIN` ... `ROLLBACK`). Det identifierar den existerande förälder–tonåring-parningen och ett utomstående konto utan att lagra deras UUID:n i kod eller dokumentation. De offentligt åtkomliga säkerhetsgranskade `SECURITY DEFINER`-RPC:erna anropas med `SET LOCAL ROLE authenticated` samt *simulerade* `request.jwt.claims`, vilket **inte** är giltig signerad JWT eller ett verkligt webbläsartest.

En ny isolerad regel skapas med RPC:n `propose_manual_schyssta_rule`, testas och dras tillbaka i transaktionen. Endast denna nya, temporära regel får sitt `agreement_version` ändrat administrativt för att simulera att en text revideras. **Inga existerande regler, röster eller användarsvar ändras.** Användarobservationer görs med `my_manual_schyssta_rules()` och `my_schyssta_rule_history()`; skyddade tabeller läses administrativt endast utanför `authenticated`-rollen.

## Positiva och negativa tester

| Fall | Förväntat och observerat |
| --- | --- |
| Ny regel och identiskt försök med samma idempotensnyckel | Samma regel-ID, ingen dubblett |
| Samma nyckel med annan text | Nekas |
| Utomstående röstar eller läser regeln | Nekad röst, inga synliga regelrader |
| Enbart tonåringen röstar JA | Regeln är fortfarande `proposed` |
| Även föräldern röstar JA | Regeln blir `accepted` |
| Regeln får en ny version 2 | Gamla JA-röster från version 1 får inte räknas |
| Endast ett JA på version 2 | Fortfarande `proposed` |
| Andra parten röstar NEJ | Regeln blir `rejected` |
| NEJ ersätts av JA på version 2 | Regeln blir `accepted` |
| Godkänd regel återkallas | Döljs från aktiv lista och syns i historiken |
| Försök att rösta på återkallad regel | Nekas |

**Rapporterat resultat på faktisk Supabase:**

```text
PASS: proposal retry, outsider denied, two YES, new version resets, NO rejects, YES recovers, withdraw archives; full rollback
```

Efter testet visade en separat läsbaserad databasfråga samma grundantal som före: **5** befintliga regler, **5** beslutsrader, **7** notiser, **100** IPIP-svar och **167** swajpsvar. Den tillfälligt skapade regeln och dess beslut lämnades inte kvar.

## Återstående begränsningar

Testet simulerar personidentitet via PostgreSQL. Ingen riktig tvåkontoinloggning, signerad JWT, webbgränssnittet, verkliga samtidiga användaråtgärder, avparning eller omparning testades. Det administrativt simulerade versionsbytet prövar behörighetslogiken för versionsbundna röster, men **inte** hela `propose_schyssta_change`-flödet. Notisernas innehåll och omedelbara synk i två sessioner återstår också.

Testet är därmed en **P0-backendregression** – inte att INT-02 kan markeras helt färdig.
