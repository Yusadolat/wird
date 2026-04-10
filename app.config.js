// Expo will prefer this file over app.json.
// We use it to conditionally enable Sentry's config plugin in CI/EAS without
// hard-coding org/project identifiers in versioned config.

const appJson = require("./app.json");

module.exports = ({ config }) => {
  const base = { ...(config ?? appJson.expo) };

  const sentryOrg = process.env.SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT;

  const plugins = Array.isArray(base.plugins) ? [...base.plugins] : [];

  if (sentryOrg && sentryProject) {
    plugins.push([
      "@sentry/react-native/expo",
      {
        organization: sentryOrg,
        project: sentryProject,
        // Uses SENTRY_AUTH_TOKEN at build time for uploading sourcemaps.
      },
    ]);
  }

  const existingPermissions = base.android?.permissions ?? [];
  const dedupedPermissions = Array.from(new Set(existingPermissions));

  return {
    ...base,
    plugins,
    android: {
      ...base.android,
      permissions: dedupedPermissions,
    },
  };
};

