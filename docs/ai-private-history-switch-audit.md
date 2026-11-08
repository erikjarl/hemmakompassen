# AI-01/02/03 – byte mellan privata AI-samtal

**Datum:** 8 november 2026. **Omfattning:** klientens privata samtalsvy, ingen Worker- eller databasändring.

## Observerat kodfel

I `ai-mediator-ui.js` uppdaterade `openChat(chatId)` tidigare `activeChatId` utan att rensa den gamla `turns`-listan före nätverksanropet. Det innebär att ett tidigare samtals privata text kunde fortsätta renderas medan ett annat samtal hämtades. Om den nya hämtningen misslyckades behöll gränssnittet den tidigare texten under det nyligen valda samtalets rubrik. Detta är en **klientbaserad integritets- och korrekthetsbrist**, inte ett bevis på åtkomst till en annan användares konto eller serverdata.

## Ändring

`openChat` tömmer nu `turns` **omedelbart** efter att den giltiga nya `chatId` valts, före nätverksanropet. Befintliga skydd mot försenade nätverkssvar, kontobyten och fel behålls. Om begäran misslyckas hålls historiken tom tills en ny godkänd serverhämtning lyckas.

Regressionsprovet `tests/ai-mediator-history-switch.test.mjs` använder den **faktiska UI-modulen** med syntetisk Worker-respons för att prova byte A→B, väntande nätverkssvar, HTTP 503, lyckat omförsök och svar i fel ordning. Inga riktiga privata meddelanden läses, skrivs eller raderas.

## Avgränsning

Detta testar inte Cloudflare Worker mot riktig Supabase Auth, säker lagring i D1, giltigt samtycke till projektkontext, två verkliga testkonton eller säkerheten i genererad modelltext. AI-01/02/03 ska fortfarande stå som **implementerad men ej verifierad** tills dessa kontroller är gjorda.
