// Initialize Firebase
firebase.initializeApp(config);
const auth = firebase.auth();
const database = firebase.database();


//use post request to get custom token
var app = require('.../app');
var custom_token;
app.post('https://api.line.me/oauth2/v2.1/token', function(req, res){
  custom_token = res.id_token;
});

firebase.auth().signInWithCustomToken(custom_token).catch(function(error) {
  var errorCode = error.code;
  var errorMessage = error.message;
  console.log(errorCode, errorMessage);
});

// log in status
if(window.location.pathname === '/login' || window.location.pathname === '/signup'){
  auth.onAuthStateChanged(user => {
    if(user){
      window.location = '/chat';
    } else {
      console.log('need to sign in');
    }
  });
} else {
  auth.onAuthStateChanged(user => {
    if(!user){
      window.location = '/login';
    }
  });
}

// functions
function logout(){
  auth.signOut()
  .then(response => {
    window.location = '/login';
  })
}
