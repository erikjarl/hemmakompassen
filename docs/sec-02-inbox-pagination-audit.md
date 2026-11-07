# SEC-02 / INT-03 – Inkorg: paginering med fler än 50 meddelanden

**Datum:** 7 november 2026. **Miljö:** ansluten Supabase-databas, faktisk installerad `send_family_message` och `my_family_messages`.

## Metod

`supabase/tests/sec02_inbox_pagination_rollback.sql` körs som en enda PostgreSQL-transaktion med `BEGIN` och avslutande `ROLLBACK`. Den hämtar de befintliga parade förälder-/tonåringskontona och ett oparat konto lokalt i databasen. Inga personidentifierare sparas i GitHub.

Testet kräver en baslinje med **2 redan sparade meddelanden**. Med `SET LOCAL ROLE authenticated` och simulerade JWT-claims skapar föräldrarollen **53 tillfälliga meddelanden** genom den verkliga säkrade meddelande-RPC:n. Samtliga skapas i samma databastransaktion och får därför samma transaktionsstabila `created_at`-tid; detta prövar att UUID används som stabilt sekundärt sorterings- och sidankare.

Med `my_family_messages(p_before_created_at,p_before_id)` kontrolleras sedan följande:

| Kontroll | Observerat |
| --- | --- |
| Första sidan när 55 meddelanden finns | Exakt 50 |
| Nästa sida med båda ankardelarna från rad 50 | Exakt 5 |
| Samma tidsstämpel för 53 tillfälliga poster | Inga försvunna eller dubbla meddelande-ID:n |
| Hämtning efter den äldsta posten | 0 meddelanden |
| Sidankare med tidsstämpel men saknat ID | 0 meddelanden (ingen återgång till första sidan) |
| Tonåringens behöriga inkorg | Samma 50 + 5 |
| Utomstående konto, med/utan känt sidankare | 0 meddelanden |
| Inga läskvittenser avsiktligt ändrade | Kontrollerat innan rollback |

SQL-körning mot installerad databas:

```text
PASS: 53 temporary messages + 2 originals, 50+5 pages with tied timestamps; no duplicates, cursor exhaustion, half-cursor denied, both paired roles, outsider isolated; rollback
```

**Separat efterkontroll** efter rollback: **2 meddelanden**, **1 oläst**, **2 familjemedlemmar**, samma som före. Alltså finns inga kvarlämnade testmeddelanden.

## Vad resultatet inte bevisar

Testet använder simulerade claims, inte riktiga signerade Supabase JWT eller två inloggade webbläsare. Det verifierar inte användargränssnittets knapp för att ladda äldre meddelanden, verklig samtidighet under paginering, nätverksfel, avparning/omparning, en annan aktiv familj eller retention/radering. **INT-03 kan därför inte markeras som färdig.** Databasschemat eller produktkoden ändrades inte; testet är en ny regression som kan återköras mot intern testmiljö.
