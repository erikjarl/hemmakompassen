# Arbetsinstruktioner för Hemmakompassen

## Kortkommando: Jobb hk

När Erik skriver `Jobb hk` ska ett sammanhängande, självständigt utvecklingspass för `erikjarl/hemmakompassen` genomföras. Läs **alltid först `docs/ACTIVE_ROADMAP.md`** (enda prioriterade arbetskön), sedan aktuell kod, GitHub-PR/CI, Supabase-/Cloudflare-status vid behov. Använd `ROADMAP.md` och `docs/CURRENT_TASKS.md` enbart som historik/tekniskt underlag. Välj högsta genomförbara uppgift, utför flera konkreta ändringar i ett sammanhängande pass, testa, dokumentera verifieringsnivå och uppdatera den aktiva roadmapen. Fortsätt med självständigt P1-arbete om P0-inloggningar är blockerade.

## Stående rutin: testerfeedback från Supabase

Vid **varje** `Jobb hk`: läs även senaste öppna rapporter i anslutna Supabase-projektet Hemmakompassen, tabellen `public.test_feedback`, **med läsbaserad SQL** (status `new`, `reviewing`, `planned`). Följ **FBK-02** i `docs/ACTIVE_ROADMAP.md` för triage, prioritering, avidentifierade deluppgifter, verklig reproduktion, åtgärd, tester och statusuppdatering efter verifierad leverans. Om inget nytt finns: behåll äldre öppna rapporter på arbetslistan. Rapporternas fullständiga innehåll stannar i Supabase och kopieras inte till offentliga issues/commits. Ändra aldrig rapportens innehåll eller markera ett ärende löst bara för att det lagts in i roadmapen.

## Uttrycklig fullmakt, uppdaterad 5 november 2026

Eriks uttryckliga instruktion:

> vid Jobb hk kommando ingår full tillåtelse att publicera/commit/merge samt genomföra motsvarande förändringar i @GitHub @Supabase och @Cloudflare

Det innebär stående tillåtelse inom Hemmakompassen att skapa commits, pusha utvecklingsgrenar, skapa PR, mergea till main och publicera, samt genomföra motsvarande nödvändiga projektförändringar, granskade migrationer och driftsättningar i anslutna Supabase och Cloudflare. Begär inte ett nytt generellt godkännande för dessa steg vid varje pass. Fullmakten gäller tills Erik ändrar den och ersätter äldre projektanteckningar om manuell merge eller separat godkännande inför vanlig publicering.

Projektet används fortfarande för intern testning enligt Eriks instruktion. Testa ändringar och redovisa vad som faktiskt verifierats. Befintliga användarsvar ska inte ändras för testning. Fullmakten ändrar inte produktens regler för privat respektive uttryckligen delad information.
