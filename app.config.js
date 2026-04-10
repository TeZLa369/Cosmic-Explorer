export default {
    expo: {
        name: "Cosmic Explorer",
        slug: "nasa-api",
        icon: "./assets/nasa.png",

        plugins: ["expo-audio", "expo-font", "expo-asset"],

        extra: {
            eas: {
                projectId: "525c1a6f-a139-4269-b11f-c7438e9b2581",
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
