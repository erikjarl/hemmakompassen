# AI-medlaren: behörig information från andra sidor

Status: intern testversion, 1 november 2026. Endast Fannyförälder och Tobbetonåring kan använda den driftsatta AI-servern. Använd fiktiva uppgifter.

## Vad AI:n kan läsa

- Egna Gillaswajpen-svar (JA och NEJ) och egna kort som markerats mycket viktiga. Endast ett urval skickas för att hålla kostnaden nere. Enskilda svar påstås aldrig vara gemensamma.
- Gemensamma matchningar via autentiserad shared_swipe_matches: endast JA+JA på tillåtna matchningskort, högst 18 kort ur aktuella kortlekar.
- Eget IPIP-50-test: de fem summapoängen beräknas från egna 50 giltiga svar i Workerns minne. Råa frågesvar skickas aldrig till AI-modellen.
- Delad Big Five-jämförelse: bara de fem faktorer som my_ipip50_shared_profiles lämnar ut efter aktivt samtycke från båda i den aktuella parningen. Inga individuella partnerfrågor.
- Schyssta listan: accepterade gemensamma regler separat från ännu ej godkända förslag.
- Inkorgen: högst fyra korta utdrag från meddelanden som den aktuella användaren redan har rätt att läsa.
- Kommunikationsråd och övriga appfunktioner: allmän kännedom om var olika samtal och överenskommelser kan tas vidare.

Ej tillgängligt: motpartens privata svar, partnerns privata AI-chatthistorik, andra tidigare parningars material, privata viktighetsmarkeringar, ej delade B-kort, råa partnerfrågor eller funktioner vars delning är avstängd.

## Kontroll och sekretess

Varje AI-anrop hämtar en helt ny, begränsad kontext med samma Supabase JWT som används för att identifiera den inloggade användaren. Ingen service_role används. Separata RPC:er kontrollerar samtycke och aktuell parning.

Vid chattöppning används GET /api/ai/context för att visa endast NAMNEN på de informationskällor som kan användas. Själva data skickas inte till den översikten. Inför varje AI-svar byggs kontexten om. Därmed respekteras svarsförändringar och återkallad delning.

För att äldre AI-svar inte ska återintroducera data vars samtycke återkallats skickas inte tidigare genererade svar tillbaka till modellen. Tidigare egna användarmeddelanden kan däremot följa med. Redan sparade AI-svar är fortfarande synliga i användarens egen chatthistorik tills användaren raderar den.

Kontexten är maximalt 9 300 tecken lång och urvalet prioriterar delad personlighetsjämförelse, egna faktorpoäng, godkända regler, gemensamma JA och egna prioriteringar. Tillägg förser aldrig modellen med partnerdata när aktuell behörighet saknas.

## Psykologisk utformning

AI:n ska uppmärksamma känslor utan att okritiskt bekräfta fakta, utgå från användarens aktuella fråga, skilja hypoteser från belagda slutsatser och ge konkreta små steg. Föräldrar påminns om större relationsansvar; tonåringar görs inte ansvariga för vuxnas beteende. IPIP-50 används aldrig diagnostiskt eller som svensk normpercentil. Modellen kan föreslå att man öppnar Gillaswajpen, Schyssta listan eller Kommunikationsråd.

Detta är inte en kliniskt validerad tjänst. Tidigare fiktiva riskfall visade brister i AI-modellens hantering av våld och suicidalitet. Det befintliga enkla riskfrasfiltret är inte tillräckligt för att garantera säkerhet i verkliga risksamtal.

## Kontrollsteg

- [x] Node-tester för egna svar, saknat tvåsidigt samtycke, falska matchningar, felaktiga profiler och uppdaterad publik kortkatalog.
- [x] Statisk byggkontroll och webbplatsens vanliga Playwright-testkedja.
- [x] Worker uppladdad med index.mjs, history.mjs, context.mjs och catalog.mjs utan ändrade eller betalda tjänster.
- [ ] Testa med de två faktiska kontona och ändra/revokera delning i två webbläsarsessioner. Kontrollera att översikten och AI-svaret ändras.
- [ ] Klinisk och dataskyddsmässig granskning före externa riktiga användare.
