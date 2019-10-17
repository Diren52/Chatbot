// jQuery
$(document).ready(function() {
  $(document).on('click', '#signout-btn', logout); //登出
  // $(document).on('click', '#search-btn', filterChart);
  $(document).on('click', '.tablinks', clickMsg);
  $(document).on('click', '#csv', noCsv);
  // $(document).on('click','.addSubKey', addSubKey);
  $(document).on('click', '#modal-submit', modalSubmit); //新增
  $(document).on('click', '#viewBtn', loadView);
  $(document).on('click', '#editBtn', openEdit); //打開編輯modal
  $(document).on('click', '#deleBtn', deleteRow); //刪除
  $(document).on('click', '#edit-submit', modalEdit);
  function addSubKey() {
    $('#subKeyCanvas').prepend('<div><input class="form-control" type="text"  style="width:20%" value="" id="modal-subKey"/><span onclick="this.parentElement.remove()"> x</span></div>')
  }

  if(window.location.pathname === '/message_keywordsreply') {
    setTimeout(loadKeywordsReply, 1000);
  }
  var socket = io.connect();
  // socket.on('reply keywords to front', (data)=>{
  //   socket.emit('send message', data);
  //   console.log('socket emit send message from js');
  // })
});

function addMsgCanvas() {
  $('#MsgCanvas').append('<!--TEXT AREA -->' + '<div id="text" style="display:block; height:100px; width:400px; padding:1.5%;margin:2%">' + '<span style="float:right" onclick="this.parentElement.remove()">X</span>' + '<table>' + '<tr>' + '<th style="padding:1.5%; margin:2%; background-color: #ddd">Enter Text:</th>' + '</tr>' + '<tr>' + '<td style="background-color: #ddd">' + '<form style="padding:1%; margin:2%">' + '<input id="textinput" style="width:400px;height:100px" />' + '</form>' + '</td>' + '</tr>' + '<tr>' + '<th style="padding:1.5%; margin:2%; background-color: #ddd">' + '<button style="padding:1.5%; margin:2%; class="tablinks" rel="emos">Emoji</button>' + '</th>' + '</tr>' + '</table>' + '</div>');
  console.log('addMsgCanvas exe');
}

function modalSubmit() {
  let d = Date.now()
  let mainKey = $('#modal-mainKey').val().trim();
  let subKey = $('#modal-subKey').val().split(",");
  let text = $('#textinput').val().split(",");
  let cate = $('#modal-category').val();
  if(cate == '狀態') $('.error_msg').show();
  else {
    writeUserData(d, auth.currentUser.uid, mainKey, subKey, text, cate, auth.currentUser.email.toString());
    //塞入資料庫並重整
    $('#quickAdd').modal('hide');
    $('#modal-mainKey').val('');
    $('#modal-subKey').val('');
    $('#textinput').val('');
    $('#modal-category').val('');
    alert('變更已儲存!')
    loadKeywordsReply();
  }
}

function writeUserData(d, userId, mainKey, subKey, text, cate) {
  database.ref('message-keywordsreply/' + userId).push({
    taskMainK: mainKey,
    taskSubK: subKey,
    taskText: text,
    taskCate: cate,
    owner: auth.currentUser.email,
  });
}

function noCsv() {
  if($('#nocsv').is(':visible')) {
    $('#nocsv').hide();
  } else {
    $('#nocsv').show();
  }
}

function clickMsg() {
  var target = $(this).attr('rel');
  $("#" + target).show().siblings().hide();
}

function addMsg() {
  var target = $(this).attr('rel');
  if($("#" + target).is(':visible')) {
    $("#" + target).hide();
  } else {
    $("#" + target).show();
  }
}

function loadKeywordsReply() {
  $("#serving").empty();
  $("#waiting").empty();
  let userId = auth.currentUser.uid;
  database.ref('message-keywordsreply/' + userId).on('value', snap => {
    let dataArray = [];
    let testVal = snap.val();
    if(testVal == null) {} else {
      let myIds = Object.keys(testVal);
      for(var i = 0; i < myIds.length; i++) {
        dataArray.push(snap.child(myIds[i]).val());
        console.log('data in looping for append')
        if(dataArray[i].taskCate == '開放') {
          $("#serving").append('<tr>' + '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' + '<td id="td">' + dataArray[i].taskMainK + '</td>' + '<td id="td">' + dataArray[i].taskSubK + '</td>' + '<td id="td">' + dataArray[i].taskText + '</td>' + '<td id="td"><b>此功能尚未開通</b></td>' + '<td id="td" >' + dataArray[i].taskCate + '</td>' + '<td id="td">' + '<a href="#" id="editBtn" data-toggle="modal" data-target="#editModal"><b style="color:black;">編輯  </b></a>' + '<a href="#" id="viewBtn" data-toggle="modal" data-target="#viewModal"><b style="color:black;">檢視  </b></a>' + '<a href="#" id="deleBtn"><b style="color:black;">刪除</b></a>' + '</td>' + '</tr>');
          //  var socket = io.connect();
          // socket.emit('update keywords', {
          //   message: dataArray[i].taskMainK,
          //   reply: dataArray[i].taskText
          // });
          // for (var n=0; n<dataArray[i].taskSubK.length; n++){
          //   socket.emit('update subKeywords', {
          //     message: dataArray[i].taskSubK[n],
          //     reply: dataArray[i].taskText
          //   });
          // }
        } else {
          $("#waiting").append('<tr>' + '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' + '<td id="td">' + dataArray[i].taskMainK + '</td>' + '<td id="td">' + dataArray[i].taskSubK + '</td>' + '<td id="td">' + dataArray[i].taskText + '</td>' + '<td id="td"><b>此功能尚未開通</b></td>' + '<td id="td">' + dataArray[i].taskCate + '</td>' + '<td id="td">' + '<a href="#" id="editBtn" data-toggle="modal" data-target="#editModal"><b style="color:black;">編輯  </b></a>' + '<a href="#" id="viewBtn" data-toggle="modal" data-target="#viewModal"><b style="color:black;">檢視  </b></a>' + '<a href="#" id="deleBtn"><b style="color:black;">刪除</b></a>' + '</td>' + '</tr>');
        }
      }
    }
  });
}

function loadView() {
  $('#view-mainK').text(''); //主關鍵字
  $('#view-subK').text(''); //副關鍵字
  $('#view-textinput').text(''); //任務內容
  $('#view-stat').text(''); //狀態
  $('#view-owne').text(''); //負責人
  $('#view-subt').empty(); //
  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;
  database.ref('message-keywordsreply/' + userId + '/' + (key)).on('value', snap => {
    let testVal = snap.val();
    // 重複出現值 要抓出來
    $('#view-id').append(key); //編號
    $('#view-mainK').append(testVal.taskMainK); //主關鍵字
    $('#view-subK').append(testVal.taskSubK); //副關鍵字
    $('#view-textinput').append(testVal.taskText); //任務內容
    $('#view-stat').append(testVal.taskCate); //狀態
    $('#view-owne').append(testVal.owner); //負責人
  });
}

function openEdit() {
  $('#edit-mainK').val(''); //任務內容
  $('#edit-subK').val(''); //任務內容
  $('#edit-taskContent').val(''); //任務內容
  $('#edit-status').val(''); //狀態
  $('#edit-owner').val(''); //負責人
  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;
  database.ref('message-keywordsreply/' + userId + '/' + key).on('value', snap => {
    let testVal = snap.val();
    // console.log(testVal);
    $('#edit-id').append(key);
    $('#edit-mainK').val(testVal.taskMainK); //主關鍵字
    $('#edit-subK').val(testVal.taskSubK); //副關鍵字
    $('#edit-taskContent').val(testVal.taskText); //任務內容
    $('#edit-status').val(testVal.taskCate); //狀態
    $('#edit-owner').val(testVal.owner); //負責人
    // console.log(sublist);
  });
}

function modalEdit() {
  if(confirm('確認更改？')) {
    let key = $('#edit-id').text().trim();
    let userId = auth.currentUser.uid;
    var mainKey = $('#edit-mainK').val().trim(); //主關鍵字
    var subKey = $('#edit-subK').val().split(","); //副關鍵字
    var text = $('#edit-taskContent').val().split(","); //任務內容
    var cate = $('#edit-status').val(); //狀態
    var owne = $('#edit-owner').val(); //負責人
    //日期
    let d = Date.now();
    let date = new Date(d);
    // console.log(key, userId, text, cate, cate, prio, owne, desc, subt, inir, inid, auth.currentUser.email, date);
    saveUserData(key, userId, mainKey, subKey, text, cate, owne, auth.currentUser.email, date.toString());
    $('#edit-id').text(''); //
    $('#edit-mainK').val(''); //主關鍵字
    $('#edit-subK').val(''); //副關鍵字
    $('#edit-taskContent').val(''); //任務內容
    $('#edit-status').val(''); //狀態
    $('#edit-owner').val(''); //負責人
    loadKeywordsReply();
    $('#editModal').modal('hide');
    alert('已成功更新');
  }
}

function saveUserData(key, userId, mainKey, subKey, text, cate, owne) {
  database.ref('message-keywordsreply/' + userId + '/' + key).set({
    taskMainK: mainKey,
    taskSubK: subKey,
    taskText: text,
    taskCate: cate,
    owner: owne
  });
}

function deleteRow() {
  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;
  // console.log(userId, key);
  if(confirm('確定刪除？')) {
    database.ref('message-keywordsreply/' + userId + '/' + key).remove();
    loadKeywordsReply();
    alert('已成功刪除');
  }
}

function logout() {
  auth.signOut().then(response => {
    window.location.assign("/login");
  })
}
