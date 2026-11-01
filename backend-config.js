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
  // All-deck A insights remain hidden until server A allowlist and authenticated
  // two-account tests have passed. B sharing is not included in this flag.
  enableSharedInsights: false,
  // Separate explicit-consent B channel. Keep OFF until its migration and
  // authenticated teen/parent consent and revocation tests are approved.
  enableSharedUnderstanding: false,
  // Internal online test site only (no external users): enable Schyssta RPCs.
  // Keep authenticated pair authorization and versioned dual consent in backend.
  enableSchysstaList: true,
  // IPIP-50: all individual item answers stay self-only. Shared FIVE scores
  // require exact current pair + both opt-ins in verified server-side RPCs.
  enablePersonalitySharing: true,
  // First internal-only AI chat: ephemeral one-turn Worker, no shared family context.
  // This is a test-only UI on the development branch, not clinical service.
  enableAiMediator: true,
  // Internal-only private saved conversations in EU-jurisdiction D1.
  enableAiHistory: true,
  aiMediatorUrl: 'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate',
  // Until auth, family membership and privacy tests pass, the public UI remains a demo.
  liveModeEnabled: false
});
