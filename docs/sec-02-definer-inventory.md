# SEC-02: inventering av autentiserat anropbara SECURITY DEFINER-funktioner

Datum: 2026-11-07. Miljö: anslutet Supabase-testprojekt Hemmakompassen. Metod: **read-only katalogfrågor** mot `pg_proc`, `pg_namespace`, `has_function_privilege` och `pg_get_functiondef`. Ingen data, policy eller kod ändrades i databasen.

## Resultat

- **30** `public`-funktioner hade `SECURITY DEFINER` och EXECUTE-behörighet för rollen `authenticated`.
- **30/30** innehöll textmatchning av `auth.uid(`.
- **30/30** hade en särskild funktionskonfiguration för `search_path` (tom sökväg i den returnerade konfigurationen).
- **0/30** matchade det begränsade mönstret för `EXECUTE` eller `format(` som möjlig dynamisk SQL.
- **30/30** innehöll identifierarrelaterade namn (t.ex. user_id/owner_id/member_id), vilket **inte** visar att rätt användare kontrolleras.
- `mark_activity_notification_read` saknade familjenamn i en enkel textmatchning, men använde `auth.uid()` och identifierarrelaterade namn. Detta är en **granskningsprioritet**, inte bevis på en sårbarhet.
- Mönstersökningar kan ge både falskt positiva och falskt negativa resultat (även kommentarer, strängliteraler och underanrop räknas). De innebär **inte** att funktionskropparna är manuellt reviderade.

## Reproducerbar, endast läsande kontroll

```sql
SELECT
  p.proname,
  pg_get_function_identity_arguments(p.oid) AS args,
  p.proconfig IS NOT NULL AS has_function_config,
  pg_get_functiondef(p.oid) ~* 'auth[.]uid[[:space:]]*\\(' AS mentions_auth_uid,
  pg_get_functiondef(p.oid) ~* '(execute[[:space:]]+|format[[:space:]]*\\()' AS possible_dynamic_sql
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
ORDER BY p.proname, args;
```

## Kvarstående för SEC-02

1. Granska **varje funktions fullständiga kropp**, inklusive eventuella anropade funktioner, för ägar-/familjeisolering, korrekt delning, återkallelse, samtidighet och felvägar. Särskilt viktig är ID-baserad kvittering av notiser, meddelanden och regler.
2. Kontrollera `EXECUTE`-behörighet och policys på nytt efter eventuella migrationer; katalogtext är en ögonblicksbild.
3. Kör negativa anrop med två *verkligt* autentiserade testkonton och främmande familje-ID, efter avparning samt efter återkallat samtycke, utan att förändra befintliga svar.
4. Behåll `enableSharedPriorities:false` och `enableSharedPolling:false` tills beroende samtyckesflöden verifierats.

**Avgränsning:** Detta kompletterar `docs/sec-02-live-readonly-audit.md`; det är en inventering, inte en fullständig penetrationstestning eller säkerhetsgaranti.
