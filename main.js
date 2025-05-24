  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyBc-x0sFbt16lzmMx77dLwysXGJUOsXKsY",
    authDomain: "bustrackerweb.firebaseapp.com",
    projectId: "bustrackerweb",
    storageBucket: "bustrackerweb.appspot.com",
    messagingSenderId: "325393024111",
    appId: "1:325393024111:web:d78728eb97180a03aeb99a",
    measurementId: "G-TRVJFYPJXZ",
    databaseURL: "https://bustrackerweb-default-rtdb.europe-west1.firebasedatabase.app"
  };

  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  // Карта
  let map = L.map('map').setView([49.9567, 82.6075], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let busMarkers = {};

  function createBusMarker(busNumber) {
    const html = `
      <div class="vehicle-marker">
        <div class="vehicle-drop">
          <img src="https://oskemenbus.kz/assets/images/map-icons/vehicle-icons/background/bus.svg" alt="bg">
          <img src="https://oskemenbus.kz/assets/images/map-icons/vehicle-icons/icon/bus.svg" alt="icon">
        </div>
        <div class="vehicle-label">
          <span>${busNumber}</span>
        </div>
      </div>
    `;
    return L.divIcon({
      html: html,
      className: '',
      iconSize: [90, 25],
      iconAnchor: [45, 12],
      popupAnchor: [0, -25]
    });
  }

  function startTracking(busNumber) {
    if (!busNumber) {
      alert("Введите номер автобуса");
      return;
    }
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(function(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        database.ref('buses/' + busNumber).set({
          latitude: lat,
          longitude: lon,
          timestamp: new Date().toISOString()
        });
      }, function(error) {
        alert("Ошибка получения координат: " + error.message);
      });
    } else {
      alert("Геолокация не поддерживается этим устройством");
    }
  }

  let watchId = null;
  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  database.ref('buses').on('value', function(snapshot) {
    for (let key in busMarkers) {
      map.removeLayer(busMarkers[key]);
    }
    busMarkers = {};

    snapshot.forEach(function(childSnapshot) {
      let bus = childSnapshot.val();
      let marker = L.marker([bus.latitude, bus.longitude], {
        icon: createBusMarker(childSnapshot.key)
      }).addTo(map).bindPopup(
        "Автобус № " + childSnapshot.key + "<br>Время: " + bus.timestamp
      );
      busMarkers[childSnapshot.key] = marker;
    });
  });

  window.addEventListener('beforeunload', () => {
    stopTracking();
  });
