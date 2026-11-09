# FUN-01-RACE-01 – samtidiga uppdateringar på kontosidan

**Datum:** 9 november 2026 · **Område:** konto, in-/utloggning, kontobyte och familjevy · **Status:** ändring föreslagen för Node/CI-verifiering.

## Upptäckt vid kodgranskning

`konto.js` kör `refresh()` från flera håll: första sidladdningen, formuläråtgärder och Supabase `onAuthStateChange`. Varje körning väntar separat på `auth.getUser()`, privat profilläsning och `my_family_members`. Före ändringen saknades kontroll för om en äldre väntande uppdatering blivit föråldrad när ett nytt konto loggade in eller den gamla sessionen avslutades. Det kunde göra gränssnittets namn/familjefält inkonsekventa med den aktuella sessionen.

## Ändring

- En monoton `refreshVersion` ökas vid varje ny `refresh()`.
- Efter **varje asynkron läsning** av användare, profil eller familjemedlemmar kontrolleras att versionen fortfarande är den senaste innan DOM uppdateras.
- Vid utloggat läge rensas kontonamn, inmatat profilnamn, familjemedlemslista och tidigare familjepanelers synlighet. Inbjudningsnotisen, eventuellt skannad QR-kod och all serverdata lämnas oförändrade.
- Ingen ändring av Supabase-frågor, API:er, databas, sparade svar eller delningsregler.

## Regressionsmetod

`node --test tests/account-refresh-race.test.mjs` kör **tre simulerade asynkrona övergångar** mot samma `konto.js` som används i webbläsaren, med fejkad Supabase-klient och ett enkelt DOM-objekt:

1. Förälderns äldre profilläsning slutförs efter utloggning. Den får inte återställa profilnamnet eller initiera en gammal familjefråga.
2. Förälderns äldre familjefråga slutförs **efter att ett tonårskonto hämtats klart**. Tonåringens synliga namn och familj ska förbli kvar.
3. Ett gammalt `getUser()`-svar anländer efter en senare utloggad uppdatering. Det får inte återskapa den inloggade vyn eller initiera profilfråga.

**Verifieringsgränser:** detta är Node/VM-baserade syntetiska tester, inte autentiserad Supabase, verklig utloggning i två webbläsare eller fysisk iPhone/Safari. Testet undersöker visat tillstånd och antal/ordning för vissa läsningar, men inte full interaktiv tillgänglighet eller nätverksavbrott. Funktionell status FUN-01 ska därför fortsätta vara **Pågår** tills relevanta autentiserade tvåkontotester har gjorts.

## Spårbarhet

Se PR och CI-länk i `docs/ACTIVE_ROADMAP.md` när dessa är färdigställda.

## Publicering

GitHub Actions-kontrollen `verify-pages-assets.yml` utökas från tre till fyra serverade filer och byte-jämför även `konto.js` mot `main` efter merge. Det ger ett särskilt **distributionsbevis** för rätt konto-JavaScript på GitHub Pages, men bevisar inte att inloggning, sessioner eller två faktiska konton fungerar.
