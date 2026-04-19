const express = require('express');
const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

function hii() {
  // Add this temporary test at the top of your route
fetch("https://overpass.openstreetmap.ru/api/interpreter")
  .then(r => console.log("Reachable, status:", r.status))
  .catch(e => console.log("Cannot reach:", e.message));

}
hii();
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c/1000); // distance in meters
}

// ---------- build Overpass query ----------
function buildOverpassQuery(lat, lon, radius, prefs) {
  const filters = [];

  // map your “preferences” → Overpass filters
  if (prefs.includes("food")) {
    filters.push('node["amenity"="restaurant"]');
    filters.push('node["amenity"="cafe"]');
    filters.push('node["amenity"="fast_food"]');
  }

  if (prefs.includes("shopping")) {
    filters.push('node["shop"="mall"]');
    filters.push('node["shop"="supermarket"]');
    filters.push('node["shop"="clothes"]');
  }

  // if nothing was selected, default to restaurants
  if (filters.length === 0) {
    filters.push('node["amenity"="restaurant"]');
  }

  // Overpass QL query string
  return `
     [out:json][timeout:25];
    (
      ${filters.map(f => `${f}(around:${radius},${lat},${lon});`).join("\n")}
    );
    out;
  `;
}


// ---------- call Overpass + shape data ----------
async function fetchOSM(lat, lon, radius, prefs) {
  const categoryMap = {
    food: "catering.restaurant,catering.cafe,catering.fast_food",
    shopping: "commercial.shopping_mall,commercial.supermarket,commercial.clothing"
  };

  const categories = prefs
    .map(p => categoryMap[p])
    .filter(Boolean)
    .join(",");

  const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=50&apiKey=e3e518b2919d4d00a83f94ef49d18424`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geoapify error: " + res.status);

    const data = await res.json();

    return data.features.map(f => ({
      name: f.properties.name || "Unnamed place",
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      distance: Number((haversine(lat, lon, f.geometry.coordinates[1], f.geometry.coordinates[0])).toFixed(1)),
      types: prefs // simplified
    }));

  } catch (err) {
    console.error("Geoapify error:", err);
    return [];
  }
}



app.get('/home', (req, res) => {
  res.render('index');
});

app.get('/forms', (req, res) => {
  res.render('form');
});

app.get('/hello', (req, res) => {
  res.send("hiii from backend");
});
app.get('/location', (req, res) => {
  res.render('loc');
});

app.post('/submit', (req, res) => {
  console.log(req.body);  // { username: "whatever user typed" }
  res.send("Received!");
});

app.post('/saveUser', (req, res) => {
  console.log(req.body);  
  // { name: "Sheril", age: 22 }

  res.send("Data received successfully!");
});

// Define POIS and haversine() OUTSIDE this route

app.post('/api/location', async (req, res) => {
  const { lat, lon, radius, prefs } = req.body;  // <-- names MUST match frontend
  console.log(req.body);
  const radiusNum = Number(radius)*1000;              // convert string -> number
  

  // ✅ Validation
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    Number.isNaN(radiusNum) ||
    radiusNum <= 0 ||
  radiusNum > 50000 ||
    !Array.isArray(prefs) ||
    prefs.length === 0
  ) {
    console.log("Not Valid:", req.body);
    return res.status(400).send("Invalid Input");
  }
  var lati = 11.3216;
  var longi =75.9337;
  const results = await fetchOSM(lati,longi,radiusNum,prefs);
  console.log(results);
  res.json({
      count: results.length,
      results
    });

});

//how


app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
