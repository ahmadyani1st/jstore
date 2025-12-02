  // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCrdGHXxVKQ2BiU6___9fOqVDwIECLq8pk",
        authDomain: "jejak-mufassir.firebaseapp.com",
        databaseURL: "https://jejak-mufassir-default-rtdb.firebaseio.com",
        projectId: "jejak-mufassir",
        storageBucket: "jejak-mufassir.appspot.com",
        messagingSenderId: "469253249038",
        appId: "1:469253249038:web:32f85e975d23225bc9c45f",
        measurementId: "G-TXMEYE5MR8"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const auth = firebase.auth();
