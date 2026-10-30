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
  // Until auth, family membership and privacy tests pass, the public UI remains a demo.
  liveModeEnabled: false
});
