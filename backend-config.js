// Hemmakompassen backend configuration. Public project URL and publishable key only.
// Do not add service_role keys or other secrets to this repository.
window.HEMMAKOMPASSEN_BACKEND = Object.freeze({
  supabaseUrl: 'https://bwrcgrbbpumyjfvznlbf.supabase.co',
  supabasePublishableKey: 'sb_publishable_X8dhLg-yLjTMMdZ7eaZzjQ_PA0N-WvJ',
  // Staged feature: enable only after both priority migrations and real
  // two-account verification have been approved and completed.
  enableSharedPriorities: false,
  // Enable only after the server's A-only RPC allowlist and authenticated
  // two-account match/revocation tests pass. Background polling is OFF by default.
  enableSharedPolling: false,
  // Shared insights use the same JWT-protected RPCs that the AI can read.
  // Internal testing only; no private answers are shared automatically.
  enableSharedInsights: true,
  // Let both users see exactly the B messages the teenager chooses to share.
  // The same existing RPC also provides those messages to the AI.
  enableSharedUnderstanding: true,
  // Internal online test site only (no external users): enable Schyssta RPCs.
  // Keep authenticated pair authorization and versioned dual consent in backend.
  enableSchysstaList: true,
  // Internal online testing: server-generated, consent-filtered activity digests.
  enableActivityNotifications: true,
  // IPIP-50: all individual item answers stay self-only. Shared FIVE scores
  // require exact current pair + both opt-ins in verified server-side RPCs.
  enablePersonalitySharing: true,
  // New self-only IPIP retests use separate owner-RLS tables, never partner/AI sharing.
  enablePrivateRetests: true,
  // Internal AI mediator: owner-scoped D1 history, not a clinical service.
  enableAiMediator: true,
  enableAiHistory: true,
  // Enabled for the two allowlisted internal test accounts after Worker deployment 2026-11-02.
  // Automatically generates role-specific results; shares the same hard D1 daily AI quota.
  enableAiResultAnalyses: true,
  aiMediatorUrl: 'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate',
  // Until auth, family membership and privacy tests pass, the public UI remains a demo.
  liveModeEnabled: false
});
