var admin = require("firebase-admin"); //firebase admin SDK
var agentChat = {};
agentChat.get = function(callback){
  admin.database().ref().child('chats/AgentChatData').once('value', snapshot=> {
    let agentData;
    if(snapshot.val() !== null){
      agentData = snapshot.val();
    }
    callback(agentData);
  });
}
agentChat.create = obj => {
  admin.database().ref().child('chats/AgentChatData').push(obj);
}
agentChat.update = obj => {
  admin.database().ref().child('chats/AgentChatData').update(obj);
}
agentChat.updateProf = (i,obj) => {
  admin.database().ref().child('chats/AgentChatData').child(i).child("Profile").update(obj);
}
module.exports = agentChat;
