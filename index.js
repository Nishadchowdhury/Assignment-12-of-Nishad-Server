const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());







//root of the server
app.get('/', async (req, res) => {
    res.send('server is running Laparts in port ' + port)
})

app.listen(port, () => {
    console.log(`running the server in port ${port}`);
})