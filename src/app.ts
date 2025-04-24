import { Hono } from 'hono';
import { cors } from 'hono/cors';
import router from './router';

const app = new Hono();
// Middleware global
app.use(cors());
app.route('/', router);

export { app };
