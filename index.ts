import express, { Request, Response } from 'express';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const app = express();
const port = 3000;

const sanitizeFileName = (filename: string) => {
    return filename.replace(/[\/\\?%*:|"<>]/g, '').replace(/\s+/g, '_');
};

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.get("/download", async (req: Request, res: Response): Promise<void> => {
    const { url }: any = req.query;

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

        const info = await ytdl.getInfo(url);

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

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).send('Something went wrong');
        }
    }
});

app.listen(port, () => {
    console.log(chalk.cyan(`Server running at http://localhost:${port}`));
});
