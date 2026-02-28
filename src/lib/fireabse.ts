import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
const firebaseConfig = {
 apiKey: "AIzaSyDbChCw9SHG_a8hWz6KCVzjaKL4HXLADqw",
  authDomain: "filimehome.firebaseapp.com",
  projectId: "filimehome",
  storageBucket: "filimehome.firebasestorage.app",
  messagingSenderId: "603634695155",
  appId: "1:603634695155:web:7396941f51d66d6179f086"
};


const app = initializeApp(firebaseConfig);

let analytics: ReturnType<typeof getAnalytics> | null = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, analytics };
