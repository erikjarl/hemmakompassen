# SEC-02 – manuell stickprovsgranskning av RPC-kroppar

Datum: **7 november 2026**. Underlag: direkta `pg_get_functiondef`-utdrag från det anslutna Supabase-testprojektet, följt av katalogkontroll av `pg_constraint`. Endast läsning i detta delsteg. Detta är **inte** en fullständig genomgång av alla 30 funktioner och inte ett autentiserat tvåkontotest.

## Granskade funktioner

| Funktion | Observerad behörighetslogik | Kvar att testa |
| --- | --- | --- |
| `public.send_family_message` | Kontrollerar `auth.uid()`, exakt föräldra–tonårspar genom `private.current_exact_pair_family_id()`, avsändare och mottagare, versionsidentifierare för medlemskap samt idempotent request key bunden till samma kropp/par/epok. | Konkurrerande skrivning, återanvänd retry key, avparning, två riktiga sessioner |
| `public.my_family_messages` | Begränsar resultat till aktuell exakt parning och medlemskapstid, filtrerar med avsändar-/mottagarpar samt paginerar efter tidsstämpel+ID (50). | Verklig sekretess mellan familjer och efter omparning |
| `public.mark_family_messages_read` | Kräver `auth.uid()`, exakt parning och mottagare, kvitterar bara olästa meddelanden med matchande medlemskapstid. | Tvåkontotest för kvittens, omparning och kontobyte |
| `public.set_schyssta_rule_decision` | Låser aktuell regelrad, kräver aktuellt par och dess medlemskapstider, uppdaterar versionsbunden personlig röst, accepterar först vid två positiva röster och avslår om en röstar nej. | Simultana beslut, gammal version, parbyte och röst från tredje konto |
| `public.my_ipip50_shared_profiles` | Kräver två medlemmar, en per roll, två aktuella explicita delningar bundna till familj och medlemskapstid, fullständiga fem faktorer per individ, returnerar aggregerade faktorer utan råa svar. | Verkligt samtyckesåtertagande, ändrad testomgång, eventuella race conditions |
| `public.mark_activity_notification_read` | Efter PR #138 kontrolleras notis-ID direkt utan att den 30-poster långa visningslistan används som auktorisationskälla. Mottagare, exakt par, medlemskapstid och giltig eventnyckel kontrolleras före skrivning. | Positivt kvitteringsfall för äldre notis + två autentiserade sessioner |

## Databasbegränsningar kontrollerade

- `family_members` har `UNIQUE(user_id)` och `UNIQUE(family_id, role)`: en användare kan inte samtidigt tillhöra flera familjer och varje par kan bara ha en medlem per roll enligt aktuell schema-definition.
- `family_direct_messages` har `UNIQUE(sender_id,request_key)`, krav på olika avsändare/mottagare, parrelation samt en längdbegränsning 1–1500 tecken.
- `personality_share_preferences` har `PRIMARY KEY(user_id,instrument_id)`.
- Dessa begränsningar gäller **nuvarande databasdefinition**, inte ett bevis på korrekt RLS eller på att de anropade funktionerna fungerar som tänkt i alla fall.

## Verifiering av PR #138

- `[PR #138](https://github.com/erikjarl/hemmakompassen/pull/138)` mergad till main: `5060b52b4077905c89a90e92668813805edc7d40`.
- GitHub Actions `[run 42384580437](https://github.com/erikjarl/hemmakompassen/actions/runs/42384580437)` rapporterade **success** före merge.
- Migration `activity_notification_read_unbounded` applicerades i anslutet Supabase-testprojekt med `success:true`.
- Efteråt bekräftade `pg_get_functiondef` att den installerade funktionen innehåller direkt-ID-kontrollen, aktuell exakt parning och eventnyckelkontrollen.
- En syntetisk okänd inloggningsidentitet och ett slumpmässigt okänt notis-ID avvisades i en transaktion som rullades tillbaka. Det bevisar **inte** positiv funktion, andra familjers integritet eller fullständig återkallelse.

## Återstående P0-prioriteringar

1. Genomför verkliga tvåkontotester av INT-01–04, inklusive negativa fall och återkallelse. Bevara befintliga testkontons tidigare svar.
2. Granska de **övriga RPC-kropparna** samt externa hjälpfunktioner, triggerkedjor och Worker/JWT-hantering.
3. För NOT-01: skapa ett **isolerat** legitimt äldre notifieringsfall och verifiera kvittens i två autentiserade sessioner utan att skriva över användarnas tidigare svar.

Funktionerna ovan är **stickprovsgranskade**, inte säkerhetscertifierade.
