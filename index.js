const fs = require('fs');
const path = require('path');
const https = require('https');

async function main() {
    const url = 'https://storage.googleapis.com/panels-api/data/20240916/media-1a-i-p~s';
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const startTime = Date.now(); // Capture the start time

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`🙅 Failed to fetch JSON file, MKBHD might have taken down the URL. ${response.statusText}`);
        }
        const jsonData = await response.json();
        const data = jsonData.data;
        if (!data) {
            throw new Error('🙅 JSON does not have a "data" property, MKBHD might have taken down the URL.');
        }

        const downloadDir = path.join(__dirname, 'wallpapers'); // Changed to 'wallpapers'
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
            console.info(`✅ Successfully set up directory: ${downloadDir}`);
        }

        let fileIndex = 1;
        let successCount = 0;

        for (const key in data) {
            const subproperty = data[key];
            if (subproperty && subproperty.dhd) {
                const imageUrl = subproperty.dhd;
                const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
                const filename = `${fileIndex}${ext}`;
                const filePath = path.join(downloadDir, filename);

                const downloadStartTime = Date.now();
                try {
                    await downloadImage(imageUrl, filePath);
                    console.info(`🔎 Located image, saved in ${filePath}`);
                    successCount++;
                } catch (err) {
                    // Ignoring errors to avoid logging failed downloads
                }
                const elapsedTime = Date.now() - downloadStartTime;
                const dynamicDelay = Math.max(100 - elapsedTime, 0); // Adjust delay based on download time
                await delay(dynamicDelay); // Delay based on download speed
                fileIndex++;
            }
        }

        const totalTime = Date.now() - startTime; // Calculate total time taken
        const minutes = Math.floor(totalTime / 60000);
        const seconds = Math.floor((totalTime % 60000) / 1000);
        
        console.info(`✅ Successfully downloaded ${successCount} wallpapers in ${minutes} minutes and ${seconds} seconds.`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function downloadImage(url, filePath) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(filePath, buffer);
}

main();