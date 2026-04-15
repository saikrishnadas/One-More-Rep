/**
 * Expo config plugin for react-native-health-connect v3.
 *
 * The library's built-in plugin only adds an intent-filter to AndroidManifest.
 * This plugin adds the two things it misses:
 *
 * 1. MainActivity.kt — HealthConnectPermissionDelegate.setPermissionDelegate(this)
 *    Required to register the ActivityResultLauncher before requestPermission works.
 *
 * 2. AndroidManifest.xml — <queries><package> for the Health Connect provider
 *    Required on Android 11+ for package visibility.
 */
const {
  withMainActivity,
  withAndroidManifest,
} = require('@expo/config-plugins');

function withHealthConnectMainActivity(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    const importLine =
      'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';

    // 1. Add the import if missing
    if (!contents.includes(importLine)) {
      contents = contents.replace(
        /import expo\.modules\.ReactActivityDelegateWrapper/,
        `${importLine}\nimport expo.modules.ReactActivityDelegateWrapper`
      );
    }

    // 2. Add setPermissionDelegate call after super.onCreate(null) if missing
    //    Wrapped in try-catch: if registration fails, JS side falls back to openHealthConnectSettings()
    const delegateCall =
      'HealthConnectPermissionDelegate.setPermissionDelegate(this)';
    if (!contents.includes(delegateCall)) {
      contents = contents.replace(
        /super\.onCreate\(null\)/,
        `super.onCreate(null)\n    try { ${delegateCall} } catch (_: Exception) { /* JS fallback handles this */ }`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

function withHealthConnectQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure <queries> exists
    if (!manifest.queries) {
      manifest.queries = [];
    }

    // Check if the Health Connect package query already exists
    const queries = manifest.queries;
    const hasHealthPackage = queries.some(
      (q) =>
        q.package &&
        q.package.some(
          (p) =>
            p.$ &&
            p.$['android:name'] === 'com.google.android.apps.healthdata'
        )
    );

    if (!hasHealthPackage) {
      // Find existing queries entry or create one
      let queriesEntry = queries.find((q) => typeof q === 'object');
      if (!queriesEntry) {
        queriesEntry = {};
        queries.push(queriesEntry);
      }
      if (!queriesEntry.package) {
        queriesEntry.package = [];
      }
      queriesEntry.package.push({
        $: { 'android:name': 'com.google.android.apps.healthdata' },
      });
    }

    return config;
  });
}

function withHealthConnectPermissionDelegate(config) {
  config = withHealthConnectMainActivity(config);
  config = withHealthConnectQueries(config);
  return config;
}

module.exports = withHealthConnectPermissionDelegate;
