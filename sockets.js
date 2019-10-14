var app = require('./app');
var socketio = require('socket.io');
var linebot = require('linebot'); // line串接
var MessengerPlatform = require('facebook-bot-messenger'); // facebook串接
var admin = require("firebase-admin"); //firebase admin SDK
var serviceAccount = require("./config/firebase-adminsdk.json"); //firebase admin requires .json auth
var databaseURL = require("./config/firebaseAdminDatabaseUrl.js");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL.url
});
var chat = require('./models/chats');
var agentChat = require('./models/agents');
var tags = require('./models/tags');
var keyword = require('./models/keywords');
var autoreply = require('./models/autos');
function init(server) {
    var io = socketio(server);
    var users = {};
    var addFriendBroadcastMsg; // 加好友參數
    var bot = []; // LINE bot設定
    var channelIds = [-1, -1, -1];
    var overview = {};
    var linebotParser = [
      function() {
        console.log("Enter channel_1 information first");
      },
      function() {
        console.log("Enter channel_2 information first");
      }
    ];
    //==============FACEBOOK MESSAGE==============
    app.post('/webhook', function (req, res) {
      var data = req.body;
      console.log('data on line 91');
      console.log(data);

      // Make sure this is a page subscription
      if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
          var pageID = entry.id;
          var timeOfEvent = entry.time;

          // Iterate over each messaging event
          entry.messaging.forEach(function(event) {
            console.log('this is event');
            console.log(event);
            if (event.message) {
              console.log('Entered');
              loadFbProfile(event, event.sender.id);
            }
            else {
              console.log("Webhook received unknown event: ", event);
            }
          });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        res.sendStatus(200);
      }else{
        console.log('on line 124');
      }
    });//app.post
    //==============FACEBOOK MESSAGE END==============
    app.post('/linehook1', function() {
      linebotParser[0](arguments[0], arguments[1], arguments[2]);
    });
    app.post('/linehook2', function() {
      linebotParser[1](arguments[0], arguments[1], arguments[2]);
    });
    io.on('connection', function (socket) {
      console.log('connected');
      /*===聊天室start===*/
      // 按照程式流程順序
      // 1.更新標籤
      socket.on('get tags from chat', () => {
        tags.get(function(tagsData){
          socket.emit('push tags to chat', tagsData);
        });
      });
      // 2.更新群組
      socket.on('update bot', (data) => {
        update_line_bot(data);
      });
      // 3.更新群組頻道
      socket.on('request channels', (userId)=> {
        admin.database().ref('users/' + userId).once('value', snap => {
          let chatInfo = snap.val();
          if(chatInfo){
            let chanId_1 = chatInfo.chanId_1;
            let chanId_2 = chatInfo.chanId_2;
            let fbPageId = chatInfo.fbPageId;
            socket.emit('response line channel', {
              chanId_1: chanId_1,
              chanId_2: chanId_2,
              fbPageId: fbPageId
            });
          } else {
            socket.emit('response line channel', {
              chanId_1: '',
              chanId_2: '',
              fbPageId: ''
            });
          }
        });
      });
      // 4.撈出歷史訊息
      socket.on('get json from back', () => {
        let sendData = [];
        chat.get(function(chatData){
          for( let i in chatData ) {
            let profile = chatData[i].Profile;
            let _lastMsg = chatData[i].Messages[ chatData[i].Messages.length-1 ];
            if( profile.recentChat != _lastMsg.time ) {
              profile.recentChat = _lastMsg.time;
              let timeArr = chatData[i].Messages.map( function(ele) {
                return ele.time;
              });
              let times = [];
              let j=0;
              const GAP = 1000*60*15; //15 min
              let headTime;
              let tailTime;
              while( j<timeArr.length ) {
                headTime = tailTime = timeArr[j];
                while( timeArr[j]-tailTime < GAP ) {
                  tailTime = timeArr[j];
                  j++;
                  if( j==timeArr.length ) break;
                }
                let num = tailTime-headTime;
                if( num<1000 ) num = 1000;
                times.push(num);
              }
              let sum = 0;
              for( let j in times ) sum += times[j];
              sum /= 60000;
              profile.totalChat = sum;
              profile.avgChat = sum/times.length;
              profile.chatTimeCount = times.length;
              if( isNaN(profile.avgChat) || profile.avgChat<1 ) profile.avgChat = 1;
              if( isNaN(profile.totalChat) || profile.totalChat<1 ) profile.totalChat  = 1;
              let updateObj = {};
              chat.updateObj(i,{
                "avgChat": profile.avgChat,
                "totalChat": profile.totalChat,
                "chatTimeCount": profile.chatTimeCount,
                "recentChat": profile.recentChat,
                "平均每次聊天時間": profile.avgChat,
                "總共聊天時間": profile.totalChat,
                "聊天次數": profile.chatTimeCount,
                "上次聊天時間": profile.recentChat
              });
            }
            let msgs = chatData[i].Messages;
            let position = 0;
            if( msgs.length>20 ) {
              position = msgs.length-20;
              msgs = msgs.slice(position);
            }
            sendData.push({
              Messages: msgs,
              position: position,
              Profile: profile
            });
          }
          socket.emit('push json to front', sendData);
        });
      });
      // 從SHIELD chat傳送訊息
      socket.on('send message', (data, callback) => {


        let msg = data.msg;
        let agent_sendTo_receiver = data.id === undefined ? "agent_sendTo_receiver undefined!" : data.id
        let chanId = data.channelId;
        let agent_nickname = socket.nickname ? socket.nickname : 'agent';
        var message;
        let nowTime = Date.now();
        //====send to fb or line====//
        if(chanId === 'FB_room'){
          send_to_FB(msg, agent_sendTo_receiver);
        }
        else {
          send_to_Line(msg, agent_sendTo_receiver, chanId);
        }
        // 傳到shield chat
        var msgObj = {
          owner: "agent",
          name: agent_nickname,
          time: nowTime,
          message: "undefined_message"
        };
        if(chanId === 'FB_room'){
          //------FACEBOOK-------
          if (msg.startsWith('/image')){
            // msgObj.message = data.msg+'"/>';
          }
          else if (msg.startsWith('/video')){
            // msgObj.message = data.msg+ '" type="video/mp4"></video>';
          }
          else if (msg.startsWith('/audio')){
            // msgObj.message = data.msg+ '" type="audio/mpeg"></audio>';
          }
          else {
            msgObj.message = data.msg;
          }
          emitIO_and_pushDB(msgObj, null, 'FB', agent_sendTo_receiver, 0);
        }
        else {
          // -----LINE-----
          let channelId = -1;
          if( channelIds.indexOf(chanId) !== -1 ) channelId = chanId;
          if (msg.includes('/image')) {
            msgObj.message = '傳圖檔給客戶';
          }
          else if (msg.includes('/audio')) {
            msgObj.message = '傳音檔給客戶';
          }
          else if (msg.includes('/video')) {
            msgObj.message = '傳影檔給客戶';
          }
          else if ( isUrl(msg) ) {
            let urlStr = '<a href=';
            if (msg.indexOf('https') !== -1 || msg.indexOf('http') !== -1) {
              urlStr += '"http://';
            }
            msgObj.message = urlStr + msg + '/" target="_blank">' + msg + '</a>';
          }
          else if (msg.includes('/sticker')) {
            msgObj.message = 'Send sticker to user';
          }
          else {
            msgObj.message = msg;
          }
          emitIO_and_pushDB(msgObj, null, channelId, agent_sendTo_receiver, 0);
        }
      }); //sent message
      // 更新客戶資料
      socket.on('update profile', (data, callback) => {
        chat.get(function(chatData){
          for( let i in chatData ) {
            if( isSameUser(chatData[i].Profile, data.userId, data.channelId) ) {
              let updateObj = {};
              for( let prop in data ) {
                updateObj[prop] = data[prop];
              }
              chat.updateObj(i,updateObj);
              break;
            }
          }
        });
      });
      // 當使用者要看客戶之前的聊天記錄時要向上滾動
      socket.on('upload history msg from front', data => {
        let userId = data.userId;
        let roomId = data.roomId;
        let head = data.head;
        let tail = data.tail;
        let sendData = [];
        chat.get(function(chatData){
          for( let i in chatData ) {
            if( isSameUser(chatData[i].Profile, userId, roomId) ) {
              for( let j=head; j<tail+1; j++ ) {
                sendData.push( chatData[i].Messages[j] );
              }
              break;
            }
          }
          socket.emit('upload history msg from back', {
            userId: userId,
            roomId: roomId,
            messages: sendData
          });
        });
      });
      // 訊息已讀
      socket.on('read message', data => {
        chat.get(function(chatData){
          for( let i in chatData ) {
            if( isSameUser(chatData[i].Profile, data.userId, data.channelId) ) {
              chat.updateObj(i,{ "unRead": 0 });
              break;
            }
          }
        });
      });
      /*===聊天室end===*/

      /*===內部聊天室start===*/
      // 傳遞對照表，轉換agent的Id及Name
      socket.on('get agentIdToName list', function() {
        admin.database().ref('users/').once('value', snap => {
          let agentData = snap.val();
          let agentIdToName = { "0": "System" };
          for( let prop in agentData ) {
            agentIdToName[prop] = agentData[prop].nickname;
          }
          socket.emit('send agentIdToName list', agentIdToName);
        });
      });
      // 新增內部聊天室
      socket.on('create internal room', (Profile) => {
        let time = Date.now();
        Profile.roomId = time;
        Profile.firstChat = time;
        Profile.recentChat = time;
        let data = {
          "Messages": [{
            "agentId": "0",
            "message": Profile.roomName+"已建立",
            "time": time
          }],
          "Profile": Profile
        };
        agentChat.create(data);
      });
      // 5.撈出內部聊天室紀錄
      socket.on('get internal chat from back', (data) => {
        let thisAgentData = [];
        agentChat.get(function(agentChatData){
          for( let i in agentChatData ){
            if( agentChatData[i].Profile.agent.indexOf(data.id) != -1 ) {
              thisAgentData.push( agentChatData[i] );
            }
          }
          admin.database().ref('users/').once('value', snap => {
            let agentData = snap.val();
            let agentIdToName = { "0": "System" };
            for( let prop in agentData ) {
              agentIdToName[prop] = agentData[prop].nickname;
            }
            let internalTagsData = [
              { "name": "roomName", "type": "text", "set": "single", "modify": true },
              { "name": "description", "type": "text", "set": "multi", "modify": true },
              { "name": "owner", "type": "single-select", "set": [], "modify": true },
              { "name": "agent", "type": "multi-select", "set": [], "modify": true },
              { "name": "recentChat", "type": "time", "set": "", "modify": false },
              { "name": "firstChat", "type": "time", "set": "", "modify": false }
            ]
            socket.emit('push internal chat to front', {
              data: thisAgentData,
              agentIdToName: agentIdToName,
              internalTagsData: internalTagsData
            });
          });
        });
      });
      // 內部聊天室傳訊息
      socket.on('send internal message', (data) => {
        let roomId = data.roomId;
        emitIO_and_pushDB_internal(data.sendObj, roomId, socket.nickname);
      });
      // 更新內部聊天室右邊的資料
      socket.on('update internal profile', data => {
        agentChat.get(function(agentChatData){
          for( let i in agentChatData ) {
            if( agentChatData[i].Profile.roomId == data.roomId ) {
              let updateObj = {};
              for( let prop in data ) {
                updateObj[prop] = data[prop];
              }
              agentChat.updateProf(i, updateObj);
              break;
            }
          }
        });
      });
      /*===內部聊天室end===*/

      /*===訊息start===*/
      //更新關鍵字回覆
      socket.on('update add friend message', data => {
        addFriendBroadcastMsg = data;
      });
      socket.on('update overview', (data) => {
        overview[data.message] = data.time;
      });
      /*===訊息end===*/
      /*===設定start===*/
      // going to tags page
      socket.on('get tags from tags', () => {
        tags.get(function(tagsData){
          socket.emit('push tags to tags', tagsData);
        });
      });
      socket.on('update tags', data => {
        let updateObj = {};
        updateObj['/Data'] = data;
        tags.update(updateObj);
      });
      /*===設定end===*/
      // 新使用者
      socket.on('new user', (data, callback) => {
        if (data in users) {
          callback(false);
        }
        else {
          callback(true);
          socket.nickname = data;
          users[socket.nickname] = socket;
        }
      });
      socket.on('disconnect', (data) => {
        if (!socket.nickname) return;
        delete users[socket.nickname];
      });
    });
    // FUNCTIONS
    //==============LINE MESSAGE==============
    function bot_on_message(event) {
      let channelId = this.options.channelId; // line群組ID
      let message_type = event.message.type; // line訊息類別 text, location, image, video...
      let receiverId = event.source.userId; // line客戶ID
      let nowTime = Date.now(); // 現在時間
      event.source.profile().then(function(profile) {
        let receiver_name = profile.displayName; // 客戶姓名
        let pictureUrl = profile.pictureUrl; // 客戶的profile pic
        if( receiver_name === undefined ) receiver_name = "userName_undefined";
        let msgObj = {
          owner: "user",
          name: receiver_name,
          time: nowTime,
          message: "undefined_message"
        };
        let replyMsgObj = {
          owner: "agent",
          name: "undefined name",
          time: nowTime,
          message: "undefined message"
        };
        //  ===================  訊息類別 ==================== //
        if (message_type === 'sticker') { // 貼圖
          let packageId = event.message.packageId;
          let stickerId = event.message.stickerId;
          msgObj.message = '<img src="https://sdl-stickershop.line.naver.jp/stickershop/v1/sticker/'+stickerId+'/android/sticker.png"' +
          'width="20%" alt="sticker cant display!"/>';
          emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
        }
        else if (message_type === 'location') { // 地點
          msgObj.message = 'Location received: ';
          emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);

          event.message.content().then(function(content) {
            let latitude = event.message.latitude;
            let longitude = event.message.longitude;
            msgObj.message = '<a target="_blank" href=" https://www.google.com.tw/maps/place/' + content.toString('base64')
            + '/@' + latitude + ',' + longitude + ',15z/data=!4m5!3m4!1s0x0:0x496596e7748a5757!8m2!3d'
            + latitude + '!4d' + longitude + '">'+event.message.address+'</a>';
            emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
          }).catch(function(error) {
            console.log('location error: ' + error);
          });
        }//地點
        else if (message_type === 'image') { // 圖檔
          msgObj.message = '圖檔已接收，請稍等。';
          emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
          event.message.content().then(function(content) {
            msgObj.message = '<a href="data:image/png;base64,' + content.toString('base64') + '" ' +
            ' target="_blank" ><img src="data:image/png;base64,' + content.toString('base64') + '" ' +
            'width="20%" alt="image embedded using base64 encoding!"/></a>';
            emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
          }).catch(function(error) {
            console.log('image error: ' + error);
          });
        }
        else if (message_type === 'audio') {
          msgObj.message = '音檔已接收，請稍等。';
          emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
          event.message.content().then(function(content) {
            msgObj.message = '<audio controls><source src="data:audio/mp4;base64,' + content.toString('base64') + '" ' +
            '" type="audio/mp4"></audio>';
            emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
          }).catch(function(error) {
            console.log('audio error: ' + error);
          });
        }
        else if (message_type === 'video') {
          msgObj.message = '影檔已接收，請稍等。';
          emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);

          event.message.content().then(function(content) {

            msgObj.message = '<video width="20%" controls><source src="data:video/mp4;base64,' + content.toString('base64') + '" ' +
            '" type="video/mp4"></video>';
            emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
          }).catch(function(error) {
            console.log('video error: ' + error);
          });
        }
        else if (message_type === 'text' ) { // 判斷連結
          let message_lineTochat = event.message.text; // line訊息內容

          if( isUrl(message_lineTochat) ) {
            let urlStr = '<a href=';
            if (message_lineTochat.indexOf('http') === -1) {
              urlStr += '"http://';
            }
            msgObj.message = urlStr + message_lineTochat + '/" target="_blank">' + message_lineTochat + '</a>';
            emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);
          }
          else {
            msgObj.message = message_lineTochat;
            emitIO_and_pushDB(msgObj, pictureUrl, channelId, receiverId, 1);

            //===some auto reply===//
            if (keywordsReply(message_lineTochat)!==-1){
              console.log('keywordsreply bot replied!');
            }
            else if( autoReply(message_lineTochat)!==-1 ) {
              console.log("autoreply bot replyed!");
            }
            else {
              console.log("no auto reply bot work! wait for agent reply");
            }
            //===auto reply end===//
          }
        } //end if message_type = text
        function keywordsReply(msg) {
          replyMsgObj.name = "KeyWords Reply";
          let sent = false;
          keyword.get(function(keywordData){
            for (let i in keywordData) {
              for( let j in keywordData[i] ) {
                let thisData = keywordData[i][j];
                if(thisData.taskCate=="開放") {
                  let keywords = JSON.parse(JSON.stringify(thisData.taskSubK));
                  keywords.push(thisData.taskMainK);
                  keywords.map(function(word) {
                    if( msg.trim().toLowerCase() == word.trim().toLowerCase() ) {
                      sent = true;
                      for( let k in thisData.taskText ) {
                        replyMsgObj.message = thisData.taskText[k];
                        emitIO_and_pushDB(replyMsgObj, null, channelId, receiverId, 1);
                        send_to_Line(thisData.taskText[k], receiverId, channelId);
                      }
                    }
                  });
                }
              }
            }
            if( !sent ) return -1;
          });
        }
        function autoReply(msg){
          replyMsgObj.name = "Auto Reply";
          sent = false;
          autoreply.get(function(autoreplyData){
            for(let i in autoreplyData) {
              for( let j in autoreplyData[i] ) {
                thisAutoReply = autoreplyData[i][j];
                var starttime = new Date(thisAutoReply.taskStart).getTime() - 60*60*1000*8; //time需要轉換成毫秒並減去8小時
                var endtime = new Date(thisAutoReply.taskEnd).getTime() - 60*60*1000*8; //time需要轉換成毫秒並減去8小時
                var nowtime = new Date().getTime();
                if(nowtime >= starttime && nowtime < endtime){
                  replyMsgObj.message = thisAutoReply.taskText;
                  emitIO_and_pushDB(replyMsgObj, null, channelId, receiverId, 1);
                  send_to_Line(thisAutoReply.taskText, receiverId, channelId);
                  sent = true;
                }
              }
            }
            if( !sent ) return -1;
          });
        }
      });
    } // end of bot_on_message
    function bot_on_follow(event){
      let follow_message = [];
      if(addFriendBroadcastMsg === []){
        follow_message.push('感謝您將本帳號設為好友！');
      }else{
        follow_message = [];
        follow_message = addFriendBroadcastMsg;
      }
      event.reply(follow_message);
    } // end of bot_on_follow
    function update_line_bot( chanInfo ) {
      if( chanInfo.hasOwnProperty("line_1") ) {
        bot[0] = linebot(chanInfo.line_1);
        linebotParser[0] = bot[0].parser();
        bot[0].on('message', bot_on_message);
        bot[0].on('follow', bot_on_follow);
        channelIds[0] = chanInfo.line_1.channelId;
      }
      if( chanInfo.hasOwnProperty("line_2") ) {
        bot[1] = linebot(chanInfo.line_2);
        linebotParser[1] = bot[1].parser();
        bot[1].on('message', bot_on_message);
        bot[1].on('follow', bot_on_follow);
        channelIds[1] = chanInfo.line_2.channelId;
      }
      if( chanInfo.hasOwnProperty("fb") ) {
        let fb = chanInfo.fb;
        if( [fb.pageID, fb.appID, fb.appSecret, fb.validationToken, fb.pageToken].every( (ele) => {
          return ele;
        }) ) {
          fb_bot = MessengerPlatform.create(chanInfo.fb);
        }
        channelIds[2] = chanInfo.fb.pageId;
      }
    } // end of update_line_bot
    function send_to_FB(msg, receiver) {
      if (msg.startsWith('/image')) {
        let link = msg.substr(7);
        fb_bot.sendImageMessage(receiver, link, true);
      }
      else if (msg.startsWith('/video')) {
        let link = msg.substr(7);
        fb_bot.sendVideoMessage(receiver, link, true);
      }
      else if (msg.startsWith('/audio')) {
        let link = msg.substr(7);
        fb_bot.sendAudioMessage(receiver, link, true);
      }
      else {
        fb_bot.sendTextMessage(receiver, msg);
      }
    }
    function send_to_Line(msg, receiver, chanId) {
      let message = {};
      if(msg.includes('/image')){
        let link = msg.substr(7);
        message = {
          type: "image",
          originalContentUrl: link,
          previewImageUrl: link
        };
      }
      else if(msg.includes('/audio')){
        let link = msg.substr(7);
        message = {
          type: "audio",
          originalContentUrl: link,
          duration: 240000
        };
      }
      else if(msg.includes('/video')){
        let link = msg.substr(7);
        message = {
          type: "video",
          originalContentUrl: link,
          previewImageUrl: "https://tinichats.com/assets/images/tab.png"
        };
      }
      else if (msg.includes('/sticker')) {
        message = {
          type: "sticker",
          packageId: parseInt(msg.substr(msg.indexOf(' '))),
          stickerId: parseInt(msg.substr(msg.lastIndexOf(' ')))
        };
      }
      else {
        message = {
          type: "text",
          text: msg
        };
      }
      if(chanId === channelIds[0]){
        bot[0].push(receiver, message);
      }
      else if(chanId === channelIds[1]) {
        bot[1].push(receiver, message);
      }
    }
    function emitIO_and_pushDB(obj, pictureUrl, channelId, receiverId, unRead) {
      send_to_firebase(obj, pictureUrl, channelId, receiverId, unRead);
    }
    function send_to_firebase(obj, pictureUrl, channelId, receiverId, unRead){
      let flag = true;
      let count_unread = unRead;    //0 or 1
      chat.get(function(chatData){
        for( let prop in chatData ) {
          let data = chatData[prop];
          if( isSameUser(data.Profile, receiverId, channelId) ) {
            let length = data.Messages.length;    //訊息總長度
            count_unread += data.Profile.unRead;    //新的UNREAD加上舊的UNREAD數目
            let updateObj = {};       //建立update物件
            updateObj['/'+prop+'/Messages/'+length] = obj;  //將最新一則的訊息放至訊息陣列的最後
            if( unRead>0 ) updateObj['/'+prop+'/Profile/unRead'] = count_unread;    //如果新訊息是user發的，則須更新unread
            if( pictureUrl ) updateObj['/'+prop+'/Profile/pictureUrl'] = pictureUrl;    //如果有獲得user的頭貼，則更新頭貼
            else pictureUrl = data.Profile.pictureUrl;      //如果無獲得user的頭貼，則將原本頭貼傳回全端
            chat.update(updateObj);
            flag = false;
            break;
          }
        }
        if( flag ) {
          let newData = {
            Profile: {
              nickname: obj.name,
              userId: receiverId,
              channelId: channelId,
              age: -1,
              telephone: "",
              address: "",
              firstChat: Date.now(),
              首次聊天時間: Date.now(),
              recentChat: Date.now(),
              上次聊天時間: Date.now(),
              totalChat: 1,
              總共聊天時間: 1,
              avgChat: 1,
              平均每次聊天時間: 1,
              聊天次數: 1,
              unRead: 1,
              photo: pictureUrl? pictureUrl :""
            },
            Messages: [obj]
          };
          chat.create(newData);
          io.sockets.emit('new user profile', newData.Profile);
        }
        send_to_frontSocket(obj, pictureUrl, channelId, receiverId, count_unread);
      });
    }
    function send_to_frontSocket(obj, pictureUrl, channelId, receiverId, unRead) {
      let data = JSON.parse(JSON.stringify(obj));
      data.unRead = unRead;
      data.channelId = channelId;
      data.id = receiverId;
      data.pictureUrl = pictureUrl;
      io.sockets.emit('new message', data);
    }
    function emitIO_and_pushDB_internal(obj, roomId, agentNick) {
      send_to_firebase_internal(obj, roomId);
      send_to_frontSocket_internal(obj, roomId, agentNick);
    }
    function send_to_firebase_internal(obj, roomId) {
      agentChat.get(function(agentChatData){
        for( let prop in agentChatData ) {
          let data = agentChatData[prop];
          if( data.Profile.roomId == roomId ) {
            let length = data.Messages.length;    //訊息總長度
            let updateObj = {};       //建立update物件
            updateObj['/'+prop+'/Messages/'+length] = obj;  //將最新一則的訊息放至訊息陣列的最後
            agentChat.update(updateObj);
            let updateProfObj = {
              "recentChat": obj.time
            };
            agentChat.updateProf(prop, updateProfObj);
            break;
          }
        }
      });
    }
    function send_to_frontSocket_internal(obj, roomId, agentNick) {
      let data = JSON.parse(JSON.stringify(obj));
      data.roomId = roomId;
      data.agentNick = agentNick;
      io.sockets.emit('new internal message', {
        sendObj: data,
        roomId: roomId
      });
    }
    function isUrl(str) {
      if(str.indexOf('.com') !== -1 ) return true;
      else if(str.indexOf('.edu') !== -1 ) return true;
      else if(str.indexOf('.net') !== -1 ) return true;
      else if(str.indexOf('.io') !== -1 ) return true;
      else if(str.indexOf('.org') !== -1 ) return true;
      return false;
    } // end of isUrl
    function isSameUser(profile, userId, channelId) {
      return profile.userId == userId && profile.channelId == channelId;
    }
    function loadFbProfile(obj, psid) {
      fb_bot.webhook('/webhook');
      fb_bot.getProfile(psid).then(function(data) {
        var count_unread_toFront;
        var fb_user_name = data.first_name + ' ' + data.last_name;
        var fb_user_profilePic = data.profile_pic;
        var fb_user_locale = data.locale;
        var fb_user_gender = data.gender;
        if (obj.message.attachments) {
          //Checking if there are any image attachments
          if (obj.message.attachments[0].type === "image") {
            var imageURL = obj.message.attachments[0].payload.url;
            obj.message = '<img src="' + imageURL + '" style="height:100px;width:100px;"/>';
          } //if image
          else if (obj.message.attachments[0].type === "video") {
            var videoURL = obj.message.attachments[0].payload.url;
            obj.message = '<video controls><source src="' + videoURL + '" type="video/mp4"></video>';
          } //if video
          else if (obj.message.attachments[0].type === "audio") {
            var audioURL = obj.message.attachments[0].payload.url;
            obj.message = '<audio controls><source src="' + audioURL + '" type="audio/mpeg"/></audio>';
          } //if audio
          else if (obj.message.attachments[0].type === "file") {
            var fileURL = obj.message.attachments[0].payload.url;
            obj.message = 'The user sent a file, click <a target="blank" href="' + fileURL + '">HERE</a> for download.';
          } //if audio
          else if (obj.message.attachments[0].type === "location") {
            var locateURL = obj.message.attachments[0].url;
            obj.message = 'The user sent a location, click <a target="blank" href="' + locateURL + '">HERE</a> for map link.';
          } //if location
        } else {
          obj.message = obj.message.text;
        }
        chat.get(function(chatData){
          for (let prop in chatData) {
            if ( isSameUser(chatData[prop].Profile, obj.sender.id, 'fb') ) {
              count_unread_toFront = chatData[prop].Profile.unRead;
              count_unread_toFront++;
            }
          } //for let prop in chatData
        });
        obj.id = obj.sender.id;
        obj.owner = obj.recipient.id;
        obj.name = fb_user_name;
        obj.time = obj.timestamp;
        obj.unRead = count_unread_toFront;
        obj.channelId = 'FB';
        obj.pictureUrl = fb_user_profilePic;
        io.sockets.emit('new message', obj);
        //======receive message==========
        var senderID = obj.sender.id;
        var recipientID = obj.recipient.id;
        var timeOfMessage = obj.timestamp;
        var message_text = obj.message;
        //===========================================
        //=============saving to database============
        let message_lineTochat = message_text;
        let receiverId = senderID;
        let receiver_name = fb_user_name;
        let nowTime = Date.now();
        var msgObj = {
          owner: "user",
          name: receiver_name,
          time: nowTime,
          message: message_lineTochat,
          id: receiverId,
          prof_pic: fb_user_profilePic,
          locale: fb_user_locale,
          gend: fb_user_gender
        };
        function emitIO_and_pushDB(obj) {
          sendToNewFb(obj);
        }
        function sendToNewFb(obj) {
          let flag = true;
          chat.get(function(chatData){
            for (let prop in chatData) {
              if ( isSameUser(chatData[prop].Profile, receiverId, 'fb') ) {
                var count_unread = chatData[prop].Profile.unRead;
                count_unread++;
                let length = chatData[prop].Messages.length;
                let updateObj = {};
                updateObj['/' + prop + '/Messages/' + length] = obj;
                chat.update(updateObj);
                chat.updateObj(prop, {
                  unRead: count_unread,
                  photo: obj.prof_pic
                });
                flag = false;
                break;
              }
            }
            if (flag) {
              let newData = {
                Profile: {
                  nickname: obj.name,
                  userId: obj.id,
                  age: -1,
                  地區: obj.locale,
                  性別: obj.gend,
                  telephone: "",
                  address: "",
                  channelId: 'FB',
                  firstChat: nowTime,
                  首次聊天時間: nowTime,
                  recentChat: nowTime,
                  上次聊天時間: nowTime,
                  totalChat: 1,
                  總共聊天時間: 1,
                  avgChat: 1,
                  平均每次聊天時間: 1,
                  聊天次數: 1,
                  unRead: 1,
                  photo: obj.prof_pic
                },
                Messages: [obj]
              };
              chat.create(newData);
              io.sockets.emit('new user profile', newData.Profile);
            }
          });
        } //sendTONewFb
        emitIO_and_pushDB(msgObj);
      }).catch(function(error) {
        console.log('error: loadFbProfile');
        console.log(error);
      }); //fb_bot
    } //loadFbProfile
    return io;
}

module.exports = init;
