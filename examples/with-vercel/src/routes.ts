import path from 'path';
import vercel from '@stackpress/ingest-vercel';

const router = vercel();

router.get('/user/:id', path.resolve(__dirname, 'pages/bar'));
router.get('/user/:id', path.resolve(__dirname, 'pages/zoo'));
router.on('error', path.resolve(__dirname, 'events/error'));

export default router;