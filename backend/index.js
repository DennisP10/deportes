const express = require('express');
const cors = require('cors');
require('dotenv').config();
const rutas = require('./src/routes/rutas');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', rutas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Deportes corriendo en puerto ${PORT}`));