var admin = require("firebase-admin"); //firebase admin SDK
var chat = {}; // 宣告物件因為module需要物件
chat.get = callback => {
  admin.database().ref().child('chats/Data').once('value', snapshot=> {
    let chatData;
    if(snapshot.val() !== null){
      chatData = snapshot.val();
    }
    callback(chatData);
  });
}
chat.create = obj => {
  admin.database().ref().child('chats/Data').push(obj);
}
chat.update = obj => {
  admin.database().ref().child('chats/Data').update(obj);
}
chat.updateObj = (i,obj) => {
  admin.database().ref().child('chats/Data').child(i).child("Profile").update(obj);
}
module.exports = chat;
