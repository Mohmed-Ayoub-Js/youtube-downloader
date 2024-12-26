var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
// For getting the directory name in ES modules
import { fileURLToPath } from 'url';
const app = express();
const port = 3000;
// This will resolve __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sanitizeFileName = (filename) => {
    return filename.replace(/[\/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
};
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'ui', 'index.html');
    res.sendFile(indexPath);
});
app.get("/download", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.query;
    if (!url) {
        res.status(400).send("Please provide a valid video URL.");
        return;
    }
    try {
        console.log(chalk.green(`Attempting to download video from: ${url}`));
        if (!ytdl.validateURL(url)) {
            res.status(400).send("Invalid YouTube URL.");
            return;
        }
        const info = yield ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' });
        const downloadDir = path.join('./', 'downloads');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }
        const sanitizedTitle = sanitizeFileName(info.videoDetails.title);
        const videoPath = path.join(downloadDir, `${sanitizedTitle}.mp4`);
        console.log("Video Path:", videoPath);
        const writeStream = fs.createWriteStream(videoPath);
        let lastProgress = 0;
        ytdl(url, { format: format })
            .on('progress', (chunkLength, downloaded, total) => {
            const progress = Math.round((downloaded / total) * 100);
            if (progress !== lastProgress) {
                process.stdout.cursorTo(0);
                process.stdout.write(`Download progress: ${progress}%`);
                lastProgress = progress;
            }
        })
            .pipe(writeStream);
        writeStream.on('finish', () => {
            console.log(chalk.green(`\nDownload completed: ${videoPath}`));
            res.send({ message: 'Video downloaded successfully', videoPath: videoPath });
        });
        writeStream.on('error', (err) => {
            console.error('Download error:', err);
            if (!res.headersSent) {
                res.status(500).send('Error during download');
            }
        });
    }
    catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).send('Something went wrong');
        }
    }
}));
app.listen(port, () => {
    console.log(chalk.cyan(`Server running at http://localhost:${port} - FREE YOUTUBE DOWNLODER V2.0.0`));
});
