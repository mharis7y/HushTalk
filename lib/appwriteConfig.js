import { Client, Databases, Storage, ID } from 'react-native-appwrite';

const client = new Client();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('695fe660000ac9ac1c2c') // Found in Project Settings
    .setPlatform('com.mharis7y.hushtalk'); // Your Package Name

const databases = new Databases(client);
const storage = new Storage(client);

// Constants for your IDs to avoid typos later
export const APPWRITE_CONFIG = {
    projectId: '695fe660000ac9ac1c2c',
    databaseId: '695fe67b00116e720361',
    collectionId: 'media_library', // MediaLibrary Collection ID
    bucketId: '695fe6c6002bff5a7714' // UserMedia Bucket ID
};

export { client, databases, storage, ID };