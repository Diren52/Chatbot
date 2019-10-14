var admin = require("firebase-admin"); //firebase admin SDK
var auto = {};
auto.get = function(callback){
  admin.database().ref().child('message-autoreply').once('value', snapshot=> {
    let autoreplyData;
    if(snapshot.val() !== null){
      autoreplyData = snapshot.val();
    }
    callback(autoreplyData);
  });
}
module.exports = auto;
