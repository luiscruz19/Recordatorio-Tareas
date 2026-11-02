// El archivo de Firebase no se versiona: EAS lo entrega en GOOGLE_SERVICES_JSON.
module.exports = ({ config }) => ({
    ...config,
    android: {
        ...config.android,
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
    },
});
