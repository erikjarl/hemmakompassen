# NOT-02 / UX-04 – nästa steg först på oparad mobilstartsida

**Datum:** 9 november 2026. **Avgränsning:** Hem-vyn för inloggat konto som ännu inte har en fullständig tvåpersoners familjeparning.

## Användarobservation och ändring

Den senast verifierade syntetiska mobilbilden `mobile-home.png` från [main-CI #42555610811](https://github.com/erikjarl/hemmakompassen/actions/runs/42555610811) visade först en relativt stor dekorativ välkomstruta med länken **Utforska Gillaswajpen**, medan kortet **Din familj** med den viktiga åtgärden **Hantera familj och inbjudningar** kom efter. CTA:n kunde fortfarande synas i den 390 px breda skärmbilden, men hade lägre visuell prioritet än den sekundära aktiviteten.

Den minsta ändringen är att behålla båda befintliga korten och deras länkar, men **visa Din familj före välkomstrutan när färre än två familjemedlemmar finns**. Med en fullständig parning ligger välkomstrutan fortsatt först. Utan familjekoppling visas nu en korrekt statustext i stället för ”Familjemedlemskap hämtat från Supabase”.

Ingen navigation, inbjudningskod, kontoidentitet eller familjedata skrivs om; ändringen är enbart i presentation och copy.

## Testmetod

- `tests/home-unpaired-invitation-priority.test.mjs` kör produktionsvyn `home()` med syntetiska medlemslistor om **0, 1 och 2 personer**. Den första åtgärden ska visas före dekorativa välkomstrutan vid 0/1 medlem. Parade konton ska behålla befintlig ordning och rollinformation.
- `tests/visual.mjs` mäter faktisk elementposition i mockad mobil-Chromium 390 × 844. Länken **Hantera familj och inbjudningar** måste synas utan scroll ovanför den fixerade mobilnavigeringen och peka på `./konto.html`. Den ordinarie 320-/390-/430-vyinventeringen och Chromium-skärmbilderna fångar eventuella följdfel.
- Före ändringen reproducerade [CI #42557886021](https://github.com/erikjarl/hemmakompassen/actions/runs/42557886021) **458 PASS / 2 FAIL av 460 Node-testfall**: det syntetiska ensamma föräldrakontot och kontot utan familj hade fel kortordning.

**Begränsningar:** Uppmätt layout i Chromium med mockad Auth är inte fysisk Safari/VoiceOver och inte användbarhetstest med verkliga familjer. Ändringen bör granskas visuellt efter fullständiga tester. Slutlig PR-/main-CI och Pages-distribution redovisas först när de har verifierats.
