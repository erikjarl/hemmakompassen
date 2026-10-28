// Hemmakompassen backend configuration. Public project URL and publishable key only.
// Do not add service_role keys or other secrets to this repository.
window.HEMMAKOMPASSEN_BACKEND = Object.freeze({
  supabaseUrl: 'https://bwrcgrbbpumyjfvznlbf.supabase.co',
  supabasePublishableKey: 'sb_publishable_X8dhLg-yLjTMMdZ7eaZzjQ_PA0N-WvJ',
  // Staged feature: enable only after both priority migrations and real
  // two-account verification have been approved and completed.
  enableSharedPriorities: false,
  // Until auth, family membership and privacy tests pass, the public UI remains a demo.
  liveModeEnabled: false
});
