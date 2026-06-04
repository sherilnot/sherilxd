// app.js
console.log("LOADED APP:", __filename);
const express = require('express');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c / 1000);
}

async function fetchOSM(lat, lon, radius, prefs) {
  const categoryMap = {
    food: "catering.restaurant,catering.cafe,catering.fast_food",
    shopping: "commercial.shopping_mall,commercial.supermarket,commercial.clothing"
  };

  const categories = prefs
    .map(p => categoryMap[p])
    .filter(Boolean)
    .join(",");

  const url =
    `https://api.geoapify.com/v2/places?categories=${categories}` +
    `&filter=circle:${lon},${lat},${radius}` +
    `&limit=50&apiKey=${process.env.GEOAPIFY_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geoapify error ${response.status}`);
    }

    const data = await response.json();

    return data.features.map(f => ({
      name: f.properties.name || "Unnamed place",
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      distance: Number(
        haversine(
          lat,
          lon,
          f.geometry.coordinates[1],
          f.geometry.coordinates[0]
        ).toFixed(1)
      ),
      types: prefs
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Routes
app.get('/pid', (req, res) => {
  console.log('PID route hit by worker', process.pid);
  res.send(`PID: ${process.pid}`);
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/home', (req, res) => {
  res.render('index');
});

app.get('/forms', (req, res) => {
  res.render('form');
});

app.get('/xyz987', (req, res) => {
  res.send('XYZ987 works');
});

app.get('/hello', (req, res) => {
  res.send('hiii from backend');
});

app.get('/location', (req, res) => {
  res.render('loc');
});

app.post('/submit', (req, res) => {
  console.log(req.body);
  res.send("Received!");
});

app.post('/saveUser', (req, res) => {
  console.log(req.body);
  res.send("Data received successfully!");
});

app.post('/api/location', async (req, res) => {
  const { lat, lon, radius, prefs } = req.body;

  const radiusNum = Number(radius) * 1000;

  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    Number.isNaN(radiusNum) ||
    radiusNum <= 0 ||
    radiusNum > 50000 ||
    !Array.isArray(prefs) ||
    prefs.length === 0
  ) {
    return res.status(400).send("Invalid Input");
  }

  const results = await fetchOSM(
    lat,
    lon,
    radiusNum,
    prefs
  );

  res.json({
    count: results.length,
    results
  });
});

console.log('Registered routes:');

app._router?.stack
  ?.filter(layer => layer.route)
  .forEach(layer => {
    console.log(layer.route.path);
  });

  app.get('/pid', (req, res) => {
  res.send(`PID: ${process.pid}`);
});

console.log('PID route added');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;