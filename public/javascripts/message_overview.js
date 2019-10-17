// jQuery
$(document).ready(function() {
  var socket = io.connect(); //socket



  $(document).on('click', '#signout-btn', logout); //登出

  // $(document).on('click', '#search-btn', filterChart);

  $(document).on('click', '#message', subMessage);//Message 導覽標籤 subtags


  $(document).on('click', '.tablinks' , clickMsg);
  $(document).on('click', '#modal-submit', modalSubmit); //新增
  $(document).on('click', '#setlimit', clickLmtUser);
  $(document).on('click', '#btn-text', btnText);
  $(document).on('click', '#modal-draft', saveDraft);
  $(document).on('click', '#viewBtn', loadView);
  $(document).on('click', '#editBtn', openEdit); //打開編輯modal
  $(document).on('click', '#edit-submit', modalEdit);
  $(document).on('click', '#deleBtn', deleteRow); //刪除
  $(document).on('click', '.tablinks_sort' , clickSortingLink);
  $(document).on('mouseover', '#nav_message', subMessage);//Message 導覽標籤 subtags
  $(document).on('click', '#submitMsg', submitMsg);
  $(document).on('click', '#upImg', upImg);
  $(document).on('click', '#upVid', upVid);
  $(document).on('click', '#upAud', upAud);
  $(document).on('click', '.removeInput', removeInput);//移除input

var inputNum = 0;//計算訊息的數量

function upImg() {
  var imgAtt = '/image ' + $('#attImgFill').val();
  $('#message').val('<img src="' + imgAtt);
  socket.emit('send message', sendObj);

} // end of upImg

function upVid() {
  var vidAtt = $('#attVidFill').val();
  $('#message').val('<video controls><source src="' + vidAtt);
} // end of upVid

function upAud() {
  var audAtt = $('#attAudFill').val();
  $('#message').val('<audio controls><source src="' + audAtt);
} // upAud
  $('.onclick_show').on('click', function(e){
    // console.log('onclick_show exe');
    var target = $(this).attr('rel');
    e.preventDefault();
    if ($("#"+target).is(":visible")){
      $("#"+target).fadeOut();
      $(".uploadArea").css('top',0);
      $(this).attr('active','false');
    }else{
      $("#"+target).css('display','flex').siblings().hide();
      $(".uploadArea").css('top',-60);
      $(this).attr('active','true').siblings().attr('active','false');;
    }
  });//onclick_show

  function subMessage(){
    if ($('.subTag').is(':visible')){
      $('.subTag').fadeOut(1000, "swing");
    }else{
    $('.subTag').fadeIn(1000, "swing");
  }
  }

var current_datetime = new Date();
var d    = current_datetime.getDate();
var m    = current_datetime.getMonth();
var y    = current_datetime.getFullYear();
var messageInput = $('#message'); //input for agent to send message






    if(window.location.pathname === '/message_overview'){
    setTimeout(loadOverReply, 1000);
    setTimeout(pushMsg, 2000);
  }





  // socket.on('push json to front', (data) => {
  //   console.log("push json to front");
  //   for (i in data) pushMsg(data[i]); //one user do function one time
  // });
var name_list = []; //list of all users

  function pushMsg() {
    let userId = auth.currentUser.uid;

    var chanId1;
    var chanId2;
    database.ref('users'+ userId).on('value', snap =>{
      let profileData = snap.val();
      if (profileData == null) console.log('profileData == null');
      else{chanId1 = profileData.chanId_1; chanId2 = profileData.chanId_2;}
    })
    database.ref('chats/Data').on('value', snap =>{
      let profInfo = snap.val();
      if (profInfo == null){
        console.log('error profInfo == null')
      }else{
        for (let i in profInfo){
          var room;
          if (profInfo[i].Profile.channelId == chanId1) room = 'Line_1_room';
          else if (profInfo[i].Profile.channelId == chanId2) room = 'Line_2_room';
          else room = profInfo[i].Profile.channelId;
        name_list.push({'id': profInfo[i].Profile.userId, 'chanId':room});

    let profile = profInfo[i].Profile;

    $('#user-rooms').append('<option value="' + profile.userId + '">' + profile.nickname + '</option>'); //new a option in select bar
    // name_list.push(profile.channelId+profile.userId); //make a name list of all chated user
        }
      }
    });
  }

  function submitMsg(e){
    console.log('exe');
    e.preventDefault();

    // console.log($(this).parent().parent().siblings('#canvas').find('[style="display: block;"]').attr('rel'));
    // console.log($(this).parent().parent().parent().siblings('#user').find('.tablinks_area[style="display: block;"]').attr('id'));

    let sendObj = {
      id: "",
      msg: messageInput.val(),
      msgtime: Date.now(),
      room: ""
    };

    if ($("#user-rooms option:selected").val() == '全選') {
      name_list.map(function(data) {
        console.log(data);
        console.log(data.chanId);
        sendObj.id = data.id;
        sendObj.room = data.chanId;
        console.log(sendObj);
        socket.emit('send message', sendObj);
      })
    } else if ($("#user-rooms option:selected").val() == '對可見用戶發送') {
      $('.tablinks:visible').each(function() {
        sendObj.id = $(this).attr('rel');
        console.log(sendObj);
        socket.emit('send message', sendObj);
      });
    } else {
      console.log(sendObj);
      sendObj.id = $("#user-rooms option:selected").val();
      console.log('the selected');
      console.log(sendObj);
      socket.emit('send message', sendObj); //socket.emit
    } //else
    messageInput.val('');

  }


function saveDraft(){
  let d = Date.now();
  let text = $('#textinput').val();
  let status = '草稿';
  let send_time = $('#sendTime').val();
  // let send_time = $('#sendTime');


  writeUserData_draft(auth.currentUser.uid, text, status, send_time, auth.currentUser.email.toString());

  //塞入資料庫並重整
  $('#quickAdd').modal('hide');
  $('#textinput').val('');
  $('#sendTime').val('');
  alert('Saved!')


  loadOverReply();
}


  function writeUserData_draft(userId, text, status, send_time, email) {
  database.ref('message-overview/' + userId).push({
    taskContent: text,
    owner: auth.currentUser.email,
    taskStatus: status,
    taskTime: send_time
  });
}

    function removeInput(){
      inputNum--;
      if (inputNum<4){$('.error_msg').hide()}
      $(this).parent().remove();
    }


  function btnText(){

    inputNum++;
    if (inputNum > 3){$('.error_msg').show(); console.log('超過三則訊息');inputNum--;}
    else{

      $('#inputText').append(
        '<div style="margin:2%">'+
        '<span style="float:right" class="removeInput">X</span>'+
        '<tr>'+
        '<th style="padding:1.5%; background-color: #ddd">輸入文字:</th>'+
        '</tr>'+
        '<tr>'+
        '<td style="background-color: #ddd">'+
        '<form style="padding:1%">'+
        '<input id="textinput" class="inputNum'+inputNum+'" style="width:100%;height:100px" />'+
      '</form>'+
      '</td>'+
      '</tr>'+
      '</div>');

      console.log('inputNum: ', inputNum);
    }

}


  function modalSubmit() {
  // let d = Date.now();
  let text = $('#textinput').val();
  let input1 = $('.inputNum1').val();
  let input2 = $('.inputNum2').val();
  if (input2 == undefined) input2 = '未設定';
  let input3 = $('.inputNum3').val();
  if (input3 == undefined) input3 = '未設定';
  let status = '保存';
  let send_time;
  if ($('#sendNow').attr('checked') == 'checked') send_time = '馬上發送';
  else send_time = $('#sendTime').val();

  console.log('send_time ', send_time);

  let screenTags = $('#screen_tags').val() +','+ $('#vip_level').val();
  console.log(input1, input2, input3);

  writeUserData(auth.currentUser.uid, input1, input2, input3, screenTags, status, send_time, auth.currentUser.email.toString());

  // 塞入資料庫並重整
  $('#quickAdd').modal('hide');
  $('#textinput').val('');
  $('#sendTime').val(''); //

  alert('變更已儲存!');

  loadOverReply();
}


  function writeUserData(userId, input1, input2, input3, screenTags, status, send_time, email) {
  database.ref('message-overview/' + userId).push({
    taskContent1: input1,
    taskContent2: input2,
    taskContent3: input3,
    taskTags: screenTags,
    taskTime: send_time,
    owner: auth.currentUser.email,
    taskStatus: status,

  });
}



  function clickLmtUser(){
    console.log('clickLmtUser exe');
    var target = $(this).attr('rel');
    if ($("#"+target).is(':visible')){
      $("#"+target).hide();
    }else{
      $("#"+target).show();
    }
  }

      function clickMsg(){
        var target = $(this).attr('rel');
        $("#"+target).show().siblings().hide();
        $(this).addClass("table_select");
        $(this).siblings().removeClass("table_select");
    }

    function loadOverReply(){
        $('#data-appointment').empty();
        $('#data-draft').empty();
        $('#data-history').empty();
        $('#edit-tags').empty();
        $('#screen_tags').empty();
        $('#vip_level').empty();
        let userId = auth.currentUser.uid;
        database.ref('message-overview/' + userId).on('value', snap => {
        let dataArray = [];
        let testVal = snap.val();
        let myIds = Object.keys(testVal);
        var new_taskTags = [];

        for(var i=0;i < myIds.length;i++){
        new_taskTags = [];

          dataArray.push(snap.child(myIds[i]).val());
          if (dataArray[i].taskTags !== undefined && dataArray[i].taskTags.length>1){
            dataArray[i].taskTags.split(",").map(function(x){
              if (x == 'null') x = '';
              new_taskTags.push(x);
            });
            dataArray[i].taskTags = new_taskTags.join(' ');
          }else if (dataArray[i].taskTags == undefined) dataArray[i].taskTags = '未設定';

          if (dataArray[i].taskContent2 == '未設定') dataArray[i].taskContent2 = '';
          if (dataArray[i].taskContent3 == '未設定') dataArray[i].taskContent3 = '';
          if (dataArray[i].taskStatus=='草稿'){

         $('#data-draft').append(
          '<tr class = "msgToSend">' +
          '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' +
          '<td class="msgDetail" >' + (i+1) + '</td>' +
          '<td class="msgDetail" >' + dataArray[i].taskContent1+' '+dataArray[i].taskContent2+' '+dataArray[i].taskContent3 + '</td>' +
          '<td class="msgDetail" >' + 'text' + '</td>' +
          '<td class="msgDetail" >'+dataArray[i].taskTags+'</td>' +
          '<td class="msgDetail" >'+dataArray[i].taskStatus+'</td>'+
          '<td class="msgDetail" >'+dataArray[i].taskTime+'</td>' +
          '<td>' +
          '<a href="#" id="editBtn" data-toggle="modal" data-target="#editModal" style="color:black"><b>編輯  </b></a>' +
          '<a href="#" id="viewBtn" data-toggle="modal" data-target="#viewModal" style="color:black"><b>檢視  </b></a>' +
          '<a href="#" id="deleBtn" style="color:black"><b>刪除</b></a>' +
          '</td>' +
          '</tr>'
        );
      }
      else if (dataArray[i].taskStatus == '歷史'){
        $('#data-history').append(
            '<tr class = "msgToSend" style="margin:0;">' +
            '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' +
            '<td class="msgDetail">' + (i+1) + '</td>' +
            '<td class="msgDetail">' + dataArray[i].taskContent1+' '+dataArray[i].taskContent2+' '+dataArray[i].taskContent3 + '</td>' +
            '<td class="msgDetail">' + 'text' + '</td>' +
            '<td class="msgDetail">'+dataArray[i].taskTags+'</td>' +
            '<td class="msgDetail">'+dataArray[i].taskStatus+'</td>'+
            '<td class="msgDetail">'+dataArray[i].taskTime+'</td>' +
            '<td>' +
            '<a href="#" id="editBtn" data-toggle="modal" data-target="#editModal" style="color:black"><b>編輯  </b></a>' +
            '<a href="#" id="viewBtn" data-toggle="modal" data-target="#viewModal" style="color:black"><b>檢視  </b></a>' +
            '<a href="#" id="deleBtn" style="color:black"><b>刪除</b></a>' +
            '</td>' +
            '</tr>'
        );

      }else{
              var d = new Date().getTime();
              var nowTime = new Date(d).toISOString() // ISO format of the UTC time
              var modiTime = nowTime.slice(11,13);
              if (parseInt(modiTime) < 17) nowTime = nowTime.replace(modiTime, String(parseInt(modiTime)+8));//加入台灣的時區
              else {
              nowTime = nowTime.replace(modiTime, String(parseInt(modiTime)-16)); //如果超過24小時要算在隔一天，考慮到還有大月小月的問題，還在解決這個部分
              }
              nowTime = nowTime.slice(0,16);
              if (dataArray[i].taskTime < nowTime) dataArray[i].taskStatus = '發送失敗';

        $('#data-appointment').append(
            '<tr class = "msgToSend" style="margin:0;">' +
            '<td id="' + myIds[i] + '" hidden>' + myIds[i] + '</td>' +
            '<td class="msgDetail">' + (i+1) + '</td>' +
            '<td class="msgDetail">' + dataArray[i].taskContent1+' '+dataArray[i].taskContent2+' '+dataArray[i].taskContent3 + '</td>' +
            '<td class="msgDetail">' + 'text' + '</td>' +
            '<td class="msgDetail">'+dataArray[i].taskTags+'</td>' +
            '<td class="msgDetail">'+dataArray[i].taskStatus+'</td>'+
            '<td class="msgDetail">'+dataArray[i].taskTime+'</td>' +
            '<td>' +
            '<a href="#" id="editBtn" data-toggle="modal" data-target="#editModal" style="color:black"><b>編輯  </b></a>' +
            '<a href="#" id="viewBtn" data-toggle="modal" data-target="#viewModal" style="color:black"><b>檢視  </b></a>' +
            '<a href="#" id="deleBtn" style="color:black"><b>刪除</b></a>' +
            '</td>' +
            '</tr>'
        );
      }
    }
  });

//load screening tags
database.ref('tags/Data').on('value', snap=>{
  let testVal = snap.val();
  for (var i in testVal){
    if (testVal[i].name == '標籤'){
      testVal[i].set.map(function(x){
        $('#screen_tags').append('<option value="'+x+'">'+x+'</option>');
        $('#edit-tags').append('<option value="'+x+'">'+x+'</option>');
      });
    }else if (testVal[i].name == 'VIP等級'){
      testVal[i].set.map(function(x){
        $('#vip_level').append('<option value="'+x+'">'+x+'</option>');
        $('#edit-tags').append('<option value="'+x+'">'+x+'</option>');
      });
    }
  }
})


}

function loadView() {

  // $('#view-textinput').text(''); //任務內容
  $('#view-tags').text(''); //標籤
  $('#view-stat').text(''); //狀態
  $('#view-owne').text(''); //負責人
  $('#view-desc').text(''); //說明
  $('#view-inir').text(''); //建立人
  $('#view-inid').text(''); //建立日期
  $('#view-modr').text(''); //修改人
  $('#view-modd').text(''); //修改日期
  $('#view-subt').empty(); //
  $('#message').text(''); //群發
  $('.taskContent').remove();//任務內容canvas


  let key = $(this).parent().parent().find('td:first').text();
  console.log(key);
  let userId = auth.currentUser.uid;

  database.ref('message-overview/' + userId + '/' + (key)).on('value', snap => {
    let testVal = snap.val();
    console.log(testVal);
    // 重複出現值 要抓出來
    $('#view-id').val(key); //編號
    // $('#view-textinput').val(testVal.taskContent); //任務內容
    $('#view-tags').val(testVal.taskTags);//標籤
    $('#view-stat').val(testVal.taskStatus); //狀態
    $('#view-owne').val(testVal.owner); //負責人
    $('#view-desc').val(testVal.description); //說明
    $('#view-inir').val(testVal.initiator); //建立人
    $('#view-inid').val(testVal.initDate); //建立日期
    $('#view-modr').val(testVal.modifier); //修改人
    $('#view-modd').val(testVal.modiDate); //修改日期
    $('#message').val(testVal.taskContent); //內容加到群發的地方
    $('#任務內容').append(
        '<input disabled="disabled" class="form-control taskContent" id="view-textinput" value="'+testVal.taskContent1+'">');//任務內容1
    if (testVal.taskContent2 !== '未設定'){
      $('#任務內容').append(
        '<input disabled="disabled" class="form-control taskContent" id="view-textinput" value="'+testVal.taskContent2+'">');//任務內容2
    }
    if (testVal.taskContent3 !== '未設定'){
      $('#任務內容').append(
        '<input disabled="disabled" class="form-control taskContent" id="view-textinput" value="'+testVal.taskContent3+'">');//任務內容3
    }

  });

}

function openEdit() {
  $('#edit-taskContent').val(''); //任務內容
  $('#edit-tags').val('');//標籤
  $('#edit-status').val(''); //狀態
  $('#edit-time').val(''); //時間
  $('#edit-owner').val(''); //負責人
  $('.taskContent').remove();//任務內容canvas


  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;

  database.ref('message-overview/' + userId + '/' + key).on('value', snap => {
    let testVal = snap.val();
    // console.log(testVal);
    $('#edit-id').append(key);
    $('#edit-taskContent').val(testVal.taskContent); //任務內容
    $('#edit-tags').val(testVal.taskTags);//標籤
    $('#edit-status').val(testVal.taskStatus); //狀態
    $('#edit-time').val(testVal.taskTime); //狀態
    $('#edit-owner').val(testVal.owner); //負責人
    console.log('testVal.taskContent1', testVal.taskContent1);
    $('#編輯內容').append(
        '<input style="margin:1% 0" class="form-control taskContent" id="edit-taskContent" value="'+testVal.taskContent1+'">');//任務內容1
    if (testVal.taskContent2 !== '未設定'){
      $('#編輯內容').append(
        '<input style="margin:1% 0" class="form-control taskContent" id="edit-taskContent" value="'+testVal.taskContent2+'">');//任務內容2
    }
    if (testVal.taskContent3 !== '未設定'){
      $('#編輯內容').append(
        '<input style="margin:1% 0" class="form-control taskContent" id="edit-taskContent" value="'+testVal.taskContent3+'">');//任務內容3
    }
    // console.log(sublist);
  });
}

function modalEdit() {
  let key = $('#edit-id').text();
  let userId = auth.currentUser.uid;
  var name = $('#edit-taskContent').val(); //任務內容
  var tags = $('#edit-tags').val();//標籤
  var stat = $('#edit-status').val(); //狀態
  var time;
  if ($('#edit-sendNow').attr('checked') == 'checked') time = '馬上發送';
  else time = $('#edit-time').val();//時間
  console.log(time);
  var owne = $('#edit-owner').val(); //負責人
  //日期
  let d = Date.now();
  let date = new Date(d);

  // console.log(key, userId, name, cate, stat, prio, owne, desc, subt, inir, inid, auth.currentUser.email, date);

  saveUserData(key, userId, name, tags, stat, time, owne, auth.currentUser.email, date.toString());

  $('#edit-id').text(''); //
  $('#edit-taskContent').val(''); //任務內容
  $('#edit-tags').val('');
  $('#edit-status').val(''); //狀態
  $('#edit-time').val(''); //狀態
  $('#edit-owner').val(''); //負責人


  loadOverReply();
  $('#editModal').modal('hide');
}


function saveUserData(key, userId, name, tags, stat, time, owne, email,d) {
  database.ref('message-overview/' + userId + '/' + key).update({
    taskContent: name,
    taskTags: tags,
    taskStatus: stat,
    taskTime: time,
    owner: owne
  });
}


function deleteRow() {
  let key = $(this).parent().parent().find('td:first').text();
  let userId = auth.currentUser.uid;
  // console.log(userId, key);

  database.ref('message-overview/' + userId + '/' + key).remove();

  loadOverReply();
}

  //=========[SEARCH by TEXT]=========
  $("#exampleInputAmount").keyup(function() {
    var dataAppoinment = $('#data-appointment tr');
    var dataDraft = $('#data-draft tr');
    var val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();

    dataAppoinment.show().filter(function() {
      var text1 = $(this).text().replace(/\s+/g, ' ').toLowerCase();
      return !~text1.indexOf(val);
    }).hide();

    dataDraft.show().filter(function() {
      var text2 = $(this).text().replace(/\s+/g, ' ').toLowerCase();
      return !~text2.indexOf(val);
    }).hide();
  });

// SORTING ADDED BY COLMAN


var sortWays = ["No.", "內容", "分類", "標籤(optional)", "狀態", "預約"];
var sortBool = [true, true, true, true, true, true ];

function clickSortingLink() {
  let wayId = sortWays.indexOf( $(this).text() ); //get which way to sort (line 322)
  let wayBool = sortBool[wayId];
  for( let i in sortBool ) sortBool[i] = true;  //reset other sort ways up_down
  sortBool[wayId] = !wayBool;   //if this time sort up, next time sort down

  let panel_to_push;    //check which tabcontent to sort
  if( $('#Appointment').css("display") ==  "block" ) panel_to_push = '#data-appointment';
  else if( $('#Draft').css("display") ==  "block" ) panel_to_push = '#data-draft';
  else if( $('#History').css("display") ==  "block" ) panel_to_push = '#open-ticket-list';

  let msgsArr = $( panel_to_push + ' .msgToSend' ); //get all msg in tabcontent
  for( let i=0; i<msgsArr.length-1; i++ ) {   //bubble sort
    for( let j=i+1; j<msgsArr.length; j++ ) {
      let a = msgsArr.eq(i).children(".msgDetail").eq(wayId).text();
      let b = msgsArr.eq(j).children(".msgDetail").eq(wayId).text();
      // console.log("a, b = " + a + ", " + b);
      if( wayBool == (a<b)  ) {             //sort up or down && need sort?
        // console.log("swap!");
        let tmp = msgsArr[i];   msgsArr[i] = msgsArr[j];    msgsArr[j] = tmp;
      }
    }
  }
  $(panel_to_push).append(msgsArr); //push to tabcontent

}

function ISODateString(d) {
    function pad(n) {return n<10 ? '0'+n : n}
    return d.getFullYear()+'-'
         + pad(d.getMonth()+1)+'-'
         + pad(d.getDate())+'T'
         + '00:00'
}

function ISODateTimeString(d) {
    function pad(n) {return n<10 ? '0'+n : n}
    return d.getFullYear()+'-'
         + pad(d.getMonth()+1)+'-'
         + pad(d.getDate())+'T'
         + pad(d.getHours())+':'
         + pad(d.getMinutes())
}


function logout(){
  auth.signOut()
  .then(response => {
    window.location.assign("/login");
  })
}

});//document ready
