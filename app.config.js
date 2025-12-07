export default {
    expo: {
        name: "Cosmic Explorer",
        slug: "nasa-api",
        owner: "tezla",
        icon: "./assets/nasa.png",

        plugins: ["expo-audio", "expo-font", "expo-asset"],

        extra: {
            nasaApiKey: process.env.NASA_API_KEY,
            eas: {
                projectId: "7d0359bd-0e21-4a96-9640-fcffc88727fd",
            },
        },

        android: {
            package: "com.kuntal.cosmicexplorer",
            versionCode: 1,
            permissions: [
                "READ_MEDIA_IMAGES",
                "WRITE_EXTERNAL_STORAGE",
                "READ_EXTERNAL_STORAGE"
            ]
        },
    },
};
