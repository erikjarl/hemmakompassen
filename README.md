# Hemmakompassen

En fristående, responsiv webbprototyp inspirerad av Tonårskompassen (Base44). Design: **Midnight Haven** med midnattsblå bakgrund, bärnstensfärgade detaljer, mörka kort, seriftypsnitt och en mobilanpassad navigering.


## Senaste utveckling: introduktion och familjekoppling

En förstagångsbesökare får nu välja **tonåring** eller **förälder** och skapa en lokal demoprofil. Startsidan har rollanpassad introduktion och länkar till vyn **Hitta varandra**, som visar det planerade flödet för framtida familjekoder och datadelning. Ingen verklig kontoregistrering eller fjärrkoppling sker.

För att kontrollera huvudvyer och onboarding när du arbetar lokalt med repot:

```bash
node --test tests/smoke.test.cjs
```

## Starta webbplatsen

Publicera repositoryts rot från grenen `main` via **GitHub → Settings → Pages** (Deploy from a branch → main → /root). Därefter bör standardadressen vara:

https://erikjarl.github.io/hemmakompassen/

Filerna `index.html`, `styles.css`, `app.js`, `landscape.svg` och `favicon.svg` körs direkt i webbläsaren och behöver inte byggas.

## Vad som fungerar i denna prototyp

- Anpassat utseende för telefon, surfplatta och dator.
- Startskärm och navigation.
- Två växlingsbara **demoprofiler** (tonåring och förälder) på samma enhet.
- Gillaswajpen: påståenden, knappar eller svepgester, sammanställning och likheter/skillnader.
- Big Five-inspirerad **reflektionsövning med 15 egenskapssvar** och illustrativa jämförelsestaplar.
- Lokal demoinkorg med meddelanden och läsmarkering.
- Schyssta listan med förslag och lokala bekräftelser.
- Kommunikationsråd med fyra steg och en tillfällig NVC-formuleringshjälp.
- Förskrivna reflektionsråd på sidan "AI-medlaren".

## Viktiga begränsningar

**Detta är inte en produktionsklar tjänst.**

All sparad demodata finns endast i webbläsarens `localStorage`, kan läsas av andra som använder samma enhet och skickas aldrig till en annan användare. Ingen riktig registrering, identitetskontroll, säker familjekod, meddelandedelning, serverlagring eller AI-anslutning finns. Den som provar sidan ska inte skriva in känsliga personuppgifter.

Personlighetsövningen är **inte ett validerat Big Five-instrument**. Poängen är inte normerade och ska endast användas som utgångspunkt för samtal.

## Inför en riktig lansering

1. Välj en säker backend (exempelvis Supabase med serverhanterad autentisering) och implementera användarprofiler, familjekoppling och radnivåbehörigheter (RLS) så att olika familjepar är isolerade.
2. Begränsa insamling av känsliga uppgifter och definiera gallring och samtyckes-/informationsflöden för minderåriga.
3. Implementera verklig synkning för meddelanden, swajpsvar, resultat och regler.
4. Om AI används: anropa modellen **endast via backend**, skydda API-nycklar, separera samtal mellan användare, och informera tydligt om vilken profilinformation AI får använda.
5. Säkerhetsgranska, testa med riktiga testkonton och utför en integritets- och rättslig genomgång innan användning med riktiga familjer.

Källkoden är egen återskapning från användarens funktionsbeskrivning och mobilskärmbilder; den är **inte** exporterad från Base44.

## Filer

- `index.html`: grundstruktur, ikonbibliotek och navigering.
- `styles.css`: design och responsiv layout.
- `app.js`: lokala demoflöden och frontendlogik.
- `landscape.svg`: illustrerad natthimmel för startsidan.
- `favicon.svg`: ikon.
