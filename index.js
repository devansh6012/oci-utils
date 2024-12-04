require('dotenv').config();
const common = require('oci-common');
const objectStorage = require('oci-objectstorage');
const fs = require('fs');
const path = require('path');

const provider = new common.ConfigFileAuthenticationDetailsProvider();
const client = new objectStorage.ObjectStorageClient({ 
  authenticationDetailsProvider: provider 
});

async function listBucketFiles(namespaceName, bucketName) {
  try {
    const response = await client.listObjects({
      namespaceName,
      bucketName
    });
    return response.listObjects.objects;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

async function downloadFile(namespaceName, bucketName, objectName) {
  try {
    const response = await client.getObject({
      namespaceName,
      bucketName,
      objectName
    });

    const downloadPath = path.join('downloads', objectName);
    fs.mkdirSync('downloads', { recursive: true });

    const chunks = [];
    const reader = response.value.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(downloadPath, buffer);
    console.log(`Downloaded: ${objectName}`);
  } catch (error) {
    console.error(`Error downloading ${objectName}:`, error);
  }
}

async function main() {
  const namespace = process.env.NAMESPACE;
  const bucket = process.env.BUCKET_NAME;
  
  const files = await listBucketFiles(namespace, bucket);
  for (const file of files) {
    await downloadFile(namespace, bucket, file.name);
  }
}

main();