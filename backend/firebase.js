import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAot-7TNSjvRw8PdfH_17uG9i_GZY2aDFI",
    authDomain: "smartworkart-92d0e.firebaseapp.com",
    projectId: "smartworkart-92d0e",
    storageBucket: "smartworkart-92d0e.firebasestorage.app",
    messagingSenderId: "79450209986",
    appId: "1:79450209986:web:764a85c6a6d4ce9149c55b"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
