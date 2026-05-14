const baseConfig = require('./app.json');

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    extra: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    },
  },
};
