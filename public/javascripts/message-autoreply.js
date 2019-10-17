// jQuery
$(document).ready(function() {
  $(document).on('click', '#signout-btn', logout); //登出
  // $(document).on('click', '#search-btn', filterChart);
  // $(document).on('click', '#message', subMessage);//Message 導覽標籤 subtags
  $(document).on('click', '.tablinks', clickMsg);
  $(document).on('click', '.addTopics', addTopics);
  $(document).on('click', '#modal-submit', modalSubmit); //新增
  $(document).on('click', '#viewBtn', loadView);
  $(document).on('click', '#editBtn', openEdit); //打開編輯modal
  $(document).on('click', '#edit-submit', modalEdit);
  $(document).on('click', '#deleBtn', deleteRow); //刪除
  if(window.location.pathname === '/message_autoreply') {
    setTimeout(loadAutoReply, 1000);
  }
  // var socket = io.connect();
  // socket.on('reply keywords to front', (data)=>{
  //   socket.emit('send message', data);
  //   console.log('socket emit send message from js');
  // })
});

  function modalSubmit() {
  let starttime = $('#starttime').val();
  let endtime = $('#endtime').val();
  //console.log('starttime = '+starttime);
  //console.log('endtime = '+endtime);
  let name = $('#modal-task-name').val();
  let textInput = $('#enter-text').val();
  //console.log(textInput);

  writeUserData(auth.currentUser.uid, name, starttime, endtime, textInput);

  //塞入資料庫並初始化
  $('#quickAdd').modal('hide');
  $('#modal-task-name').val('');
  $('#starttime').val('');
  $('#endtime').val('');
  $('#enter-text').val('');
  alert('您的事件已儲存!')


  loadAutoReply();
}


  function writeUserData(userId, name, starttime, endtime, textInput) {
    //console.log(starttime);
    //console.log(endtime);
  database.ref('message-autoreply/' + userId).push({
    taskName: name,
    taskStart: starttime,
    taskEnd: endtime,
    taskText: textInput,
    owner: auth.currentUser.email
});
    // console.log('this is textInput: ')
    // console.log(textInput);

}

function clickMsg() {
  var target = $(this).attr('rel');
  $("#" + target).show().siblings().hide();
}

function addTopics() {
  var target = $(this).attr('rel');
  $("#" + target).show()
}


    function loadAutoReply(){
        console.log('loadAutoReply executed')
        $('#autoreply-list').empty();
        let userId = auth.currentUser.uid;
        database.ref('message-autoreply/' + userId).on('value', snap => {
        let dataArray = [];
        let testVal = snap.val();
        let myIds = Object.keys(testVal);

        for(var i=0;i < myIds.length;i++){
          dataArray.push(snap.child(myIds[i]).val());
            $('#autoreply-list').append(
              '<tr>' +
                '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' +
                '<td>' + '開放' + '</td>' +
                '<td>' + '未設定' + '</td>' +
                '<td><a href="#" id="viewBtn" data-toggle="modal" data-target="#viewModal"><b>' + dataArray[i].taskName + '</b></a></td>' +
                '<td>' + '開始時間： ' + dataArray[i].taskStart + '結束時間： ' + dataArray[i].taskEnd + '</td>' +
                '<td>' + dataArray[i].taskText + '</td>' +
                '<td>' +
                '<a href="#" id="editBtn" data-toggle="modal" data-target="#editModal"><b>編輯</b></a>' +
                ' ' +
                '<a href="#" id="deleBtn"><b>刪除</b></a>' +
                '</td>' +
              '</tr>'
        );
            // var socket = io.connect();
            // socket.emit('update keywords', {
            //   message: dataArray[i].taskName,
            //   reply: dataArray[i].taskText
            // });
      }
    });
}

function loadView() {

  //Initialize
  $('#view-id').text(''); //key
  $('#view-title').text(''); //標題
  $('#view-start').text(''); //開始時間
  $('#view-end').text(''); //結束時間
  $('#view-textinput').text(''); //任務內容
  $('#view-owner').text(''); //負責人

  let key = $(this).parent().parent().find('td:first').text();
  //console.log(key);
  let userId = auth.currentUser.uid;
  database.ref('message-autoreply/' + userId + '/' + (key)).on('value', snap => {
    let testVal = snap.val();
    console.log(testVal);
    // 重複出現值 要抓出來
    $('#view-id').append(key); //編號
    $('#view-title').append(testVal.taskName); //標題
    $('#view-start').append(testVal.taskStart); //開始時間
    $('#view-end').append(testVal.taskEnd); //結束時間
    $('#view-textinput').append(testVal.taskText); //任務內容
    $('#view-owner').append(testVal.owner); //負責人

  });
}

function openEdit() {
  //Initialize
  $('#edit-id').text(''); //key
  $('#edit-taskTitle').val(''); //標題
  $('#edit-taskStart').val(''); //開始時間
  $('#edit-taskEnd').val(''); //結束時間
  $('#edit-taskContent').val(''); //任務內容
  $('#edit-owner').val(''); //負責人
  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;
  database.ref('message-autoreply/' + userId + '/' + key).on('value', snap => {
    let testVal = snap.val();
    // console.log(testVal);
    $('#edit-id').append(key);
    $('#edit-taskTitle').val(testVal.taskName); //標題
    $('#edit-taskStart').val(testVal.taskStart); //開始時間
    $('#edit-taskEnd').val(testVal.taskEnd); //結束時間
    $('#edit-taskContent').val(testVal.taskText); //任務內容
    $('#edit-owner').val(testVal.owner); //負責人
    // console.log(sublist);
  });
} //end open edit
function modalEdit() {
  let key = $('#edit-id').text();
  let userId = auth.currentUser.uid;
  var name = $('#edit-taskTitle').val(); //標題
  var starttime = $('#edit-taskStart').val(); //開始時間
  var endtime = $('#edit-taskEnd').val(); //結束時間
  var textInput = $('#edit-taskContent').val(); //任務內容
  var owner = $('#edit-owner').val(); //負責人
  //日期
  // let d = Date.now();
  // let date = new Date(d);

  // console.log(key, userId, name, cate, stat, prio, owner, desc, subt, inir, inid, auth.currentUser.email, date);

  saveUserData(key, userId, name, starttime, endtime, textInput, owner);

  //Initialize
  $('#edit-id').text('');
  $('#edit-taskTitle').val(''); //標題
  $('#edit-taskStart').val(''); //開始時間
  $('#edit-taskEnd').val(''); //結束時間
  $('#edit-taskContent').val(''); //任務內容
  $('#edit-owner').val(''); //負責人
  loadAutoReply();
  $('#editModal').modal('hide');
}//end modal edit


function saveUserData(key, userId, name, starttime, endtime, textInput, owner) {
  //console.log(starttime);
  database.ref('message-autoreply/' + userId + '/' + key).update({
    taskName: name,
    taskStart: starttime,
    taskEnd: endtime,
    taskText: textInput,
    owner: owner
  });
}

function deleteRow() {
  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;
  // console.log(userId, key);
  database.ref('message-autoreply/' + userId + '/' + key).remove();
  loadAutoReply();
}


function logout(){
  auth.signOut()
  .then(response => {
    window.location.assign("/login");
  })
}
function ISODateTimeString(d) {
  d = new Date(d);
  function pad(n) {return n<10 ? '0'+n : n}
  return d.getFullYear()+'-'
       + pad(d.getMonth()+1)+'-'
       + pad(d.getDate())+'T'
       + pad(d.getHours())+':'
       + pad(d.getMinutes());
}

function convertTime(date) {
  let newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
  let finalDate = ISODateTimeString(newDate);
  return finalDate;
}
