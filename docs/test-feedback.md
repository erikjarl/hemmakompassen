# FBK-01 – testanvändares fel- och innehållsrapporter

**Syfte:** Under interna tester är samtliga registrerade användare testanvändare, även de som inte har parat sitt konto. Ingen rollbaserad feature flag får gömma rapportknappen.

## Användarflöde

1. På såväl `index.html` (samtliga moduler) som `konto.html`: välj den fasta knappen **Rapportera fel eller innehåll**.
2. Välj **bugg**, **fel/oklarhet i innehåll** eller **förbättringsförslag**.
3. Skriv minst tio tecken. Skriv valfritt vad du förväntade dig eller föreslår.
4. Skicka. Utan inloggning visas instruktion att logga in, utan att texten raderas. Med inloggning görs en INSERT i Supabase `public.test_feedback`.
5. Vid bekräftad lagring visas kvittens. Vid timeout anges att utfallet är okänt; klienten gör ingen automatisk omförsöksskrivning.

**Datagräns:** Rapporten innehåller rapportkategori, användarens ID, kort sida/modul, beskrivning och frivilligt förbättringsförslag. Inga skärmbilder, råa IPIP-svar, privata samtal, familjeparningskoder, URL-frågeparametrar eller exakta hashfragment skickas automatiskt. Hjälptexten uppmanar att inte ange känsliga personuppgifter.

## Hur projektansvarig läser rapporterna

Öppna Supabase Dashboard → Hemmakompassen → **Table Editor** → `test_feedback`; sortera på `created_at` fallande. Fälten `category`, `page_context`, `description`, `expected_result`, `status` och `created_at` används för triage. Status kan av projektansvarig sättas till `new`, `reviewing`, `planned`, `resolved` eller `closed`. Webbklienten har enbart behörighet att skapa rapporter för inloggad avsändare, aldrig att läsa, lista eller redigera dem. De visas **inte** i familjens inkorg.

Skapa vid behov avidentifierad GitHub-issue för reproducerade problem; **publicera aldrig rapporttext eller personuppgifter automatiskt i offentliga GitHub-issues**.

## Acceptanskriterier och testnivå

- Knappen syns i alla huvudsidor, inklusive kontosidan, och fungerar på mobil utan att täckas av den horisontella bottenmenyn.
- Modal går att öppna, stänga och använda med tangentbord. Validering av kategori, längd och valfritt fält fungerar.
- Ej inloggad: ingen INSERT, behåll utkast. Inloggad utan familj eller i valfri roll: en rapport kan skickas.
- Rapporter sparas med `user_id=auth.uid()`; ingen webbklient kan SELECT/UPDATE/DELETE.
- Konto-URL som innehåller `#invite=` skickar inte parningskoden.
- Verifiera gärna med ett riktigt testkonto och kontrollera exakt en ny rad i Supabase Table Editor utan att ändra några befintliga testdata.

**Status vid implementation:** Kod, migration och automatiserade kontraktstester levereras som PR. Verifiera separat Node/Chromium/CI, migration i verklig Supabase, publicerade filer samt faktisk autentiserad rapportering; markera inte `Färdig och verifierad` om något av dessa steg saknas.


## FBK-01-AUTH-TIMEOUT – funktionell felåterhämtning (9 november 2026)

En låst `db.auth.getUser()` kunde tidigare hålla **Skicka rapport** och **Stäng** inaktiverade utan tidsgräns, innan någon INSERT ens prövats. Rapporten ska gå att försöka skicka igen efter högst 15 s autentiseringskontroll. Användarens text ska stå kvar och UI ska uttryckligen säga att **ingen rapport skickats** om just autentiseringskontrollen avbröts. Förlorad kvittens på själva INSERT-skrivningen fortsätter att anges som **okänt resultat** och försöks inte om automatiskt.

Automatiska Node/VM-regressionstester simulerar en autentiseringskontroll som aldrig svarar, triggar tidsgränsen, verifierar **0 INSERT-anrop** samt att båda formulärknapparna aktiveras igen. Testar även timeout-hjälparens timerstädning och normalt fullbordat löfte. Detta är **inte** ett faktiskt autentiserat E2E-test mot Supabase eller fysisk mobil.


## FBK-01-VIS-01 – rapportknappen skymmer mobilt innehåll (9 november 2026)

**Före-bilder:** de syntetiska Chromium-skärmbilderna `mobile-home.png`, `mobile-shared-insights.png`, `mobile-personality-profile.png` och `mobile-320-communication.png` i [Actions #42607633953](https://github.com/erikjarl/hemmakompassen/actions/runs/42607633953) visar att den långa fasta rapportknappen ligger ovanpå brödtext/kortinnehåll strax ovanför bottennavigeringen. Detta syntes i verklig skärmbild, inte enbart i geometrimätning.

**Ändring:** på mobil blir knappen 48 × 48 CSS-pixlar med en synlig pennikon. Hela texten **Rapportera fel eller innehåll** behålls i knappens tillgängliga namn (`aria-label`) och syns fortfarande på dator. På appen placeras knappen ovanför den horisontella mobilmenyn; på kontosidan, som saknar den menyn, placeras den vid fönstrets nederkant. De två sidorna använder samma CSS.

**Automatiska acceptanstester:** 320 och 390 CSS-pixlar i Chromium kontrollerar knappbredd, åtkomligt namn, synlighet, läge ovanför den simulerade bottenmenyn samt att rapportformulärets tidigare mockade flöden fungerar. Före/efter-bilder på samtliga sidor och fysisk Safari/zoom behöver fortfarande bedömas separat; en reducerad överlagringsyta betyder inte att alla visuella problem är lösta.


## FBK-01-ERROR-CHROMIUM – verifiera utkast och retry utan dubbletter (9 november 2026)

I `tests/feedback-browser.mjs` körs nu samma **riktiga rapportformulär och eventhanterare** i en isolerad Chromium-sida (390 px) genom utloggat läge, bekräftad mock-INSERT, simulerad serveravvisning, autentiserings-timeout och förlorad INSERT-kvittens. Det kontrolleras att användarens text ligger kvar vid samtliga fel, **Skicka** och **Stäng** går att använda igen, autentiserings-timeout gör **0 INSERT**, och förlorad kvittens **inte** föranleder någon automatisk omsändning. En ny rapport sparas bara vid ett separat avsiktligt klick. Kategori och tillåten modulkontext kontrolleras också.

Testet kortar ned klientens 15-sekunders väntetid **enbart i mockad Chromium**; produktionsgränsen är fortsatt 15 sekunder. Resultaten bevisar inte faktisk nätverksfördröjning, riktiga Supabase-användare, lagring eller fysisk Safari. En verkligt signerad testsändning och en inspekterad rad i Table Editor krävs fortfarande för full FBK-01-verifiering.
