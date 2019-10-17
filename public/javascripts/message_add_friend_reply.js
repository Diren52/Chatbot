var socket = io.connect();
var idArray = []; // insert each message id for modify old message's purpose
var objArray = []; // insert each message obj
var textArray = []; // insert each message text from message obj
var newMsgArray = []; // insert each new message id
var currentCount = 0; // existing message count
var newCount = 0; // new message count from addMsgCanvas
$(document).ready(function(){
  $(document).on('click', '#signout-btn', logout); //登出
  $(document).on('click', '#save', modalSubmit );
  $(document).on('click', '#addbtn', addMsgCanvas);
  $(document).on('click', '#delete', delMsgCanvas);
  setTimeout(loadFriendsReply, 1000);
});
function loadFriendsReply(){
  let userId = auth.currentUser.uid;
  objArray = []; // empty the array first
  textArray = []; // get a new array to emit
  database.ref('message-addfriendsreply/' + userId).once('value', snap => {
    let testVal = snap.val();
    if(testVal !== null){
      let myIds = Object.keys(testVal);
      idArray = myIds;
      for (var i = 0; i < myIds.length; i++){
        objArray.push(snap.child(myIds[i]).val());
        let loadMsg = '<!--TEXT AREA -->' +
            '<tr id="'+myIds[i]+'-row">' +
              '<th style="padding:1%; margin:2% 1% 2% 1%; background-color: #ddd">請輸入文字:</th>' +
            '</tr>' +
            '<tr id="'+myIds[i]+'-row">' +
              '<td style="background-color: #ddd">' +
                '<span style="float:right" id="delete"> 刪除 </span>' +
                '<form onsubmit="event.preventDefault();" style="padding:1%; margin:1%">' +
                  '<textarea id="'+myIds[i]+'" style="width:100%;height:100px">'+objArray[i].taskText+'</textarea>' +
                '</form>' +
              '</td>' +
            '</tr>';
        $('#MsgCanvas').append(loadMsg);
        textArray.push(objArray[i].taskText);
        currentCount = textArray.length;
      }
      emitToServer(textArray);
    }
  });
} // end of loadFriendsReply
function addMsgCanvas(){
  if((currentCount+newCount) < 5){
    ++newCount;
    let MsgCanvas = '<!--TEXT AREA -->' +
        '<tr id="'+newCount+'-row">' +
          '<th style="padding:1%; margin:2% 1% 2% 1%; background-color: #ddd">請輸入文字:</th>' +
        '</tr>' +
        '<tr id="'+newCount+'-row">' +
          '<td style="background-color: #ddd">' +
            '<span style="float:right" id="delete"> 刪除 </span>' +
            '<form onsubmit="event.preventDefault();" style="padding:1%; margin:1%">' +
              '<textarea id="newText'+newCount+'" style="width:100%;height:100px"></textarea>' +
            '</form>' +
          '</td>' +
        '</tr>';
    $('#MsgCanvas').append(MsgCanvas);
    idArray.push("newText"+newCount);
  }else{
    $('#error').show();
    setTimeout(()=>{
      $('#error').hide();
    }, 5000)
  }
} // end of addMsgCanvas
function delMsgCanvas(){ // 如果只是新增一個空的tr再刪除會止移除第二個tr
  if($(this).parent().parent().attr('id') === undefined){
    location.reload();
  }else{
    let uid = auth.currentUser.uid; // 使用者的uid
    let id = $(this).parent().parent().attr('id'); // 該元素的ID i.e. id="-Kwi17XstCn15xTtVKuh-row"
    let substrId;
    if(id.charAt(0) === '-'){
      substrId = id.substr(0,20); // 把ID的"-row"拿掉
      if(confirm('確定要刪除嗎？')){
        database.ref('message-addfriendsreply/'+uid+'/'+substrId).remove();
      }
    }else{
      substrId = id.substr(0,1);
    }
    $(this).parent().parent().siblings('#'+id).remove();
    $(this).parent().parent().remove();
    idArray.splice(idArray.indexOf(substrId),1);
    --currentCount;
  }
} // end of delMsgCanvas
function modalSubmit(){ // 送出新增
  let totalCount = currentCount + newCount; // 確認修改的筆數
  for(let i=0;i<totalCount;i++){ // for id is a serial number
    if($('#'+idArray[i]).val().trim() !== ''){
      let MsgInfo = {
        currentDateTime:Date.now(),
        inp:$('#'+idArray[i]).val(),
        currentUserEmail:auth.currentUser.email.toString()
      }
      if(idArray[i].charAt(0) !== '-'){
        newMsgArray.push($('#'+idArray[i]).val());
        writeUserData(MsgInfo);
      }else{
        MsgInfo.serial = idArray[i];
        updateUserData(MsgInfo);
      }
    }else{
      alert('Please fill in the space');
    }
  }
  //塞入資料庫並重整
  alert('Saved!');
} // end of modalSubmit
function writeUserData(obj){ // 寫進資料庫
  let userId = auth.currentUser.uid;
  database.ref('message-addfriendsreply/' + userId).push({
    taskText: obj.inp,
    owner: obj.currentUserEmail,
    modifiedDate: obj.currentDateTime
  });
} // end of writeUserData
function updateUserData(obj){ // 寫進資料庫
  let userId = auth.currentUser.uid;
  database.ref('message-addfriendsreply/' + userId + '/' + obj.serial).update({
    taskText: obj.inp,
    owner: obj.currentUserEmail,
    modifiedDate: obj.currentDateTime
  });
} // end of updateUserData
function emitToServer(data){ // 推到server端處理
  socket.emit('update add friend message', data);
} // end of emitToServer
