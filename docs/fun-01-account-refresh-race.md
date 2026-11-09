# FUN-01-RACE-01 – samtidiga uppdateringar på kontosidan

**Datum:** 9 november 2026 · **Område:** konto, in-/utloggning, kontobyte och familjevy · **Status:** PR #239 mergad till `main`. Syntetisk Node/Chromium och serverade Pages-filer verifierade; faktisk autentiserad tvåkontotestning återstår.

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

[PR #239](https://github.com/erikjarl/hemmakompassen/pull/239) mergad som [`4da9ff6`](https://github.com/erikjarl/hemmakompassen/commit/4da9ff6b99bfd9d448104eba67da9b927520afad) efter [grön CI #42538478572](https://github.com/erikjarl/hemmakompassen/actions/runs/42538478572), 400/400 Node-tester och 77 syntetiska Chromium-skärmbilder.

## Publicering

GitHub Actions-kontrollen `verify-pages-assets.yml` utökas från tre till fyra serverade filer och byte-jämför även `konto.js` mot `main` efter merge. Det ger ett särskilt **distributionsbevis** för rätt konto-JavaScript på GitHub Pages, men bevisar inte att inloggning, sessioner eller två faktiska konton fungerar.

**Verifierad publicering 9/11:** [Pages-deploy #42538885853](https://github.com/erikjarl/hemmakompassen/actions/runs/42538885853) och [byte-kontroll #42538886790](https://github.com/erikjarl/hemmakompassen/actions/runs/42538886790) godkända för fyra filer inklusive `konto.js`. De första tre försöken hämtade en äldre kontofil, det fjärde bekräftade nya innehållet. Detta är publiceringsbevis, inte live-användartest.
