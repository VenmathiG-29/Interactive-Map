// Initialize map with default view on New York City
const map = L.map("map", { zoomControl: true }).setView([40.7128, -74.006], 13);

// Basemap layers for style switching
const streetMap = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
);

const satelliteMap = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: "© Google Satellite",
  }
);

// Add default basemap
streetMap.addTo(map);

// Layer control for basemap style switching
const baseMaps = {
  Streets: streetMap,
  Satellite: satelliteMap,
};
L.control.layers(baseMaps).addTo(map);

// Marker cluster group
const markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

// Custom marker icon
const customIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// Locations data
const locations = [
  {
    name: "Central Park",
    coords: [40.785091, -73.968285],
    description: "A large public park in New York City.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e6/Central_Park_New_York_City_New_York_23.JPG",
    category: "park",
  },
  {
    name: "Empire State Building",
    coords: [40.748817, -73.985428],
    description: "A famous skyscraper with an observatory.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/7a/Empire_State_Building_%28aerial_view%29.jpg",
    category: "building",
  },
  {
    name: "Times Square",
    coords: [40.758896, -73.98513],
    description: "The bustling entertainment and commercial area.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/a/a9/Times_Square%2C_New_York_City_%28HDR%29.jpg",
    category: "square",
  },
  {
    name: "Statue of Liberty",
    coords: [40.689247, -74.044502],
    description: "Iconic symbol of freedom in the US.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/a/a1/Statue_of_Liberty_7.jpg",
    category: "monument",
  },
  {
    name: "Brooklyn Bridge",
    coords: [40.706086, -73.996864],
    description: "A hybrid cable-stayed/suspension bridge.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Brooklyn_Bridge_Postdlf.jpg",
    category: "bridge",
  },
];

// Store marker references globally
let markers = [];

// Create and add markers to cluster
function createMarkers(locationsToShow) {
  markerClusterGroup.clearLayers();
  markers = [];

  locationsToShow.forEach((loc) => {
    const marker = L.marker(loc.coords, { icon: customIcon });
    const popupContent = `
      <div>
        <h3>${loc.name}</h3>
        <p>${loc.description}</p>
        <img class="popup-image" src="${loc.image}" alt="${loc.name}" loading="lazy"/>
      </div>
    `;
    marker.bindPopup(popupContent, { autoClose: false, closeOnClick: false });

    marker.on("popupopen", () => {
      const popup = marker.getPopup();
      const contentNode = popup.getContentNode();
      if (contentNode) {
        contentNode.style.opacity = 0;
        setTimeout(() => {
          contentNode.style.transition = "opacity 0.5s ease-in";
          contentNode.style.opacity = 1;
        }, 10);
      }
    });

    markers.push({ marker, data: loc });
    markerClusterGroup.addLayer(marker);
  });
}

createMarkers(locations);

// Search functionality
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("search-btn");
const clearSearchBtn = document.getElementById("clear-search-btn");

// Search action: focus map on location and open popup
function performSearch() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    alert("Please enter a location name to search.");
    return;
  }
  const found = markers.find(({ data }) => data.name.toLowerCase() === term);
  if (found) {
    map.setView(found.data.coords, 15, { animate: true });
    found.marker.openPopup();
  } else {
    alert("Location not found. Try another search.");
  }
}

searchBtn.addEventListener("click", performSearch);
searchInput.addEventListener("keypress", (evt) => {
  if (evt.key === "Enter") {
    performSearch();
  }
});
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  markers.forEach(({ marker }) => marker.closePopup());
  map.setView([40.7128, -74.006], 13);
});

// Filter feature
const filterSelect = document.getElementById("category-filter");
const clearFilterBtn = document.getElementById("clear-filter-btn");

filterSelect.addEventListener("change", () => {
  const selected = filterSelect.value;
  if (selected === "all") {
    createMarkers(locations);
    map.setView([40.7128, -74.006], 13);
  } else {
    const filtered = locations.filter((loc) => loc.category === selected);
    createMarkers(filtered);
    if (filtered.length > 0) {
      map.fitBounds(filtered.map((loc) => loc.coords));
    }
  }
});

clearFilterBtn.addEventListener("click", () => {
  filterSelect.value = "all";
  createMarkers(locations);
  map.setView([40.7128, -74.006], 13);
});

// Geolocation feature
const locateBtn = document.getElementById("locate-btn");
let userMarker = null;

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }
  locateBtn.disabled = true;
  locateBtn.textContent = "Locating...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (userMarker) {
        map.removeLayer(userMarker);
      }

      const userIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
      userMarker.bindPopup("You are here").openPopup();

      map.setView([lat, lng], 15, { animate: true });
      locateBtn.disabled = false;
      locateBtn.textContent = "📍 My Location";
    },
    () => {
      alert("Unable to retrieve your location.");
      locateBtn.disabled = false;
      locateBtn.textContent = "📍 My Location";
    }
  );
});

// Fullscreen toggle button
const fullscreenBtn = document.getElementById("fullscreen-btn");

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.getElementById("map").requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
});

// Leaflet Draw Controls
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  edit: {
    featureGroup: drawnItems,
    remove: true,
  },
  draw: {
    polygon: true,
    polyline: false,
    rectangle: true,
    circle: true,
    marker: true,
    circlemarker: false,
  },
});
map.addControl(drawControl);

// Show informative popup on shape creation
map.on(L.Draw.Event.CREATED, (e) => {
  const layer = e.layer;

  let content = "";
  if (layer instanceof L.Marker) {
    content = `<b>Marker</b><br>Coordinates: ${layer
      .getLatLng()
      .lat.toFixed(5)}, ${layer.getLatLng().lng.toFixed(5)}`;
  } else if (layer instanceof L.Polygon) {
    // Polygon area in sq meters
    const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]).toFixed(2);
    content = `<b>Polygon</b><br>Area: ${area} sq meters`;
  } else if (layer instanceof L.Rectangle) {
    const bounds = layer.getBounds();
    content = `<b>Rectangle</b><br>Bounds:<br>SouthWest: ${bounds
      .getSouthWest()
      .lat.toFixed(5)},${bounds.getSouthWest().lng.toFixed(5)}<br>NorthEast: ${bounds
      .getNorthEast()
      .lat.toFixed(5)},${bounds.getNorthEast().lng.toFixed(5)}`;
  } else if (layer instanceof L.Circle) {
    const radius = layer.getRadius().toFixed(2);
    content = `<b>Circle</b><br>Center: ${layer
      .getLatLng()
      .lat.toFixed(5)}, ${layer.getLatLng().lng.toFixed(5)}<br>Radius: ${radius} meters`;
  }

  layer.bindPopup(content).openPopup();
  drawnItems.addLayer(layer);
});

// Function to save drawn shapes as GeoJSON - logs to console
function saveDrawnShapes() {
  const geoJson = drawnItems.toGeoJSON();
  console.log("Drawn shapes GeoJSON:", JSON.stringify(geoJson));
}

// Make function globally accessible for console use
window.saveDrawnShapes = saveDrawnShapes;
