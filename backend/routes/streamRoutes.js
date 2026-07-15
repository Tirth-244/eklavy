import express from 'express';
import { getPlaylist, getSegment } from '../controllers/streamController.js';

const router = express.Router();

// Define HLS streaming endpoints (access verified inside controller via token query param)
router.get('/:lectureId/playlist.m3u8', getPlaylist);
router.get('/:lectureId/:segment', getSegment);

export default router;
