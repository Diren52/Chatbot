var admin = require("firebase-admin"); //firebase admin SDK
var tags = {};
tags.get = function(callback){
  admin.database().ref().child('tags').once('value', snapshot=> {
    let tagsData;
    if(snapshot.val() !== null){
      tagsData = snapshot.val().Data;
    } else {
      let data = require("../config/default-tag.json");
      tagsData = data.Data;   //這行是只將default tag放進前端，但不存進firebase
      console.log('tags loaded');
    }
    callback(tagsData);
  });
};
tags.update = obj => {
  admin.database().ref().child('tags').update(obj);
};
module.exports = tags;
