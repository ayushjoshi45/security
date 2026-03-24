const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const crawlRoutes = require('./routes/crawlRoutes');
const payloadRoutes = require('./routes/payloadRoutes');
const sqlInjectionRoutes = require('./routes/sqlInjectionRoutes');
const xssRoutes = require('./routes/xssRoutes');
const csrfRoutes = require('./routes/csrfRoutes');
const commandInjectionRoutes = require('./routes/commandInjectionRoutes');
const xxeRoutes = require('./routes/xxeRoutes');
const pathTraversalRoutes = require('./routes/pathTraversalRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use('/api/crawl', crawlRoutes);
app.use('/api/payloads', payloadRoutes);
app.use('/api/sql', sqlInjectionRoutes);
app.use('/api/xss', xssRoutes);
app.use('/api/csrf', csrfRoutes);
app.use('/api/command-injection', commandInjectionRoutes);
app.use('/api/xxe', xxeRoutes);
app.use('/api/path-traversal', pathTraversalRoutes);

app.get('/', (req, res) => {
  res.send('Scanner running');
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
