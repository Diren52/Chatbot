var admin = require("firebase-admin"); //firebase admin SDK
var keyword = {};
keyword.get = function(callback){
  admin.database().ref().child('message-keywordsreply').once('value', snapshot=> {
    let keywordData;
    if(snapshot.val() !== null){
      keywordData = snapshot.val();
    }
    callback(keywordData);
  });
}
module.exports = keyword;
