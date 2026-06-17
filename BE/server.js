const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const db = require('./config/db');
const authRouter = require('./routers/authRouter');
const projectRouter = require('./routers/projectRouter');
const taskRouter = require('./routers/taskRouter');
const reportRouter = require('./routers/reportRouter');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/reports', reportRouter);

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "🚀 Hệ thống Backend đang hoạt động ổn định!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server khởi động tại Port: ${PORT}\n`);
});