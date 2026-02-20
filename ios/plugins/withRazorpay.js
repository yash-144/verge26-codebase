const {
  withInfoPlist,
  withAndroidManifest,
  createRunOncePlugin,
} = require("@expo/config-plugins");

const pkg = require("../package.json");

const withRazorpayIOS = (config) => {
  return withInfoPlist(config, (config) => {
    if (!config.modResults.LSApplicationQueriesSchemes) {
      config.modResults.LSApplicationQueriesSchemes = [];
    }

    const schemes = [
      "paytm",
      "gpay",
      "phonepe",
      "upi",
      "cred",
      "mobikwik",
      "bhim",
      "bharatpe",
      "myairtel",
      "amazonpay",
    ];

    schemes.forEach((scheme) => {
      if (!config.modResults.LSApplicationQueriesSchemes.includes(scheme)) {
        config.modResults.LSApplicationQueriesSchemes.push(scheme);
      }
    });

    return config;
  });
};

const withRazorpayAndroid = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.queries) {
      manifest.queries = [];
    }

    // Ensure we have at least one <queries> tag
    if (manifest.queries.length === 0) {
      manifest.queries.push({});
    }

    const queriesTag = manifest.queries[0];

    if (!queriesTag.package) {
      queriesTag.package = [];
    }

    const packages = [
      "com.google.android.apps.nbu.paisa.user", // GPay
      "net.one97.paytm", // Paytm
      "com.phonepe.app", // PhonePe
      "in.org.npci.upiapp", // BHIM
      "com.dreamplug.androidapp", // CRED
      "com.mobikwik_new", // Mobikwik
      "com.bharatpe.app", // BharatPe
      "com.myairtelapp.main", // Airtel Thanks
      "in.amazon.mShop.android.shopping", // Amazon
    ];

    packages.forEach((packageName) => {
      // Check if this package is already in queries
      const exists = queriesTag.package.some(
        (p) => p.$ && p.$["android:name"] === packageName,
      );

      if (!exists) {
        queriesTag.package.push({
          $: {
            "android:name": packageName,
          },
        });
      }
    });

    return config;
  });
};

const withRazorpay = (config) => {
  config = withRazorpayIOS(config);
  config = withRazorpayAndroid(config);
  return config;
};

module.exports = createRunOncePlugin(withRazorpay, pkg.name, pkg.version);
