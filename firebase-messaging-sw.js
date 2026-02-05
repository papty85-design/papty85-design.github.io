// Firebase Messaging Service Worker - PER /MealPlanner/
// Questo file DEVE essere nella root o nella cartella MealPlanner

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configurazione Firebase (usa la stessa configurazione dell'app)
const firebaseConfig = {
  apiKey: "AIzaSyAp_2VabxjEQek4Oo8118wSOsisoytyJ_I",
  authDomain: "menu-settimanale-2913d.firebaseapp.com",
  databaseURL: "https://menu-settimanale-2913d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "menu-settimanale-2913d",
  storageBucket: "menu-settimanale-2913d.firebasestorage.app",
  messagingSenderId: "974523761082",
  appId: "1:974523761082:web:4f4ad5c5d2b978e9f55d83"
};

// Inizializza Firebase nel service worker
firebase.initializeApp(firebaseConfig);

// Recupera l'istanza di messaging
const messaging = firebase.messaging();

// FUNZIONE HELPER PER FORMATTARE I MESSAGGI
function getNotificationTitle(payload) {
  // Priorità: notification.title > data.title > default
  if (payload.notification && payload.notification.title) {
    return payload.notification.title;
  }
  if (payload.data && payload.data.title) {
    return payload.data.title;
  }
  return 'Menu Famiglia';
}

function getNotificationBody(payload) {
  // Priorità: notification.body > data.body > messaggio formattato dai data
  if (payload.notification && payload.notification.body) {
    return payload.notification.body;
  }
  
  if (payload.data && payload.data.body) {
    return payload.data.body;
  }
  
  // Se c'è un tipo specifico di notifica nei data, formatta il messaggio
  if (payload.data) {
    const type = payload.data.type;
    const day = payload.data.day;
    
    switch(type) {
      case 'menu_update':
        if (day) {
          const giorni = {
            'Lunedì': 'Lunedì',
            'Martedì': 'Martedì', 
            'Mercoledì': 'Mercoledì',
            'Giovedì': 'Giovedì',
            'Venerdì': 'Venerdì',
            'Sabato': 'Sabato',
            'Domenica': 'Domenica'
          };
          return `${giorni[day] || day} - Menu aggiornato da ${payload.data.from || 'un membro della famiglia'}`;
        }
        return 'Il menu è stato aggiornato';
        
      case 'shopping_update':
        return 'La lista della spesa è stata modificata';
        
      case 'member_joined':
        return `${payload.data.memberName || 'Un nuovo membro'} si è unito alla famiglia!`;
        
      default:
        return 'Nuovo aggiornamento disponibile';
    }
  }
  
  return 'Nuovo aggiornamento disponibile';
}

// Gestione notifiche in background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Messaggio ricevuto in background:', payload);

  const notificationTitle = getNotificationTitle(payload);
  const notificationBody = getNotificationBody(payload);
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/MealPlanner/icon-192.png',
    badge: '/MealPlanner/icon-192.png',
    data: payload.data || {},
    tag: 'menu-famiglia-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Apri App'
      },
      {
        action: 'close',
        title: 'Chiudi'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gestione click sulla notifica
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notifica cliccata:', event);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Se c'è già una finestra aperta, mettila in focus
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes('MealPlanner') && 'focus' in client) {
              return client.focus();
            }
          }
          // Altrimenti apri una nuova finestra
          if (clients.openWindow) {
            return clients.openWindow('/MealPlanner/index.html');
          }
        })
    );
  }
});

// Gestione errori
self.addEventListener('error', (event) => {
  console.error('[firebase-messaging-sw.js] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[firebase-messaging-sw.js] Service Worker unhandled rejection:', event.reason);
});

// Log quando il service worker viene installato
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installato');
  self.skipWaiting();
});

// Log quando il service worker viene attivato
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker attivato');
  event.waitUntil(clients.claim());
});
