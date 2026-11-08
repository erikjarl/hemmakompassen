# INT-02 / SEC-02 – kortleksreglers röster måste vara versionsbundna

**Datum:** 8 november 2026. **Databas:** ansluten Supabase `bwrcgrbbpumyjfvznlbf`.

## Fynd och faktisk reproduktion

`public.my_schyssta_rules()` (Regler från kortleken) gjorde tre JOIN-anrop mot `agreement_approvals` utan att kräva att `agreement_version` överensstämde med regelns aktuella version. Den manuella motsvarigheten `my_manual_schyssta_rules()` hade redan versionsvillkor.

Med en **ny tillfällig** kortleksregel och två autentiserade SQL-roller med simulerade `request.jwt.claims` bekräftades följande före korrigering: förälder och tonåring röstade Ja på version 1; när endast denna temporära regel ändrades till version 2 (status `proposed`), visade `my_schyssta_rules()` fortfarande **`accepted`, Ja och Ja**. Reproduktionens databasfel var:

```text
Stale version 1 votes visible ...: accepted,t,t,t
```

Identiteten i felmeddelandet har utelämnats här. **En gammal röst ska inte gälla efter ett versionsbyte.** Det är ett faktisk återskapat fel i RPC:ns beräknade läsresultat; det innebär inte att ett felaktigt accepterande har observerats med de två inloggade testkontona i webbgränssnittet.

## Åtgärd

Installerad Supabase-migration **`20261108022001_schyssta_card_versioned_votes`** i [migrationsfilen](../supabase/migrations/20261108022001_schyssta_card_versioned_votes.sql). Alla tre röst-JOIN (`own_vote`, `parent_vote`, `teen_vote`) kräver numera samma `agreement_version` som aktuell `agreements`-rad.

Den befintliga RPC-signaturen, `SECURITY DEFINER`, tomma `search_path`, behörighetskrav, familjeisolering, parningsepok, sorteringsordning och svarsfält behölls. Inga befintliga avtal eller röster ändrades av migrationen.

## Verifiering

[Rollback-SQL](../supabase/tests/sec02_schyssta_card_version_rollback.sql) kördes **före** och **efter** migrationen mot ansluten Supabase.

- **Före:** testet misslyckades på den reproducerade gamla Ja+Ja-statusen från version 1.
- **Efter:** `PASS: Schyssta card votes scoped to active version in both roles; temporary data rolled back`.
- Testet skapar enbart en ny temporär regel, testar Ja+Ja på version 1, simulerar ett versionsbyte enbart på denna regel, granskar tomma röster/`proposed` för både förälder och tonåring, testar ett nytt Ja och därefter ett aktuellt Nej/`rejected` på version 2. Allt körs inom `BEGIN … ROLLBACK`, så den tillfälliga regeln och dess röster lämnas inte kvar.
- Node-kontraktet `tests/schyssta-card-versioned-votes.test.mjs` kontrollerar aktiv version i alla tre JOIN och bibehållen familje-/epokisolering.

**Begränsning:** SQL-identiteter simuleras med `SET LOCAL ROLE authenticated` och `request.jwt.claims`; inga signerade Supabase Auth-JWT:er, riktiga tvåkontosessioner, samtidiga röster eller fysisk mobil verifierades. Ett produktionsflöde för automatisk textrevision av kortleksregler testades inte.

**Kvar:** de faktiska tvåkontotesterna, omparning/familjeisolering under verkliga Auth-sessioner och övriga SEC-02-RPC-kroppar.
