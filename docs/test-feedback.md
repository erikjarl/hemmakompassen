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
