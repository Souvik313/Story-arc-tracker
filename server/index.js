import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import analyzeRouter from './routes/analyze.js';
import ingestRouter from './routes/ingest.js';
import personaliseRouter from './routes/personalize.js';
import chatRouter from './routes/chat.js';
import relatedRouter from './routes/related.js';
import angleRouter from './routes/angle.js';
import vernacularVideoRouter from './routes/vernacular-video.js';
import trendingRouter from './routes/trending.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors({
    origin: '*'
}));
app.use(express.json());

app.use("/api/v1/ingest" , ingestRouter);
app.use("/api/v1/analyse" , analyzeRouter);
app.use("/api/v1/personalize" , personaliseRouter);
app.use("/api/v1/chat" , chatRouter);
app.use("/api/v1/related" , relatedRouter);
app.use("/api/v1/angle" , angleRouter);
app.use("/api/v1/vernacular-video" , vernacularVideoRouter);
app.use("/api/v1/trending" , trendingRouter);

// Serve generated video files
app.use('/videos', express.static(path.join(process.cwd(), 'tmp', 'vernacular-videos')));
app.listen(PORT , () => {
    console.log(`Server running on port ${PORT}`);
})

