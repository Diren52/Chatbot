const socket = io.connect(); // Socket
const LOADING_MSG_AND_ICON = "<p class='message-day'><strong><i>" + "Loading History Messages..." + "</i></strong><span class='loadingIcon'></span></p>";
const NO_HISTORY_MSG = "<p class='message-day'><strong><i>" + "-沒有更舊的歷史訊息-" + "</i></strong></p>";
const COLOR = {
  FIND: "#ff0000",
  CLICKED: "#ccc",
  FINDBACK: "#ffff00"
};
const SCROLL = {
  HEIGHT: 90
};
const filterDataBasic = { //option of filter age, recent_chat_time, first_chat_time
  age: ['0', '20', '30', '40', '50', '60', '60 up'],
  recent: ['< 10 min', '10 min', '30 min', '60 min', '2 hr', '12 hr', '1 day', '1 week', '1 month', '1 month up'],
  first: ['< 1 day', '1 day', '1 week', '2 week', '1 month', '3 month', '6 month', '1 year', '1 year up']
};
var yourdomain = 'fongyu'; // freshdesk domain
const api_key = 'UMHU5oqRvapqkIWuOdT8'; // freshdesk agent api key
var agentId = ""; // agent的ID
var person = "Unname"; // agent稱謂
var name_list = []; // list of all users
var room_list = []; // room ID for line
var userProfiles = []; //array which store all user's profile
var overview = [];
var overview_list = [];
var ticketInfo = {};
var memoInfo = [];
var contactInfo = {};
var agentInfo = {};
var filterDataCustomer = {}; //option of filter customized tags
var n = 0;
var sortRecentBool = true; //bool for sort recent time up or down
var sortTotalBool = true; //bool for sort total time up or down
var sortFirstBool = true; //bool for sort first time up or down
var TagsData; //data of user info tags
var internalTagsData;
var agentIdToName;
// selectors
var messageInput = $('#message'); // 訊息欄
var canvas = $("#canvas"); // 聊天室空間
var infoCanvas = $("#infoCanvas"); // 個人資料空間
var error = $('.error');
var messageMemo = $('#messageMemo');
var hiddenGroupName = $('.hidden-group-name');
var ocClickShow = $('.on-click-show');
var openChatAppItem = $('.chat-app-item[open="true"]');
var searchBox = $('#searchBox');
var addTicketModal = $('#addTicketModal');
$(document).ready(function() {
  // start the loading works
  if(window.location.pathname === '/chat') {
    socket.emit("get tags from chat");
    testOverview();
    setInterval(testOverview, 60000);
    let timer_1 = setInterval(function() {
      if(!auth.currentUser) {
        return;
      } else {
        clearInterval(timer_1);
        userId = auth.currentUser.uid;
        loadOverviewReply(userId);
        database.ref('users/' + userId).once('value', snap => {
          let data = snap.val();
          let name1 = data.name1;
          let name2 = data.name2;
          let fbName = data.fbName;
          let id1 = data.chanId_1;
          let id2 = data.chanId_2;
          let secret1 = data.chanSecret_1;
          let secret2 = data.chanSecret_2;
          let token1 = data.chanAT_1;
          let token2 = data.chanAT_2;
          let fbPageId = data.fbPageId;
          let fbAppId = data.fbAppId;
          let fbAppSecret = data.fbAppSecret;
          let fbValidToken = data.fbValidToken;
          let fbPageToken = data.fbPageToken;
          if((!name1 || !id1 || !secret1 || !token1) && (!name2 || !id2 || !secret2 || !token2) && (!fbName || !fbPageId || !fbAppId || !fbAppSecret || !fbValidToken || !fbPageToken)) {
            error.append('您還沒有做聊天設定，請至Settings做設定。').show();
            setTimeout(() => {
              error.text('').hide();
            }, 10000)
          } else {
            $('#line1 p').text(name1);
            $('#line2 p').text(name2);
            $('#fbname p').text(fbName);
            socket.emit('update bot', {
              line_1: {
                channelId: id1,
                channelSecret: secret1,
                channelAccessToken: token1
              },
              line_2: {
                channelId: id2,
                channelSecret: secret2,
                channelAccessToken: token2
              },
              fb: {
                pageID: fbPageId,
                appID: fbAppId,
                appSecret: fbAppSecret,
                validationToken: fbValidToken,
                pageToken: fbPageToken
              },
            });
            if((!name1 || !id1 || !secret1 || !token1) || (!name2 || !id2 || !secret2 || !token2) || (!fbName || !fbPageId || !fbAppId || !fbAppSecret || !fbValidToken || !fbPageToken)) {
              error.append('您其中一個群組還沒有做聊天設定，如有需要請至Settings做設定。').show();
              setTimeout(() => {
                error.text('').hide();
              }, 10000);
            }
          }
        });
        agentName();
        socket.emit('request channels', userId);
      }
    }, 10);
  }
  $(document).on('click', '#form-submit', submitAdd) //新增ticket
  $(document).on('click', '#signoutBtn', logout); // 登出
  $(document).on('click', '.tablinks', clickUserTablink); // 群組清單裡面選擇客戶
  $(document).on('click', '.topright', clickSpan);
  $(document).on('change', '.multiSelectContainer', multiselectChange);
  $(document).on('click', '#upImg', upImg); // 傳圖
  $(document).on('click', '#upVid', upVid); // 傳影
  $(document).on('click', '#upAud', upAud); // 傳音
  $(document).on('click', '#submitMsg', submitMsg); // 訊息送出
  $(document).on('click', "#ticketInfo-submit", updateStatus);//更新表單
  $(document).on('click', '.ticketContent', moreInfo);
  $(document).on('click', '.edit', showInput);
  $(document).on('focusout', '.inner', hideInput);
  $(document).on('click', '#submitMemo', submitMemo); // 新增ticket備註
  $(document).on('click', '#showTodo', function(){
    $('#profile').hide();
    $('#todo').show();
  });
  $(document).on('click', '#showProfile', function(){
    $('#todo').hide();
    $('#profile').show();   
  });
  $(document).on('keypress', '.inner', function(e) {
    if(e.which === 13) $(this).blur();
  });
  $(document).on('click', '.dropdown-menu', function(event) {
    event.stopPropagation();
  });
  $(document).on('click', '.filterArea h4', function() {
    $(this).siblings().toggle(200, 'easeInOutCubic');
    $(this).children('i').toggle();
  });
  $(document).on('click', '.userInfoTd[modify="true"] p#tdInner', function() {
    let val = $(this).text(); //抓目前的DATA
    let td = $(this).parents('.userInfoTd');
    td.html('<input id="tdInner" type="text" value="' + val + '"></input>'); //把element改成input，放目前的DATA進去
    td.find('input').select(); //自動FOCUS該INPUT
  });
  $(document).on('keypress', '.userInfoTd[modify="true"] input[type="text"]', function(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if(code === 13) {
      $(this).blur(); //如果按了ENTER就離開此INPUT，觸發on blur事件
    }
  });
  $(document).on('blur', '.userInfoTd[modify="true"] input[type="text"]', function() {
    let val = $(this).val(); //抓INPUT裡的資料
    if(!val) val = "尚未輸入";
    $(this).parent().html('<p id="tdInner">' + val + '</p>'); //將INPUT元素刪掉，把資料直接放上去
  });
  $(document).on('keyup', '.ticketSearchBar', function(e) {
    let searchStr = $(this).val();
    let trs = $(this).parents('table').find('tbody').find('tr');
    trs.each(function() {
      let text = $(this).text();
      if(text.indexOf(searchStr) === -1) $(this).hide();
      else $(this).show();
    });
  });
  $(document).on('click', '.table-sort', function() {
    let index = $(this).index();
    let compare;
    let icon = $(this).find('i');
    if(icon.attr('class').indexOf('fa-sort-up') === -1) {
      compare = sortUp;
      icon.attr('class', 'fa fa-fw fa-sort-up');
    } else {
      compare = sortDown;
      icon.attr('class', 'fa fa-fw fa-sort-down');
    }
    $(this).siblings().find('i').attr('class', 'fa fa-fw fa-sort');
    let trs = $(this).parents('table').find('tbody').find('tr');
    for(let i = 0; i < trs.length; i++) {
      for(let j = i + 1; j < trs.length; j++) {
        let a = trs.eq(i).find('td').eq(index).text();
        let b = trs.eq(j).find('td').eq(index).text();
        if(compare(a, b)) {
          let tmp = trs[i];
          trs[i] = trs[j];
          trs[j] = tmp;
        }
      }
    }
    trs.eq(1).parent().append(trs);
    function sortUp(a, b) {
      return a > b;
    }
    function sortDown(a, b) {
      return a < b;
    }
  });
  $(document).on('click', '.profile-confirm button', function() {
    let userId = $(this).parents('.card-group').attr('id');
    userId = userId.substr(0, userId.length - 5);
    let channelId = $(this).parents('.card-group').attr('rel');
    channelId = channelId.substr(0, channelId.length - 5);
    let method = $(this).attr('id');
    if(method === "confirm") {
      if(confirm("Are you sure to change profile?")) {
        let data = {
          userId: userId,
          channelId: channelId
        };
        let tds = $(this).parents('.card-group').find('.panelTable tbody td');
        tds.each(function() {
          let prop = $(this).attr('id');
          let type = $(this).attr('type');
          let value;
          if(type === "text") value = $(this).find('#tdInner').text();
          else if(type === "time") value = $(this).find('#tdInner').val();
          else if(type === "single-select") value = $(this).find('#tdInner').val();
          else if(type === "multi-select") value = $(this).find('.multi-selectSelectedText').attr('rel');
          if(!value) value = "";
          data[prop] = value;
        });
        socket.emit('update profile', data);
      } else {}
    } else {
      console.log("cancelled");
    }
  });
  $(document).on('click', '.internal-profile-confirm button', function() {
    let roomId = $(this).parents('.card-group').attr('id');
    roomId = roomId.substr(0, roomId.length - 5);
    let method = $(this).attr('id');
    if(method === "confirm") {
      if(confirm("Are you sure to change profile?")) {
        let data = {
          roomId: roomId
        };
        let tds = $(this).parents('.card-group').find('.panelTable tbody td');
        tds.each(function() {
          let prop = $(this).attr('id');
          let type = $(this).attr('type');
          let value;
          if(type === "text") value = $(this).find('#tdInner').text();
          else if(type === "time") value = $(this).find('#tdInner').val();
          else if(type === "single-select") value = $(this).find('#tdInner').val();
          else if(type === "multi-select") value = $(this).find('.multi-selectSelectedText').attr('rel');
          if(!value) value = "";
          data[prop] = value;
          console.log(data);
        });
        socket.emit('update internal profile', data);
      }
    } else {
      console.log("cancelled");
    }
  });
  $.extend($.expr[':'], {
    'containsi': function(elem, i, match, array) {
      return(elem.textContent || elem.innerText || '').toLowerCase().indexOf(
        (match[3] || "").toLowerCase()) >= 0;
    }
  });
  messageInput.on('keydown', function(event) { // 按enter可以發送訊息
    if(event.keyCode === 13) {
      document.getElementById('submitMsg').click();
    }
  });
  hiddenGroupName.mouseover(function() { // 秀群組名稱
    $(this).show();
  })
  // 傳圖，音，影檔功能
  ocClickShow.on('click', function(e) {
    var eId = $(this).data('id');
    $('#' + eId).trigger('click');
  }); //ocClickShow
  $('.send-file').on('change', function() {
    var $contentPanel = $(this).parent().parent().parent().parent();
    var $chat = $contentPanel.find('#canvas').find('div[style="display: block;"]');
    var id = $chat.attr('id');
    var rel = $chat.attr('rel');
    if(0 < this.files.length) {
      var file = this.files[0];
      var self = this;
      var storageRef = firebase.storage().ref();
      var fileRef = storageRef.child(file.lastModified + '_' + file.name);
      fileRef.put(file).then(function(snapshot) {
        var url = snapshot.a.downloadURLs[0];
        var type = $(self).data('type');
        var data = {
          msg: '/' + type + ' ' + url,
          id: id,
          room: rel,
          channelId: rel,
        }
        socket.emit('send message', data);
      });
    }
  });
  openChatAppItem.click(function() {
    let thisRel = $(this).attr('rel');
    if(thisRel === 'All') {
      $('.tablinks-area').find('b').show();
    } else if(thisRel === 'unread') {
      $('.tablinks-area').find('.unreadMsg').each(function(index, el) {
        if($(this).text() === '0') {
          $(this).parent().parent().hide();
        } else {
          $(this).parent().parent().show();
        }
      });
    } else if(thisRel === 'assigned') {
      $('.tablinks-area').find('b').hide();
      $('#指派負責人 #tdInner').each(function(index, el) {
        if($(this).text() !== '尚未輸入') {
          let id = $(this).parent().parent().parent().parent().parent().parent().attr('id');
          let room = $(this).parent().parent().parent().parent().parent().parent().attr('rel');
          let newId = id.substr(0, id.indexOf('-'));
          let newRoom = room.substr(0, room.indexOf('-'));
          $('[name="' + newId + '"][rel="' + newRoom + '"]').parent().show();
        }
      });
    } else if(thisRel === 'unassigned') {
      $('.tablinks-area').find('b').hide();
      $('#指派負責人 #tdInner').each(function(index, el) {
        if($(this).text() === '尚未輸入') {
          let id = $(this).parent().parent().parent().parent().parent().parent().attr('id');
          let room = $(this).parent().parent().parent().parent().parent().parent().attr('rel');
          let newId = id.substr(0, id.indexOf('-'));
          let newRoom = room.substr(0, room.indexOf('-'));
          $('[name="' + newId + '"][rel="' + newRoom + '"]').parent().show();
        }
      });
    } else {
      $('.tablinks-area').find('b').hide();
      $('.tablinks-area').find('[rel="' + thisRel + '"]').parent().show();
    }
  });
  var count = 0;
  var $tablinks = [];
  var $panels = [];
  var $clientNameOrTexts = [];
  searchBox.on('keypress', function(e) {
    count = 0;
    $tablinks = [];
    $panels = [];
    $clientNameOrTexts = [];
    let code = (e.keyCode ? e.keyCode : e.which);
    if(code != 13) return;
    let searchStr = $(this).val().toLowerCase();
    if(searchStr === "") {
      $('#search-right').addClass('invisible');
      displayAll();
      $('.tablinks').each(function() {
        let id = $(this).attr('name');
        let room = $(this).attr('rel');
        let panel = $("div #" + id + "-content[rel='" + room + "']");
        panel.find(".message").each(function() {
          $(this).find('.content').removeClass('found');
        });
      });
    } else {

      $('.tablinks').each(function() {
        $self = $(this);
        let id = $(this).attr('name');
        let room = $(this).attr('rel');
        let panel = $("div #" + id + "-content[rel='" + room + "']");
        let color = "";
        let display = false;

        // 客戶名單搜尋
        $(this).find('.clientName').each(function() {
          let text = $(this).text();
          if(text.toLowerCase().indexOf(searchStr) != -1) {
            if(0 === count){
              $self.trigger('click');
            }
            $tablinks.push($self);
            $panels.push(null);
            $clientNameOrTexts.push(null);
            count += 1;
            $(this).find('.content').addClass('found');
            display = true;
          }else{
            $(this).find('.content').removeClass('found');

          }
        });
        // 聊天室搜尋
        panel.find(".message").each(function() {
          let text = $(this).find('.content').text();
          var $content = $(this).find('.content');
          if(text.toLowerCase().indexOf(searchStr) != -1) {
            // displayMessage match的字標黃
            if(0 === count){
              $self.trigger('click');
              var top = $(this).offset().top;
              panel.scrollTop(top + SCROLL.HEIGHT);
            }
            $tablinks.push($self);
            $panels.push(panel);
            $clientNameOrTexts.push($(this));
            count += 1;
            $(this).find('.content').addClass('found');
                        // displayClient顯示"找到訊息"並標紅
            display = true;

            $('[name="' + id + '"][rel="' + room + '"]').find('#msg').css('color', COLOR.FIND).text("找到訊息");
          }else{
            $(this).find('.content').removeClass('found');

          }
        });

        if(1 <= count){
          $('#this-number').html(1);
          $('#total-number').html(count);
          $('#search-right').removeClass('invisible');
          $(this).css('color', color);
        }


        if(display === false){
          $(this).css('display', 'none');
        }else{
          $(this).css('display', 'block');
        }

      });
    }
  });
  $('div.search .glyphicon-chevron-up').on('click', (e) => {
    var i = Number($('#this-number').html());
    var total = Number($('#total-number').html());

    if(Number(i) <= 1){
      i = total;
    }else{
      i -=　1;
    }
    var $panel = $panels[ (i-1) ];
    var $tablink = $tablinks[ (i-1) ];
    $tablink.trigger('click');

    if(null !== $clientNameOrTexts[(i-1)]){
      var $clientNameOrText = $clientNameOrTexts[(i-1)];
      var top = $clientNameOrText.offset().top;
      $panel.scrollTop(top + SCROLL.HEIGHT);
    }

    $('#this-number').html(Number(i));
  });

  $('div.search .glyphicon-chevron-down').on('click', (e) => {
    var i = Number($('#this-number').html());
    var total = Number($('#total-number').html());

    if(Number(i) >= total){
      i = 1;
    }else{
      i +=　1;
    }
    var $panel = $panels[ (i-1) ];
    var $tablink = $tablinks[ (i-1) ];
    $tablink.trigger('click');

    if(null !== $clientNameOrTexts[(i-1)]){
      var $clientNameOrText = $clientNameOrTexts[(i-1)];
      var top = $clientNameOrText.offset().top;
      $panel.scrollTop(top + SCROLL.HEIGHT);
    }

    $('#this-number').html(Number(i));

  });

  //end searchBox change func
  addTicketModal.on('show.bs.modal', function() {
    let getId = $('.card-group:visible').attr('id');
    // let getId = $(this).attr('id');
    let realId = getId.substr(0, getId.indexOf('-'));
    // console.log('realId', getId);
    $('#form-uid').val(realId);
  });
  // Socket
  socket.on('response line channel', (data) => {
    if(data.chanId_1 === '' && data.chanId_2 === '') {
      error.text('群組名稱沒有設定，請於設定頁面更改。').show();
    } else {
      $('#Line_1').attr('rel', data.chanId_1);
      $('#Line_2').attr('rel', data.chanId_2);
      room_list.push(data.chanId_1);
      room_list.push(data.chanId_2);
      socket.emit('get json from back');
      socket.emit('get internal chat from back', {
        id: userId
      });
    }
  });
  socket.on('push json to front', (data) => {
    // console.log(data);
    for(i in data) pushMsg(data[i]); //聊天記錄
    setTimeout(function() {
      for(i in data) pushInfo(data[i]);
    }, 500);
    sortUsers("recentTime", sortRecentBool, function(a, b) {
      return a < b;
    }); //照時間排列 新到舊
  });
  socket.on('push internal chat to front', (data) => {
    // console.log(data);
    internalTagsData = data.internalTagsData;
    agentIdToName = data.agentIdToName;
    for(i in data.data) {
      pushInternalMsg(data.data[i]); //聊天記錄
      pushInternalInfo(data.data[i].Profile);
    }
  });
  socket.on('push user ticket', (data) => {
    let id = data.id;
    let ticket = data.ticket;
    let content = '';
    for(let i in ticket) {
      content += "<div class='card text-center ticket-card'>" + "<div class='ticket-card-header' " + "style='color:white;background-color:" + priorityColor(ticket[i].priority) + "'>" + "ticket No." + ticket[i].id + "</div>" + "<div class='card-body'>" + "<h4 class='card-title'>" + ticket[i].subject + "</h4>" + "<p class='card-text'>" + ticket[i].description + "</p>" + "</div>" + "<div class='card-footer text-muted'>" + "Create at " + CreateDate(ticket[i].created_at) + " ago" + "</div>" + "</div>"
    }
    $("#" + id + "-info").children("#ticket").append(content);
  });
  socket.on('upload history msg from back', data => {
    let msgContent = $('#' + data.userId + '-content' + '[rel="' + data.roomId + '"]');
    let origin_height = msgContent[0].scrollHeight;
    msgContent.find('.message:first').remove();
    msgContent.find('.message-day:lt(3)').remove();
    msgContent.prepend(historyMsg_to_Str(data.messages));
    let now_height = msgContent[0].scrollHeight;
    msgContent.animate({
      scrollTop: now_height - origin_height
    }, 0);
    if(msgContent.attr('data-position') > 0) msgContent.prepend(LOADING_MSG_AND_ICON);
    else msgContent.prepend(NO_HISTORY_MSG);
  });
  socket.on('new message', (data) => {
    if(!data.channelId) data.channelId = "FB";

    let $room = $('.chat-app-item[rel="'+data.channelId+'"]');
    if( $room.length!=0 ) {
      displayMessage(data, data.channelId); //update 聊天室
      displayClient(data, data.channelId); //update 客戶清單
      if(name_list.indexOf(data.channelId + data.id) === -1) { // 新客戶
        name_list.push(data.channelId + data.id);
      }
    }
  });
  socket.on('new internal message', (data) => {
    let $room = $('.tablinks-area .tablinks[name="'+data.roomId+'"]');
    if( $room.length!=0 ) {
      displayMessageInternal(data.sendObj, data.roomId);
      displayClientInternal(data.sendObj, data.roomId);
    }
  });
  socket.on('new user profile', function(data) {
    userProfiles[data.userId] = data;
  });
  socket.on('reply keywords to front', function(data) {
    socket.emit('send message', data);
  });
  socket.on('autoreply to front', function(data){ //呼叫後端寄出訊息
    socket.emit('send message', data);
    console.log('socket emit send message from js');
  });
  socket.on("push tags to chat", data => {
    TagsData = data;
    initialFilterWay();
    initialFilterSilder();
  });
}); //document ready close
function cancelSubmit() {
  $(this).hide();
  $(this).siblings('#save-group-btn').hide();
  $(this).siblings('[type="text"]').hide();
  $(this).siblings('.myText').show();
} // end of cancelSubmit
function displayAll() {
  $('.tablinks').each(function() {
    let id = $(this).attr('name');
    let rel = $(this).attr('rel');
    $(this).find('#msg').text($("div #" + id + "-content" + "[rel='" + rel + "']" + " .message:last").find('.content').text().trim()).css('color', 'black');
    $("div #" + id + "-content" + "[rel='" + rel + "']" + " .message").find('.content').css({
      "color": "black",
      "background-color": "lightgrey"
    });
    $(this).find('.clientName').css({
      "color": "black",
      "background-color": ""
    });
  });
} // end of displayAll
function sortUsers(ref, up_or_down, operate) {
  let arr = $('#clients b');
  for(let i = 0; i < arr.length - 1; i++) {
    for(let j = i + 1; j < arr.length; j++) {
      let a = arr.eq(i).children(".tablinks").attr("data-" + ref) - '0';
      let b = arr.eq(j).children(".tablinks").attr("data-" + ref) - '0';
      if(up_or_down === operate(a, b)) {
        let tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    }
  }
  $('#clients').append(arr);
} //end of sortUsers
function statusColor(status){
  switch(status) {
    case 1:
      return 'red';
      break;
    case 2://open
      return '#2fd02f';
      break;
    case 3://pending
      return '#6ede6e';
      break;
    case 4://resolved
      return '#acecac';
      break;
    default://closed
      return '#ebfaeb';
  }  
}
function priorityColor(priority) {
  switch(priority) {
    case 4:
      return '#fce9e9';
      break;
    case 3:
      return '#fcf5cf';
      break;
    case 2:
      return '#d8ebf3';
      break;
    case 1:
      return '#e6ffe6';
      break;
    default:
      return 'N/A';
  }
} // end of priorityColor
function CreateDate(day) {
  let html = '';
  let nowTime = new Date().getTime();
  let dueday = Date.parse(displayDate(day));
  let sec = (nowTime - dueday) / 1000;
  if(sec < 60) return Math.round(sec) + " second(s)";
  else {
    let min = sec / 60;
    if(min < 60) return Math.round(min) + " minute(s)";
    else {
      let hr = min / 60;
      if(hr < 48) return Math.round(hr) + " hours(s)";
      else {
        let day = Math.floor(hr / 24);
        hr %= 24;
        return day + " day(s) " + Math.round(hr) + " hour(s) ";
      }
    }
  }
} // end of CreateDate
function displayDate(date) {
  let origin = new Date(date);
  origin = origin.getTime();
  let gmt8 = new Date(origin);
  let yy = gmt8.getFullYear(),
    mm = gmt8.getMonth() + 1,
    dd = gmt8.getDate(),
    hr = gmt8.getHours(),
    min = gmt8.getMinutes();
  return yy + "/" + mm + "/" + dd + " " + hr + ":" + min;
} // end of displayDate
function multiselectChange() {
  let valArr = [];
  let textArr = [];
  let boxes = $(this).find('input');
  boxes.each(function() {
    if($(this).is(':checked')) {
      valArr.push($(this).val());
      textArr.push($(this).parents('li').text());
    }
  });
  valArr = valArr.join(',');
  if(textArr.length === boxes.length) textArr = "全選";
  else textArr = textArr.join(',');
  $(this).parent().find($('.multi-selectSelectedText')).text(textArr).attr('rel', valArr);
} // end of multiSelectChange
function historyMsg_to_Str(messages) {
  let returnStr = "";
  let nowDateStr = "";
  let prevTime = 0;
  for(let i in messages) {
    //this loop plus date info into history message, like "----Thu Aug 01 2017----"
    let d = new Date(messages[i].time).toDateString(); //get msg's date
    if(d != nowDateStr) {
      //if (now msg's date != previos msg's date), change day
      nowDateStr = d;
      returnStr += "<p class='message-day'><strong>" + nowDateStr + "</strong></p>"; //plus date info
    }
    if(messages[i].time - prevTime > 15 * 60 * 1000) {
      //if out of 15min section, new a section
      returnStr += "<p class='message-day'><strong>" + toDateStr(messages[i].time) + "</strong></p>"; //plus date info
    }
    prevTime = messages[i].time;
    if(messages[i].owner === "agent") {
      //plus every history msg into string
      returnStr += toAgentStr(messages[i].message, messages[i].name, messages[i].time);
    } else returnStr += toUserStr(messages[i].message, messages[i].name, messages[i].time);
  }
  return returnStr;
} // end of historyMsg_to_Str
function internal_historyMsg_to_Str(messages) {
  let returnStr = "";
  let nowDateStr = "";
  let prevTime = 0;
  for(let i in messages) {
    messages[i].name = agentIdToName[messages[i].agentId];
    //this loop plus date info into history message, like "----Thu Aug 01 2017----"
    let d = new Date(messages[i].time).toDateString(); //get msg's date
    if(d != nowDateStr) {
      //if (now msg's date != previos msg's date), change day
      nowDateStr = d;
      returnStr += "<p class='message-day' style='text-align: center'><strong>" + nowDateStr + "</strong></p>"; //plus date info
    }
    if(messages[i].time - prevTime > 15 * 60 * 1000) {
      //if out of 15min section, new a section
      returnStr += "<p class='message-day' style='text-align: center'><strong>" + toDateStr(messages[i].time) + "</strong></p>"; //plus date info
    }
    prevTime = messages[i].time;
    if(messages[i].agentId == userId) {
      //plus every history msg into string
      returnStr += toAgentStr(messages[i].message, messages[i].name, messages[i].time);
    } else returnStr += toUserStr(messages[i].message, messages[i].name, messages[i].time);
  }
  return returnStr;
} // end of internal_historyMsg_to_Str
function toAgentStr(msg, name, time) {
  if(Array.isArray(msg)) msg.map(function(x) {
    msg = x;
  });
  if(msg.startsWith("<a") || msg.startsWith("<img")) {
    return '<p class="message" rel="' + time + '" style="text-align: right;line-height:250%" title="' + name + ' ' + toDateStr(time) + '"><span  class="sendTime">' + toTimeStr(time) + '</span><span class="content">  ' + msg + '</span><strong></strong><br/></p>';
  } else {
    return '<p class="message" rel="' + time + '" style="text-align: right;line-height:250%" title="' + name + ' ' + toDateStr(time) + '"><span  class="sendTime">' + toTimeStr(time) + '</span><span class="content" style="border:1px solid #b5e7a0; padding:8px; border-radius:10px; background-color:#b5e7a0">  ' + msg + '</span><strong></strong><br/></p>';
  }
} // end of toAgentStr
function toUserStr(msg, name, time) {
  if(msg.startsWith("<a") || msg.startsWith("<img")) {
    return '<p style="line-height:250%" class="message" rel="' + time + '" title="' + name + ' ' + toDateStr(time) + '"><strong></strong><span class="content">  ' + msg + '</span><span class="sendTime">' + toTimeStr(time) + '</span><br/></p>';
  } else {
    return '<p style="line-height:250%" class="message" rel="' + time + '" title="' + name + ' ' + toDateStr(time) + '"><strong></strong><span style="border:1px solid lightgrey;background-color:lightgrey; padding:8px; border-radius:10px" class="content">  ' + msg + '</span><span class="sendTime">' + toTimeStr(time) + '</span><br/></p>';
  }
} // end of toUserStr
function toDateStr(input) {
  let str = " ";
  let date = new Date(input);
  str += date.getFullYear() + '/' + addZero(date.getMonth() + 1) + '/' + addZero(date.getDate()) + ' ';
  let week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  str += week[date.getDay()] + ' ' + addZero(date.getHours()) + ':' + addZero(date.getMinutes());
  return str;
} // end of toDateStr
function toTimeStr(input) {
  let date = new Date(input);
  return " (" + addZero(date.getHours()) + ':' + addZero(date.getMinutes()) + ") ";
} // end of toTimeStr
function toTimeStrMinusQuo(input) {
  let date = new Date(input);
  return addZero(date.getHours()) + ':' + addZero(date.getMinutes());
} // end of toTimeStrMinusQuo
function addZero(val) {
  return val < 10 ? '0' + val : val;
} // end of addZero
function loadTable(userId) {
  $('.ticket-content').empty();
  $('.ticket_memo').empty();
  var ticket_memo_list = [];

  $.ajax({
    url: "https://" + yourdomain + ".freshdesk.com/api/v2/tickets?include=requester",
    type: 'GET',
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    headers: {
      "Authorization": "Basic " + btoa(api_key + ":x")
    },
    success: function(data, textStatus, jqXHR) {//項目分類
      var Case = [];
      for(let i = 0; i < data.length; i++) {
        if(data[i].subject === userId) {
          if (Case.indexOf(data[i].requester.name) == -1){
            Case.push(data[i].requester.name);
              $('.ticket-content').prepend(
                '<tr>'+
                '<td style="padding:0; margin:0" align="center" colspan="6">'+
                '<div class="panel-group">'+
                  '<div class="panel panel-default">'+
                    '<div style="margin:0" class="panel-heading">'+
                      '<h4 class="panel-title">'+
                        '<a data-toggle="collapse" href="#'+data[i].requester.name+'">項目： '+data[i].requester.name+'</a>'+
                      '</h4>'+
                    '</div>'+
                    '<div id="'+data[i].requester.name+'" class="panel-collapse collapse">'+
                      '<ul class="list-group '+data[i].requester.name+' "></ul>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
                '</td>'+
                '</tr>');
          }
          ticketInfo = data;
          $('#'+data[i].requester.name).prepend('<li style="width:100%; border-left: 50px solid ' + statusColor(data[i].status) + '" id="' + i + '" class="list-group-item ticketContent" data-toggle="modal" data-target="#ticketInfoModal">' + '<td hidden class="data_id">No. ' + data[i].id + '</td>' + '<td><div>' + data[i].description + '</div></td>' + '<td>' + displayDate(data[i].due_by) + '</td>' + '<td>' + dueDate(data[i].due_by) + '</td>' + '</li>');
          ticket_memo_list.push(String(data[i].id));//這個用戶的所有ticket
        }
      }
    },
    error: function(jqXHR, tranStatus) {
      console.log('error');
      alert('讀取失敗，請刷新頁面重試');
    }
  });
  setTimeout(function() {//memo
    console.log('ticket_memo_list有照順序排嗎？？？', ticket_memo_list);
    for(var ticketNumber in ticket_memo_list) {//改成append到對應的ticket
      $.ajax({
        url: "https://" + yourdomain + ".freshdesk.com/api/v2/tickets/" + ticket_memo_list[ticketNumber] + "/conversations",
        type: 'GET',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {
          "Authorization": "Basic " + btoa(api_key + ":x")
        },
        success: function(data, textStatus, jqXHR) {
          memoInfo.push(data);
          console.log('memoInfo after push',memoInfo);
          // for(let j = 0; j < data.length; j++) {
          //   $('.ticket_memo').append('<div class="memo_content">' + data[j].body + '</div>');
          // }
        },
        error: function(jqXHR, tranStatus) {
          console.log('get ticket error');
          console.log(tranStatus);
          alert('讀取失敗，請刷新頁面重試');

        }
      });
    }
  }, 500);
} // end of loadTable
function statusNumberToText(status) {
  switch(status) {
    case 5:
      return 'Closed';
      break;
    case 4:
      return 'Resolved';
      break;
    case 3:
      return 'Pending';
      break;
    default:
      return 'Open';
  }
} // end of statusNumberToText
function priorityNumberToText(priority) {
  switch(priority) {
    case 4:
      return 'Urgent';
      break;
    case 3:
      return 'High';
      break;
    case 2:
      return 'Medium';
      break;
    default:
      return 'Low';
  }
} // end of priorityNumberToText
function dueDate(day) {
  let html = '';
  let nowTime = new Date().getTime();
  let dueday = Date.parse(displayDate(day));
  let hr = dueday - nowTime;
  hr /= 1000 * 60 * 60;
  if(hr < 0) {
    html = '<span class="overdue">過期</span>';
  } else {
    html = '<span class="non overdue">即期</span>';
  }
  return html;
} // end of dueDate
function responderName(id) {
  for(let i in agentInfo) {
    if(agentInfo[i].id === id) return agentInfo[i].contact.name;
  }
  return "unassigned";
} // end of responderName
function showSelect(prop, n) {
  let html = "<select class='select'>";
  if(prop === 'priority') {
    html += "<option value=" + n + ">" + priorityNumberToText(n) + "</option>";
    for(let i = 1; i < 5; i++) {
      if(i === n) continue;
      html += "<option value=" + i + ">" + priorityNumberToText(i) + "</option>";
    }
  } else if(prop === 'status') {
    html += "<option value=" + n + ">" + statusNumberToText(n) + "</option>";
    for(let i = 2; i < 6; i++) {
      if(i === n) continue;
      html += "<option value=" + i + ">" + statusNumberToText(i) + "</option>";
    }
  } else if(prop === 'responder') {
    html += "<option value=" + n + ">" + responderName(n) + "</option>";
    for(let i in agentInfo) {
      let id = agentInfo[i].id;
      if(id === n) continue;
      html += "<option value=" + id + ">" + responderName(id) + "</option>";
    }
  }
  html += "</select>";
  return html;
} // end of showSelect
function moreInfo() {
  console.log('memoInfo before moreInfo', memoInfo);
  let display;
  let memos;
  let i = $(this).attr('id');
  let Tinfo = ticketInfo[i];
  let Cinfo;
  let Ainfo;
  $("#ID_num").text(Tinfo.id);
  $("#ID_num").css("background-color", statusColor(Tinfo.status));
  display = '<tr>' + '<th>客戶ID</th>' + '<td class="edit">' + Tinfo.subject + '</td>' + '</tr><tr>' + '<th>負責人</th>' + '<td>' + showSelect('responder', Tinfo.responder_id) + '</td>' + '</tr><tr>' + '<th>優先</th>' + '<td>' + showSelect('priority', Tinfo.priority) + '</td>' + '</tr><tr>' + '<th>狀態</th>' + '<td>' + showSelect('status', Tinfo.status) + '</td>' + '</tr><tr>' + '<th>描述</th>' + '<td class="edit">' + Tinfo.description_text + '</td>' + '</tr><tr>' + '<th>到期時間' + dueDate(Tinfo.due_by) + '</th>' + '<td  class="edit">' + displayDate(Tinfo.due_by) + '</td>' + '</tr><tr>' + '<th>建立日</th>' + '<td>' + displayDate(Tinfo.created_at) + '</td>' + '</tr><tr>' + '<th>最後更新</th>' + '<td>' + displayDate(Tinfo.updated_at) + '</td>' + '</tr><tr>' + '<th>備註</th>'+ '<td  class="ticket_memo"></td></tr>';
  memoInfo[i].map(x => memos += '<p class="memo_content">'+x.body_text+'</p>');
  for(let j in contactInfo) {
    if(contactInfo[j].id === Tinfo.requester_id) {
      Cinfo = contactInfo[j];
      display += '<tr>' + '<th>requester</th>' + '<td>' + Cinfo.name + '</td>' + '</tr><tr>' + '<th>requester email</th>' + '<td>' + Cinfo.email + '</td>' + '</tr><tr>' + '<th>requester phone</th>' + '<td>' + Cinfo.phone + '</td>' + '</tr>'
      break;
    }
  }
  for(let j in agentInfo) {
    if(agentInfo[j].id === Tinfo.requester_id) {
      Ainfo = agentInfo[j];
      display += '<tr>' + '<th>requester(<span style="color:red">agent</span>)</th>' + '<td>' + Ainfo.contact.name + '</td>' + '</tr><tr>' + '<th>requester email</th>' + '<td>' + Ainfo.contact.email + '</td>' + '</tr><tr>' + '<th>requester phone</th>' + '<td>' + Ainfo.contact.phone + '</td>' + '</tr>'
      break;
    }
  }
  $(".ticket_info_content").html('');
  $(".modal-header").css("border-bottom", "3px solid " + statusColor(Tinfo.status));
  $(".modal-title").text(Tinfo.requester.name);
  $(".ticket_info_content").append(display);
  $(".ticket_memo").append(memos);
} // end of moreInfo
function loadMessageInDisplayClient(msg) {
  if(msg.length > 6) {
    return msg = msg.substr(0, 10) + '...';
  } else {
    return msg;
  }
} // end of loadMessageInDisplayClient
function cancelSubmit() {
  $(this).hide();
  $(this).siblings('#save-group-btn').hide();
  $(this).siblings('[type="text"]').hide();
  $(this).siblings('.myText').show();
} // end of cancelSubmit
function loadKeywordsReply(userId) {
  database.ref('message-keywordsreply/' + userId).once('value', snap => {
    let dataArray = snap.val();
    setTimeout(function() {
      for(var i in dataArray) {
        socket.emit('update keywords', {
          message: dataArray[i].taskMainK,
          reply: dataArray[i].taskText
        });
        for(var n = 0; n < dataArray[i].taskSubK.length; n++) {
          socket.emit('update subKeywords', {
            message: dataArray[i].taskSubK[n],
            reply: dataArray[i].taskText
          });
        }
      }
    }, 1000);
  });
} // end of loadKeywordsReply

function loadAutoReply(userId){
  database.ref('message-autoreply/' + userId).once('value', snap => {
    let dataArray = snap.val();
    setTimeout(function(){
    for (var i in dataArray){

    socket.emit('update autoreply', { //將資料庫資料傳入後端
      taskName: dataArray[i].taskName,
      taskStart: dataArray[i].taskStart,
      taskEnd: dataArray[i].taskEnd,
      taskText: dataArray[i].taskText
    });

   }
}, 1000);

  });
  console.log('autoreply sent to back');
}//end of loading autoreply

function submitAdd() {
  console.log('submitAdd執行');
  let name = $('#form-name').val();
  let uid = $('#form-uid').val(); //因為沒有相關可用的string，暫時先儲存在to_emails這個功能下面
  let email = $('#form-email').val();
  let phone = $('#form-phone').val();
  let status = $('#form-status option:selected').text();
  let priority = $('#form-priority option:selected').text();
  let description = $('#form-description').val();
  ticket_data = '{ "description": "' + description + '", "name" : "' + name + '",  "subject": "' + uid + '", "email": "' + email + '", "phone": "' + phone + '", "priority": ' + priorityTextToMark(priority) + ', "status": ' + statusTextToMark(status) + '}';
  // 驗證
  let email_reg = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/;
  let phone_reg = /\b[0-9]+\b/;
  if(!email_reg.test(email)) {
    $('#error').append('請輸入正確的email格式');
    $('#form-email').css('border', '1px solid red');
    setTimeout(() => {
      $('#error').empty();
      $('#form-email').css('border', '1px solid #ccc');
    }, 3000);
  } else if(!phone_reg.test(phone)) {
    $('#error').append('請輸入正確的電話格式');
    $('#form-phone').css('border', '1px solid red');
    setTimeout(() => {
      $('#error').empty();
      $('#form-phone').css('border', '1px solid #ccc');
    }, 3000);
  } else if($('#form-uid').val().trim() === '') {
    $('#error').append('請輸入客戶ID');
    $('#form-subject').css('border', '1px solid red');
    setTimeout(() => {
      $('#error').empty();
      $('#form-subject').css('border', '1px solid #ccc');
    }, 3000);
  } else if($('#form-description').val().trim() === '') {
    $('#error').append('請輸入內容');
    $('#form-description').css('border', '1px solid red');
    setTimeout(() => {
      $('#error').empty();
      $('#form-description').css('border', '1px solid #ccc');
    }, 3000);
  } else if($('#form-name').val().trim() === '') {
    $('#error').append('請輸入客戶姓名');
    $('#form-name').css('border', '1px solid red');
    setTimeout(() => {
      $('#error').empty();
      $('#form-description').css('border', '1px solid #ccc');
    }, 3000);
  } else {
    let nowTime = new Date().getTime();
    let dueDate = nowTime + 86400000 * 3;
    let start = ISODateTimeString(nowTime);
    let end = ISODateTimeString(dueDate)
    let userId = auth.currentUser.uid;
    //把事件儲存到calendar database，到期時間和ticket一樣設定三天
    // database.ref('cal-events/' + userId).push({
    //   title: name + ": " + description.substring(0, 10) + "...",
    //   start: start,
    //   end: end,
    //   description: description,
    //   allDay: false
    // });
    setTimeout(function() {
      $.ajax({
        url: "https://" + yourdomain + ".freshdesk.com/api/v2/tickets",
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {
          "Authorization": "Basic " + btoa(api_key + ":x")
        },
        data: ticket_data,
        success: function(data, textStatus, jqXHR) {},
        error: function(jqXHR, tranStatus) {
          x_request_id = jqXHR.getResponseHeader('X-Request-Id');
          response_text = jqXHR.responseText;
          console.log(tranStatus);
        }
      });
    }, 200);
    $('#form-name').val('');
    $('#form-uid').val('');
    $('#form-subject').val('');
    $('#form-email').val('');
    $('#form-phone').val('');
    $('#form-description').val('');
    setTimeout(() => {
      location.href = '/chat';
    }, 500)
  }
} // end of submitAdd
function priorityTextToMark(priority) {
  switch(priority) {
    case 'Urgent':
      return 4;
      break;
    case 'High':
      return 3;
      break;
    case 'Medium':
      return 2;
      break;
    default:
      return 1;
  }
} // end of priorityTextToMark
function statusTextToMark(status) {
  switch(status) {
    case 'Closed':
      return 5;
      break;
    case 'Resolved':
      return 4;
      break;
    case 'Pending':
      return 3;
      break;
    default:
      return 2;
  }
} // end of statusTextToMark
function ISODateTimeString(d) {
  d = new Date(d);

  function pad(n) {
    return n < 10 ? '0' + n : n
  }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
} // end of ISODateTimeString
function sortCloseTable(n) {
  var table, rows, switching, i, x, y,
    shouldSwitch, dir, switchcount = 0;
  table = $(".ticket-content");
  switching = true;
  //Set the sorting direction to ascending:
  dir = "asc";
  /*Make a loop that will continue until
  no switching has been done:*/
  while(switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.find('tr');
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for(i = 0; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].childNodes[n];
      y = rows[i + 1].childNodes[n];
      /*check if the two rows should switch place,
      based on the direction, asc or desc:*/
      if(dir === "asc") {
        if(x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      } else if(dir === "desc") {
        if(x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
    }
    if(shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      //Each time a switch is done, increase this count by 1:
      switchcount++;
    } else {
      /*If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again.*/
      if(switchcount === 0 && dir === "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
} // end of sortCloseTable
function showInput() {
  let prop = $(this).parent().children("th").text();
  let original = $(this).text();
  if(prop.indexOf('due date') != -1) {
    let day = new Date(original);
    day = Date.parse(day) + 8 * 60 * 60 * 1000;
    day = new Date(day);
    $(this).html("<input type='datetime-local' class='inner' value='" + day.toJSON().substring(0, 23) + "'></input>");
  } else if(prop === 'description') {
    $(this).html("<textarea  class='inner' rows=4' cols='50'>" + original + "</textarea>");
  } else {
    $(this).html("<input type='text' class='inner' value='" + original + "' autofocus>");
  }
} // end of showInput
function hideInput() {
  let change = $(this).val();
  if($(this).attr('type') === 'datetime-local') {
    $(this).parent().html(displayDate(change));
  }
  $(this).parent().html(change);
} // end of hideInput

function pushMsg(data) {
  let historyMsg = data.Messages;
  let profile = data.Profile;
  // console.log(historyMsg, profile);
  let line1id = $('#Line_1').attr('rel') === undefined ? 'unassigned' : $('#Line_1').attr('rel');
  let line2id = $('#Line_2').attr('rel') === undefined ? 'unassigned' : $('#Line_2').attr('rel');
  let historyMsgStr = "";
  if(data.position !== 0) {
    historyMsgStr += LOADING_MSG_AND_ICON; //history message string head
  } else {
    historyMsgStr += NO_HISTORY_MSG; //history message string head
  }
  historyMsgStr += historyMsg_to_Str(historyMsg);
  // end of history message
  $('#user-rooms').append('<option value="' + profile.userId + '">' + profile.nickname + '</option>'); //new a option in select bar
  let lastMsg = historyMsg[historyMsg.length - 1];
  let font_weight = "normal";
  let lastMsgStr;

  if(lastMsg.message.startsWith('<a')) {
    lastMsgStr = '<br><div id="msg" style="font-weight: ' + font_weight + '; font-size:8px; margin-left:12px;">' + '客戶傳送檔案' + "</div>";
  } else if(lastMsg.message.startsWith('<img')) {
    lastMsgStr = '<br><div id="msg" style="font-weight: ' + font_weight + '; font-size:8px; margin-left:12px;">' + '客戶傳送貼圖' + "</div>";
  } else {
    lastMsgStr = '<br><div id="msg" style="font-weight: ' + font_weight + '; font-size:8px; margin-left:12px;">' + loadMessageInDisplayClient(lastMsg.message) + "</div>";
  }
  let msgTime = '<div style="float:right;font-size:8px; font-weight:normal">' + toTimeStrMinusQuo(lastMsg.time) + '</div>';

  if(typeof(profile.VIP等級) === "string" && profile.VIP等級 !== "未選擇") { // VIP優先放進 VIP欄位
    if(profile.channelId !== 'unassigned' && (profile.channelId === "FB" || profile.channelId === line1id || profile.channelId === line2id)){
      if(profile.unRead > 0) {
        $('#vip_list').prepend("<b><button class='tablinks'" + "name='" + profile.userId + "' rel='" + profile.channelId + "'" + "data-avgTime='" + profile.avgChat + "' " + "data-totalTime='" + profile.totalChat + "' " + "data-chatTimeCount='" + profile.chatTimeCount + "' " + "data-firstTime='" + profile.firstChat + "' " + "data-recentTime='" + lastMsg.time + "' >" + "<div class='img_holder'>" + "<img src='" + profile.photo + "' alt='無法顯示相片'>" + "</div>" + "<div class='msg_holder'>" + "<span class='clientName'>" + profile.nickname + "</span>" + lastMsgStr + "</div>" + "<div class='unreadMsg' style='display:block;'>" + profile.unRead + "</div>" + "</button><hr/></b>"); //new a tablinks
      } else {
        $('#vip_list').prepend("<b><button class='tablinks'" + "name='" + profile.userId + "' rel='" + profile.channelId + "'" + "data-avgTime='" + profile.avgChat + "' " + "data-totalTime='" + profile.totalChat + "' " + "data-chatTimeCount='" + profile.chatTimeCount + "' " + "data-firstTime='" + profile.firstChat + "' " + "data-recentTime='" + lastMsg.time + "' >" + "<div class='img_holder'>" + "<img src='" + profile.photo + "' alt='無法顯示相片'>" + "</div>" + "<div class='msg_holder'>" + "<span class='clientName'>" + profile.nickname + "</span>" + lastMsgStr + "</div>" + "<div class='unreadMsg' style='display:none;'>" + profile.unRead + "</div>" + "</button><hr/></b>"); //new a tablinks
      }
    }
  }
  else if(profile.channelId === "FB" || profile.channelId === room_list[0] || profile.channelId === room_list[1] ) {
    if(profile.unRead > 0) {
      $('#clients').append("<b><button class='tablinks'" + "name='" + profile.userId + "' rel='" + profile.channelId + "'" + "data-avgTime='" + profile.avgChat + "' " + "data-totalTime='" + profile.totalChat + "' " + "data-chatTimeCount='" + profile.chatTimeCount + "' " + "data-firstTime='" + profile.firstChat + "' " + "data-recentTime='" + lastMsg.time + "' >" + "<div class='img_holder'>" + "<img src='" + profile.photo + "' alt='無法顯示相片'>" + "</div>" + "<div class='msg_holder'>" + "<span class='clientName'>" + profile.nickname + "</span>" + lastMsgStr + "</div>" + "<div class='unreadMsg' style='display:block;'>" + profile.unRead + "</div>" + "</button><hr/></b>"); //new a tablinks
    } else {
      $('#clients').append("<b><button class='tablinks'" + "name='" + profile.userId + "' rel='" + profile.channelId + "'" + "data-avgTime='" + profile.avgChat + "' " + "data-totalTime='" + profile.totalChat + "' " + "data-chatTimeCount='" + profile.chatTimeCount + "' " + "data-firstTime='" + profile.firstChat + "' " + "data-recentTime='" + lastMsg.time + "' >" + "<div class='img_holder'>" + "<img src='" + profile.photo + "' alt='無法顯示相片'>" + "</div>" + "<div class='msg_holder'>" + "<span class='clientName'>" + profile.nickname + "</span>" + lastMsgStr + "</div>" + "<div class='unreadMsg' style='display:none;'>" + profile.unRead + "</div>" + "</button><hr/></b>"); //new a tablinks
    }
  }
  // 依照不同的channel ID做分類
  if(profile.channelId !== 'unassigned' && (profile.channelId === "FB" || profile.channelId === line1id || profile.channelId === line2id)){
    canvas.append( //push string into canvas
      '<div id="' + profile.userId + '" rel="' + profile.channelId + '" class="tabcontent">' + '<span class="topright">x&nbsp;&nbsp;&nbsp</span>' + "<div id='" + profile.userId + "-content' rel='" + profile.channelId + "' class='messagePanel' data-position='" + data.position + "'>" + historyMsgStr + "</div>" + "</div>"
    ); // close append
  }
  if(data.position != 0) $('#' + profile.userId + '-content' + '[rel="' + profile.channelId + '"]').on('scroll', function() {
    detecetScrollTop($(this));
  });
  if(profile.unRead === 0 || false) {
    $("#unread_" + n + "").hide();
  } else {
    $("#unread_" + n + "").show();
  }
  n++; // declared under document ready
  name_list.push(profile.channelId + profile.userId); //make a name list of all chated user
  userProfiles[profile.userId] = profile;
} // end of pushMsg
function pushInternalMsg(data) {
  let historyMsg = data.Messages;
  let profile = data.Profile;
  let historyMsgStr = "";
  historyMsgStr += internal_historyMsg_to_Str(historyMsg);
  // end of history message
  $('#user-rooms').append('<option value="' + profile.userId + '">' + profile.nickname + '</option>'); //new a option in select bar
  let lastMsg = historyMsg[historyMsg.length - 1];
  let font_weight = "normal";
  let lastMsgStr = '<br><div id="msg" style="font-weight: ' + font_weight + '; font-size:8px; margin-left:12px;">';
  if(lastMsg.message.startsWith('<a')) {
    lastMsgStr += '客戶傳送檔案' + "</div>";
  } else if(lastMsg.message.startsWith('<img')) {
    lastMsgStr += '客戶傳送貼圖' + "</div>";
  } else {
    lastMsgStr += loadMessageInDisplayClient(lastMsg.message) + "</div>";
  }
  let msgTime = '<div style="float:right;font-size:8px; font-weight:normal">' + toTimeStrMinusQuo(lastMsg.time) + '</div>';
  if(profile.unRead > 0) {
    $('#clients').append("<b><button style='text-align:left' class='tablinks'" + "name='" + profile.roomId + "' rel='internal'" + "data-avgTime='" + profile.avgChat + "' " + "data-totalTime='" + profile.totalChat + "' " + "data-chatTimeCount='" + profile.chatTimeCount + "' " + "data-firstTime='" + profile.firstChat + "' " + "data-recentTime='" + lastMsg.time + "' >" + "<div class='img_holder'>" + "<img src='" + profile.photo + "' alt='無法顯示相片'>" + "</div>" + "<div class='msg_holder'>" + "<span class='clientName'>" + profile.roomName + "</span>" + lastMsgStr + "</div>" + "<div class='unreadMsg' style='display:block;'>" + profile.unRead + "</div>" + "</button><hr/></b>"); //new a tablinks
  } else {
    $('#clients').append("<b><button style='text-align:left' class='tablinks'" + "name='" + profile.roomId + "' rel='internal'" + "data-avgTime='" + profile.avgChat + "' " + "data-totalTime='" + profile.totalChat + "' " + "data-chatTimeCount='" + profile.chatTimeCount + "' " + "data-firstTime='" + profile.firstChat + "' " + "data-recentTime='" + lastMsg.time + "' >" + "<div class='img_holder'>" + "<img src='" + profile.photo + "' alt='無法顯示相片'>" + "</div>" + "<div class='msg_holder'>" + "<span class='clientName'>" + profile.roomName + "</span>" + lastMsgStr + "</div>" + "<div class='unreadMsg' style='display:none;'>" + profile.unRead + "</div>" + "</button><hr/></b>"); //new a tablinks
  }
  // 依照不同的channel ID做分類
  canvas.append( //push string into canvas
    '<div id="' + profile.roomId + '" rel="internal" class="tabcontent"style="display: none;">' + '<span class="topright">x&nbsp;&nbsp;&nbsp</span>' + "<div id='" + profile.roomId + "-content' rel='internal' class='messagePanel' data-position='" + 0 + "'>" + historyMsgStr + "</div>" + "</div>"); // close append
  if(profile.unRead === 0 || false) {
    $("#unread_" + n + "").hide();
  } else {
    $("#unread_" + n + "").show();
  }
  n++; // declared under document ready
  name_list.push("internal" + profile.roomId); //make a name list of all chated user
  userProfiles[profile.roomId] = profile;
} // end of pushInternalMsg
function agentName() {
  console.log("userId = " + userId);
  agentId = userId;
  //enter agent name
  database.ref('users/' + userId).once('value', snap => {
    let profInfo = snap.val();
    let profId = Object.keys(profInfo);
    person = profInfo.nickname; //從DB獲取agent的nickname person 在 document ready下面宣告
    if(person) {
      socket.emit('new user', person, (data) => {
        if(!data) {
          alert('username is already taken');
          person = prompt("Please enter your name"); //update new username
          database.ref('users/' + userId).update({
            nickname: person
          });
        }
      });
    } else {
      person = prompt("Please enter your name"); //if username not exist,update username
      database.ref('users/' + userId).update({
        nickname: person
      });
    }
  });
} // end of agentName
function displayMessage(data, channelId) {
  if(name_list.indexOf(channelId + data.id) !== -1) { //if its chated user
    let str;
    let designated_chat_room_msg_time = $("#" + data.id + "-content" + "[rel='" + channelId + "']").find(".message:last").attr('rel');
    if(data.time - designated_chat_room_msg_time >= 900000) { // 如果現在時間多上一筆聊天記錄15分鐘
      $("#" + data.id + "-content" + "[rel='" + channelId + "']").append('<p class="message-day"><strong>-新訊息-</strong></p>');
    }
    if(data.owner === "agent") str = toAgentStr(data.message, data.name, data.time);
    else str = toUserStr(data.message, data.name, data.time);
    $("#" + data.id + "-content" + "[rel='" + channelId + "']").append(str); //push message into right canvas
    $('#' + data.id + '-content' + "[rel='" + channelId + "']").scrollTop($('#' + data.id + '-content' + '[rel="' + channelId + '"]')[0].scrollHeight); //scroll to down
  } else { //if its new user
    let historyMsgStr = NO_HISTORY_MSG;
    if(data.owner === "agent") historyMsgStr += toAgentStr(data.message, data.name, data.time);
    else historyMsgStr += toUserStr(data.message, data.name, data.time);
    canvas.append( //new a canvas
      '<div id="' + data.id + '" rel="' + channelId + '" class="tabcontent">' + '<span class="topright">x&nbsp;</span>' + '<div id="' + data.id + '-content" rel="' + channelId + '" class="messagePanel">' + historyMsgStr + '</div></div>'); // close append
    $('#user-rooms').append('<option value="' + data.id + '">' + data.name + '</option>'); //new a option in select bar
  }
} // end of displayMessage
function displayClient(data, channelId) {
  let font_weight = data.owner === "user" ? "bold" : "normal"; //if msg is by user, mark it unread
  if(name_list.indexOf(channelId + data.id) > -1) {
    let target = $('.tablinks-area').find(".tablinks[name='" + data.id + "'][rel='" + channelId + "']");
    if(data.message.startsWith('<a')) { // 判斷客戶傳送的是檔案，貼圖還是文字
      target.find("#msg").html(toTimeStr(data.time) + '檔案').css("font-weight", font_weight); // 未讀訊息字體變大
    } else if(data.message.startsWith('<img')) {
      target.find("#msg").html(toTimeStr(data.time) + '貼圖').css("font-weight", font_weight); // 未讀訊息字體變大
    } else {
      target.find("#msg").html(toTimeStr(data.time) + "<span class='clientName'>" + loadMessageInDisplayClient(data.message) + "</span>").css("font-weight", font_weight); // 未讀訊息字體變大
    }
    target.attr("data-recentTime", data.time);
    // update tablnks's last msg
    if(data.owner === "agent") {
      target.find('.unreadMsg').text("0").css("display", "none");
    }
    else target.find('.unreadMsg').html(data.unRead).css("display", "block"); // 未讀訊息數顯示出來
    n++;
    let ele = target.parents('b'); //buttons to b
    ele.remove();
    $('.tablinks-area>#clients').prepend(ele);
  } else { // 新客戶個人資料跟清單
    $('#clients').prepend("<b><button name='" + data.id + "' rel='" + channelId + "' class='tablinks'>" + "<div class='img_holder'>" + "<img src='" + data.pictureUrl + "' alt='無法顯示相片'>" + "</div>" + "<div class='msg_holder'>" + "<span class='clientName'>" + data.name + "</span>" + "<br />" + "<div id='msg' style='font-weight: normal; font-size:8px; margin-left:12px;'>" + data.message + "</div>" + "</div>" + "<div class='unreadMsg'>1</div>" + "</button><hr/></b>");
    infoCanvas.append('<div class="card-group" id="' + data.id + '-info" rel="' + channelId + '-info">' + '<div class="card-body" id="profile">' + "<div class='photoContainer'>" + '<img src="' + data.pictureUrl + '" alt="無法顯示相片" style="width:128px;height:128px;">' + "</div>" + "<table class='panelTable'>" + "<tbody>" + "<tr>" + "<th class='userInfo-th' id='姓名'>姓名</th>" + "<td class='userInfoTd' id='姓名' type='text' set='single' modify='true'>" + "<p id='tdInner'>" + data.name + "</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='電子郵件'>電子郵件</th>" + "<td class='userInfoTd' id='電子郵件' type='text' set='multi' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='電話'>電話</th>" + "<td class='userInfoTd' id='電話' type='text' set='single' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='年齡'>年齡</th>" + "<td class='userInfoTd' id='年齡' type='text' set='single' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='性別'>性別</th>" + "<td class='userInfoTd' id='性別' type='singleSelect' set='男,女' modify='true'>" + "<select id='tdInner'>" + "<option> 未選擇 </option>" + "<option value='男'>男</option>" + "<option value='女'>女</option>" + "</select>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='地區'>地區</th>" + "<td class='userInfoTd' id='地區' type='text' set='single' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='住址'>住址</th>" + "<td class='userInfoTd' id='住址' type='text' set='single' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='電話'>電話</th>" + "<td class='userInfoTd' id='電話' type='text' set='single' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='備註'>備註</th>" + "<td class='userInfoTd' id='備註' type='text' set='multi' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='標籤'>標籤</th>" + "<td class='userInfoTd' id='標籤' type='multiSelect' set='奧客,未付費,廢話多,敢花錢,常客,老闆的好朋友,外國人,窮學生,花東團abc123,台南團abc456' modify='true'>" + "<div class='btn-group' id='tdInner'>" + "<button type='button' data-toggle='dropdown' aria-expanded='false'><span class='multiselectSelectedText'>奧客</span><b class='caret'></b></button>" + "<ul class='multiselectContainer dropdown-menu'>" + "<li><input type='checkbox' value='奧客' checked=''>奧客</li>" + "<li><input type='checkbox' value='未付費'>未付費</li>" + "<li><input type='checkbox' value='廢話多'>廢話多</li>" + "<li><input type='checkbox' value='敢花錢'>敢花錢</li>" + "<li><input type='checkbox' value='常客'>常客</li>" + "<li><input type='checkbox' value='老闆的好朋友'>老闆的好朋友</li>" + "<li><input type='checkbox' value='外國人'>外國人</li>" + "<li><input type='checkbox' value='窮學生'>窮學生</li>" + "<li><input type='checkbox' value='花東團abc123'>花東團abc123</li>" + "<li><input type='checkbox' value='台南團abc456'>台南團abc456</li>" + "</ul>" + "</div>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='VIP等級'>VIP等級</th>" + "<td class='userInfoTd' id='VIP等級' type='singleSelect' set='鑽石會員,白金會員,普通銅牌,超級普通會員' modify='true'>" + "<select id='tdInner'>" + "<option> 未選擇 </option>" + "<option value='鑽石會員'>鑽石會員</option>" + "<option value='白金會員'>白金會員</option>" + "<option value='普通銅牌'>普通銅牌</option>" + "<option value='超級普通會員'>超級普通會員</option>" + "</select>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='下次聯絡客戶時間'>下次聯絡客戶時間</th>" + "<td class='userInfoTd' id='下次聯絡客戶時間' type='time' set='' modify='true'>" + "<input type='datetime-local' id='tdInner'>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='首次聊天時間'>首次聊天時間</th>" + "<td class='userInfoTd' id='首次聊天時間' type='time' set='' modify='false'>" + "<input type='datetime-local' id='tdInner' readonly='' value=''>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='上次聊天時間'>上次聊天時間</th>" + "<td class='userInfoTd' id='上次聊天時間' type='time' set='' modify='false'>" + "<input type='datetime-local' id='tdInner' readonly='' value=''>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='總共聊天時間'>總共聊天時間</th>" + "<td class='userInfoTd' id='總共聊天時間' type='text' set='single' modify='false'>" + "<p id='tdInner'></p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='聊天次數'>聊天次數</th>" + "<td class='userInfoTd' id='聊天次數' type='text' set='single' modify='false'>" + "<p id='tdInner'></p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='平均每次聊天時間'>平均每次聊天時間</th>" + "<td class='userInfoTd' id='平均每次聊天時間' type='text' set='single' modify='false'>" + "<p id='tdInner'></p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='客人的抱怨'>客人的抱怨</th>" + "<td class='userInfoTd' id='客人的抱怨' type='text' set='multi' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='付費階段'>付費階段</th>" + "<td class='userInfoTd' id='付費階段' type='singleSelect' set='等待報價,已完成報價，等待付費,已完成付費,要退錢' modify='true'>" + "<select id='tdInner'>" + "<option> 未選擇 </option>" + "<option value='等待報價'>等待報價</option>" + "<option value='已完成報價，等待付費'>已完成報價，等待付費</option>" + "<option value='已完成付費'>已完成付費</option>" + "<option value='要退錢'>要退錢</option>" + "</select>" + "</td>" + "</tr>" + "<tr>" + "<th class='userInfo-th' id='指派負責人'>指派負責人</th>" + "<td class='userInfoTd' id='指派負責人' type='text' set='single' modify='true'>" + "<p id='tdInner'>尚未輸入</p>" + "</td>" + "</tr>" + "</tbody>" + "</table>" + '<div class="profile-confirm">' + '<button type="button" class="btn btn-primary pull-right" id="confirm">Confirm</button>' + '</div>' + '</div>' + '<div class="card-body" id="ticket" style="display:none; "></div>' + '<div class="card-body" id="todo" style="display:none; ">' + '<div class="ticket">' + '<table>' + '<thead>' + '<tr>' + '<th onclick="sortCloseTable(0)"> ID </th>' + '<th onclick="sortCloseTable(1)"> 姓名 </th>' + '<th onclick="sortCloseTable(2)"hidden> 內容 </th>' + '<th onclick="sortCloseTable(3)"> 狀態 </th>' + '<th onclick="sortCloseTable(4)"> 優先 </th>' + '<th onclick="sortCloseTable(5)"> 到期 </th>' + '<th><input type="text" class="ticketSearchBar" id="exampleInputAmount" value="" placeholder="Search"></th>' + '<th><a id="' + data.id + '-modal" data-toggle="modal" data-target="#addTicketModal"><span class="fa fa-plus fa-fw"></span> 新增表單</a></th>' + '</tr>' + '</thead>' + '<tbody class="ticket-content">' + '</tbody>' + '</table>' + '</div>' + '</div>' + '</div>' + '</div>');
  }
} // end of displayClient
function displayMessageInternal(data, roomId) {
  let str;
  let designated_chat_room_msg_time = $("#" + data.roomId + "-content" + "[rel='internal']").find(".message:last").attr('rel');
  if(data.time - designated_chat_room_msg_time >= 900000) { // 如果現在時間多上一筆聊天記錄15分鐘
    $("#" + data.roomId + "-content" + "[rel='internal']").append('<p class="message-day" style="text-align: center"><strong>-新訊息-</strong></p>');
  }
  if(data.agentId == agentId) str = toAgentStr(data.message, data.agentNick, data.time);
  else str = toUserStr(data.message, data.agentNick, data.time);
  $("#" + data.roomId + "-content" + "[rel='internal']").append(str); //push message into right canvas
  $('#' + data.roomId + '-content' + "[rel='internal']").scrollTop($('#' + data.roomId + '-content' + '[rel="internal"]')[0].scrollHeight); //scroll to down
} // end of displayMessageInternal
function displayClientInternal(data, roomId) {
  let font_weight = data.agentId == agentId ? "bold" : "normal"; //if msg is by user, mark it unread
  let target = $('.tablinks-area').find(".tablinks[name='" + data.roomId + "'][rel='internal']");
  if(data.message.startsWith('<a')) { // 判斷客戶傳送的是檔案，貼圖還是文字
    target.find("#msg").html(toTimeStr(data.time) + '檔案').css("font-weight", font_weight); // 未讀訊息字體變大
  } else if(data.message.startsWith('<img')) {
    target.find("#msg").html(toTimeStr(data.time) + '貼圖').css("font-weight", font_weight); // 未讀訊息字體變大
  } else {
    target.find("#msg").html(toTimeStr(data.time) + "<span class='clientName'>" + loadMessageInDisplayClient(data.message) + "</span>").css("font-weight", font_weight); // 未讀訊息字體變大
  }
  target.find('.unreadMsg').html(data.unRead).css("display", "block"); // 未讀訊息數顯示出來
  target.attr("data-recentTime", data.time);
  // update tablnks's last msg
  target.find('.unreadMsg').html(data.unRead).css("display", "none");
  n++;
  let ele = target.parents('b'); //buttons to b
  ele.remove();
  $('.tablinks-area>#clients').prepend(ele);
} // end of displayClientInternal
function clickUserTablink() {
  $('#send-message').show();
  let userId = $(this).attr('name'); // ID
  let channelId = $(this).attr('rel'); // channelId
  loadTable(userId);
  $(".tablinks#selected").removeAttr('id').css("background-color", ""); //selected tablinks change, clean prev's color
  $(this).attr('id', 'selected').css("background-color", COLOR.CLICKED); //clicked tablinks color
  if($(this).find('.unreadMsg').text() !== '0') { //如果未讀的話
    $(this).find('.unreadMsg').text('0').hide(); // 已讀 把未讀的區塊隱藏
    $(this).find("#msg").css("font-weight", "normal"); // 取消未讀粗體
    socket.emit("read message", {
      channelId: channelId,
      userId: userId
    }); //tell socket that this user isnt unRead
  }
  $('#user-rooms').val(userId); //change value in select bar
  $("#" + userId + "-info" + "[rel='" + channelId + "-info']").show().siblings().hide(); //show it, and close others
  $("#" + userId + "[rel='" + channelId + "']").show().siblings().hide(); //show it, and close others
  $("#" + userId + "[rel='" + channelId + "']" + '>#' + userId + '-content' + '[rel="' + channelId + '"]').scrollTop($('#' + userId + '-content' + '[rel="' + channelId + '"]')[0].scrollHeight); //scroll to down
  let profile = userProfiles[userId];
  // console.log("targetId = " + userId);
  if(profile.hasOwnProperty("nickname")) $('#prof_nick').text(profile.nickname); //如果是一般的聊天
  else $('#prof_nick').text(profile.roomName); //如果是內部聊天
} // end of clickUserTablink
function clickSpan() {
  let userId = $(this).parent().hide().attr("id");
  let room = $(this).parent().hide().attr("rel");
  $(".tablinks[name='" + userId + "'][rel='" + room + "']").removeAttr('id').css("background-color", ""); //clean tablinks color
  $('#send-message').hide(); // hide input bar
  $("#" + userId + "-info[rel='" + room + "-info']").hide();
  $('#prof_nick').text('');
} // end of clickSpan
function loadPanelProfile(profile) {
  let html = "<table class='panelTable'>";
  for(let i in TagsData) {
    let name = TagsData[i].name;
    let type = TagsData[i].type;
    let set = TagsData[i].set;
    let modify = TagsData[i].modify;
    let data = profile[name];
    let tdHtml = "";
    if(name === '客戶編號') continue;
    if(name === '電子郵件') {
      for(let i in data) {
        tdHtml += '<p id="tdInner">' + data[i] + '</p>';
      }
    } else if(type === 'text') {
      if(data) {
        tdHtml = '<p id="tdInner">' + data + '</p>';
      } else {
        tdHtml = '<p id="tdInner">尚未輸入</p>';
      }
    } else if(type === "time") {
      if(modify) tdHtml = '<input type="datetime-local" id="tdInner" ';
      else tdHtml = '<input type="datetime-local" id="tdInner" readOnly ';
      if(data) {
        d = new Date(data);
        tdHtml += 'value="' + d.getFullYear() + '-' + addZero(d.getMonth() + 1) + '-' + addZero(d.getDate()) + 'T' + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + '"';
      }
      tdHtml += ' ></input>';
    } else if(type === 'single-select') {
      if(modify) tdHtml = '<select id="tdInner">';
      else tdHtml = '<select id="tdInner" disabled>';
      if(!data) tdHtml += '<option selected="selected" > 未選擇 </option>';
      else tdHtml += '<option> 未選擇 </option>';
      for(let j in set) {
        if(set[j] != data) tdHtml += '<option value="' + set[j] + '">' + set[j] + '</option>';
        else tdHtml += '<option value="' + set[j] + '" selected="selected">' + set[j] + '</option>';
      }
      tdHtml += '</select>';
    } else if(type === 'multi-select') {
      tdHtml = '<div class="btn-group" id="tdInner">';
      if(modify === true) tdHtml += '<button type="button" data-toggle="dropdown" aria-expanded="false">';
      else tdHtml += '<button type="button" data-toggle="dropdown" aria-expanded="false" disabled>';
      if(!data) data = "";
      let selected = data.split(',');
      if(selected.length == set.length) tdHtml += '<span class="multi-selectSelectedText" rel="'+data+'">' + "全選" + '</span>';
      else tdHtml += '<span class="multi-selectSelectedText" rel="'+data+'">' + data + '</span>';
      tdHtml += '<b class="caret"></b></button>' + '<ul class="multiSelectContainer dropdown-menu">';
      for(let j in set) {
        if(selected.indexOf(set[j]) != -1) tdHtml += '<li><input type="checkbox" value="' + set[j] + '" checked>' + set[j] + '</li>';
        else tdHtml += '<li><input type="checkbox" value="' + set[j] + '">' + set[j] + '</li>';
      }
      tdHtml += '</ul></div>';
    }
    html += '<tr>' + '<th class="userInfo-th" id="' + name + '">' + name + '</th>' + '<td class="userInfoTd" id="' + name + '" type="' + type + '" set="' + set + '" modify="' + modify + '">' + tdHtml + '</td>';
  }
  html += "</table>";
  return html;
} // end of loadPanelProfile
function loadInternalPanelProfile(profile) {
  let html = "<table class='panelTable'>";
  for(let i in internalTagsData) {
    let name = internalTagsData[i].name;
    let type = internalTagsData[i].type;
    let set = internalTagsData[i].set;
    let modify = internalTagsData[i].modify;
    let data = profile[name];
    let tdHtml = "";
    if(type === 'text') {
      if(data) {
        tdHtml = '<p id="tdInner">' + data + '</p>';
      } else {
        tdHtml = '<p id="tdInner">尚未輸入</p>';
      }
    } else if(type === "time") {
      if(modify) tdHtml = '<input type="datetime-local" id="tdInner" ';
      else tdHtml = '<input type="datetime-local" id="tdInner" readOnly ';
      if(data) {
        d = new Date(data);
        tdHtml += 'value="' + d.getFullYear() + '-' + addZero(d.getMonth() + 1) + '-' + addZero(d.getDate()) + 'T' + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + '"';
      }
      tdHtml += ' ></input>';
    } else if(type === 'single-select') {
      if(modify) tdHtml = '<select id="tdInner">';
      else tdHtml = '<select id="tdInner" disabled>';
      if(!data) tdHtml += '<option selected="selected" > 未選擇 </option>';
      else tdHtml += '<option> 未選擇 </option>';
      if(name == "owner") {
        for(let id in agentIdToName) {
          if(id != data) tdHtml += '<option value="' + id + '">' + agentIdToName[id] + '</option>';
          else tdHtml += '<option value="' + id + '" selected="selected">' + agentIdToName[id] + '</option>';
        }
      } else {
        for(let j in set) {
          if(set[j] != data) tdHtml += '<option value="' + set[j] + '">' + set[j] + '</option>';
          else tdHtml += '<option value="' + set[j] + '" selected="selected">' + set[j] + '</option>';
        }
      }
      tdHtml += '</select>';
    } else if(type === 'multi-select') {
      // console.log("data == " + data);
      tdHtml = '<div class="btn-group" id="tdInner">';
      if(modify === true) tdHtml += '<button type="button" data-toggle="dropdown" aria-expanded="false">';
      else tdHtml += '<button type="button" data-toggle="dropdown" aria-expanded="false" disabled>';
      if(!data) data = "";
      if(name == "agent") {
        let selected = data.split(',');
        let names = selected.map(function(e) {
          return agentIdToName[e];
        });
        if(names.length == Object.keys(agentIdToName).length) tdHtml += '<span class="multi-selectSelectedText" rel="'+data+'">' + "全選" + '</span>';
        else tdHtml += '<span class="multi-selectSelectedText" rel="'+data+'">' + names.join(',') + '</span>';
        tdHtml += '<b class="caret"></b></button>' + '<ul class="multiSelectContainer dropdown-menu">';
        for(let id in agentIdToName) {
          if(selected.indexOf(id) != -1) tdHtml += '<li><input type="checkbox" value="' + id + '" checked>' + agentIdToName[id] + '</li>';
          else tdHtml += '<li><input type="checkbox" value="' + id + '">' + agentIdToName[id] + '</li>';
        }
      } else {
        let selected = data.split(',');
        if(selected.length == set.length) tdHtml += '<span class="multi-selectSelectedText">' + "全選" + '</span>';
        else tdHtml += '<span class="multi-selectSelectedText">' + data + '</span>';
        tdHtml += '<b class="caret"></b></button>' + '<ul class="multiSelectContainer dropdown-menu">';
        for(let j in set) {
          if(selected.indexOf(set[j]) != -1) tdHtml += '<li><input type="checkbox" value="' + set[j] + '" checked>' + set[j] + '</li>';
          else tdHtml += '<li><input type="checkbox" value="' + set[j] + '">' + set[j] + '</li>';
        }
      }
      tdHtml += '</ul></div>';
    }
    html += '<tr>' + '<th class="userInfo-th" id="' + name + '">' + name + '</th>' + '<td class="userInfoTd" id="' + name + '" type="' + type + '" set="' + set + '" modify="' + modify + '">' + tdHtml + '</td>';
  }
  html += "</table>";
  return html;
} // end of loadInternalPanelProfile
function detecetScrollTop(ele) {
  if(ele.scrollTop() === 0) {
    let tail = parseInt(ele.attr('data-position'));
    let head = parseInt(ele.attr('data-position')) - 20;
    if(head < 0) head = 0;
    let request = {
      userId: ele.parent().attr('id'),
      roomId: ele.parent().attr('rel'),
      head: head,
      tail: tail
    };
    if(head === 0) ele.off('scroll');
    ele.attr('data-position', head);
    socket.emit('upload history msg from front', request);
  }
} // end of detecetScrollTop
function submitMsg(e) {
  e.preventDefault();
  let email = auth.currentUser.email;
  let channelId = $(this).parent().parent().siblings('#canvas').find('[style="display: block;"]').attr('rel');
  let userId = $(this).parent().parent().siblings('#canvas').find('[style="display: block;"]').attr('id');
  if(userId !== undefined || channelId !== undefined) {
    if(channelId == "internal") {
      let sendObj = {
        agentId: auth.currentUser.uid,
        time: Date.now(),
        message: messageInput.val()
      };
      socket.emit('send internal message', {
        sendObj: sendObj,
        roomId: userId
      });
    } else {
      let sendObj = {
        id: userId,
        msg: messageInput.val(),
        msgtime: Date.now(),
        // room: room,
        channelId: channelId
        // room: $(this).parent().parent().parent().siblings('#user').find('.tablinksArea[style="display: block;"]').attr('id'), // 聊天室
        // channelId: $(this).parent().parent().siblings('#canvas').find('[style="display: block;"]').attr('rel')
      };
      // 新增功能：把最後送出訊息的客服人員的編號放在客戶的Profile裡面
      database.ref('chats/Data').once('value', outsnap => {
        let outInfo = outsnap.val();
        let outId = Object.keys(outInfo);
        for(let i in outId) {
          database.ref('chats/Data/' + outId[i] + '/Profile').once('value', innsnap => {
            let innInfo = innsnap.val();
            if(innInfo.channelId === undefined) {} else if(innInfo.channelId === channelId && innInfo.userId === userId) {
              database.ref('chats/Data/' + outId[i] + '/Profile').update({
                "最後聊天的客服人員": email
              });
            }
          });
        }
      });
      socket.emit('send message', sendObj); //emit到server (www)
    }
    messageInput.val('');
  } else {
    console.log('either room id or channel id is undefined');
  }
} // end of submitMsg
function initialFilterSilder() {
  $('.filterSlider').slider({
    orientation: "vertical",
    range: true,
    min: 0,
    step: 1,
    values: [-100, 100]
  }).each(function() {
    let id = $(this).attr('id');
    $(this).slider("option", "max", filterDataBasic[id].length - 1);
    let count = $(this).slider("option", "max") - $(this).slider("option", "min");
    for(let i in filterDataBasic[id]) {
      var el = $('<label>' + filterDataBasic[id][i] + '</label>').css('top', 100 - (i / count * 100) + '%');
      $(this).append(el);
    }
  });
  $('.filterSlider#age').slider("option", "change", function(event, ui) {
    let data = filterDataBasic["age"];
    let values = $(this).slider("values");
    let str = "";
    let min = 0;
    let max = 999;
    if(values[1] - values[0] === data.length - 1) str = "全選";
    else if(values[1] === values[0]) str = "未篩選";
    else {
      str = data[values[0]] + "~" + data[values[1]];
      min = parseInt(data[values[0]]);
      if(data[values[1]].indexOf('up') === -1) max = parseInt(data[values[1]]);
    }
    $(this).parent().parent().find('.multi-selectSelectedText').text(str).attr('min', min).attr('max', max);
  });

  function toTimeStamp(str) {
    if(str.indexOf('up') != -1) return 9999999999999;
    else if(str.indexOf('<') != -1) return -99999;
    let num = parseInt(str);
    let unit = str.substr(str.indexOf(' ') + 1);
    if(unit === 'min') return num * 1000 * 60;
    else if(unit === 'hr') return num * 1000 * 60 * 60;
    else if(unit === 'day') return num * 1000 * 60 * 60 * 24;
    else if(unit === 'week') return num * 1000 * 60 * 60 * 24 * 7;
    else if(unit === 'month') return num * 1000 * 60 * 60 * 24 * 30;
    else if(unit === 'year') return num * 1000 * 60 * 60 * 24 * 365;
  }
  $('.filterSlider#recent').slider("option", "change", function(event, ui) {
    let data = filterDataBasic["recent"];
    let values = $(this).slider("values");
    let str = "";
    let min = -99999;
    let max = 9999999999999;
    if(values[1] - values[0] === data.length - 1) str = "全選";
    else if(values[1] === values[0]) str = "未篩選";
    else {
      str = data[values[0]] + "~" + data[values[1]];
      min = toTimeStamp(data[values[0]]);
      max = toTimeStamp(data[values[1]]);
    }
    $(this).parent().parent().find('.multi-selectSelectedText').text(str).attr('min', min).attr('max', max);
  });
  $('.filterSlider#first').slider("option", "change", function(event, ui) {
    let data = filterDataBasic["first"];
    let values = $(this).slider("values");
    let str = "";
    let min = -99999;
    let max = 9999999999999;
    if(values[1] - values[0] === data.length - 1) str = "全選";
    else if(values[1] === values[0]) str = "未篩選";
    else {
      str = data[values[0]] + "~" + data[values[1]];
      min = toTimeStamp(data[values[0]]);
      max = toTimeStamp(data[values[1]]);
    }
    $(this).parent().parent().find('.multi-selectSelectedText').text(str).attr('min', min).attr('max', max);
  });
} // end of initialFilterSilder
function initialFilterWay() {
  if(!TagsData) return;
  TagsData.map(function(ele) {
    if(ele.type.indexOf('select') != -1) {
      filterDataCustomer[ele.name] = ele.set;
    }
  });
  for(let way in filterDataCustomer) {
    if(way != 'VIP等級') {
      filterDataCustomer[way].map(function(option) {
        $('.filterSelect#' + way).append('<li><input type="checkbox" value="' + option + '" checked>' + option + '</li>');
      });
    }
  }
} // end of initialFilterWay
function upImg() {
  var imgAtt = '/image ' + $('#attImgFill').val();
  let sendObj = {
    id: "",
    msg: imgAtt,
    msgtime: Date.now(),
    room: $(this).parent().parent().parent().parent().siblings('#user').find('#selected').attr('rel'),
    channelId: $(this).parent().parent().parent().siblings('#canvas').find('[style="display: block;"]').attr('rel')
  };
  sendObj.id = $("#user-rooms option:selected").val();
  if(sendObj.room !== undefined && sendObj.room !== '' && sendObj.channelId !== undefined && sendObj.channelId !== '') {
    socket.emit('send message', sendObj); //socket.emit
  } else {
    console.log('room ID or channel ID is undefined, please select a room');
  }
  $('#attImgFill').val('');
} // end of upImg
function upVid() {
  var vidAtt = '/video ' + $('#attVidFill').val();
  let sendObj = {
    id: "",
    msg: vidAtt,
    msgtime: Date.now(),
    room: $(this).parent().parent().parent().parent().siblings('#user').find('#selected').attr('rel'),
    channelId: $(this).parent().parent().parent().siblings('#canvas').find('[style="display: block;"]').attr('rel')
  };
  sendObj.id = $("#user-rooms option:selected").val();
  if(sendObj.room !== undefined && sendObj.room !== '' && sendObj.channelId !== undefined && sendObj.channelId !== '') {
    socket.emit('send message', sendObj); //socket.emit
  } else {
    console.log('room ID or channel ID is undefined, please select a room');
  }
  $('#attVidFill').val('');
} // end of upVid
function upAud() {
  var audAtt = '/audio ' + $('#attAudFill').val();
  let sendObj = {
    id: "",
    msg: audAtt,
    msgtime: Date.now(),
    room: $(this).parent().parent().parent().parent().siblings('#user').find('#selected').attr('rel'),
    channelId: $(this).parent().parent().parent().siblings('#canvas').find('[style="display: block;"]').attr('rel')
  };
  sendObj.id = $("#user-rooms option:selected").val();
  if(sendObj.room !== undefined && sendObj.room !== '' && sendObj.channelId !== undefined && sendObj.channelId !== '') {
    socket.emit('send message', sendObj); //socket.emit
  } else {
    console.log('room ID or channel ID is undefined, please select a room');
  }
  $('#attAudFill').val('');
} // end of upAud
function pushInfo(data) {
  let profile = data.Profile;
  let line1id = $('#Line_1').attr('rel') === undefined ? 'unassigned' : $('#Line_1').attr('rel');
  let line2id = $('#Line_2').attr('rel') === undefined ? 'unassigned' : $('#Line_2').attr('rel');
  for(let i in profile.email) {
    socket.emit('get ticket', {
      email: profile.email[i],
      id: profile.userId
    });
  }
  if(profile.channelId !== 'unassigned' && (profile.channelId === "FB" || profile.channelId === line1id || profile.channelId === line2id)){
    infoCanvas.append('<div class="card-group" id="' + profile.userId + '-info" rel="' + profile.channelId + '-info">' + '<div class="card-body" id="profile">' + "<div class='photoContainer'>" + '<img src="' + profile.photo + '" alt="無法顯示相片" style="width:128px;height:128px;">' + "</div>" + loadPanelProfile(profile) + '<div class="profile-confirm">' + '<button type="button" class="btn btn-primary pull-right" id="confirm">Confirm</button>' + '</div>' + '</div>' + '<div class="card-body" id="ticket" style="display:none; "></div>' + '<div class="card-body" id="todo" style="display:none; ">' + '<div class="ticket">' + '<table>' + '<thead>' + '<tr>' + '<th hidden onclick="sortCloseTable(0)"> ID </th>' + '<th onclick="sortCloseTable(1)"></th>' + '<th onclick="sortCloseTable(3)"></th>' + '<th onclick="sortCloseTable(4)"></th>' + '<th onclick="sortCloseTable(5)"></th>' + '<th><input type="text" class="ticketSearchBar" id="exampleInputAmount" value="" placeholder="搜尋"></th>' + '<th><a style="color:#009900" id="' + profile.userId + '-modal" data-toggle="modal" data-target="#addTicketModal"><span style="color:#009900" class="fa fa-plus fa-fw"></span> 新增表單</a></th>' + '</tr>' + '</thead>' + '<tbody class="ticket-content">' + '</tbody>' + '</table>' + '</div>' + '</div>' + '</div>' + '</div>');
  }
} // end of pushInfo
function pushInternalInfo(profile) {
  infoCanvas.append('<div class="card-group" id="' + profile.roomId + '-info" rel="internal-info">' + '<div class="card-body" id="profile">' + "<div class='photoContainer'>" + '<img src="' + profile.photo + '" alt="無法顯示相片" style="width:128px;height:128px;">' + "</div>" + loadInternalPanelProfile(profile) + '<div class="internal-profile-confirm">' + '<button type="button" class="btn btn-primary pull-right" id="confirm">Confirm</button>' + '</div>' + '</div></div>');
} // end of pushInternalInfo

function testOverview(){
  console.log('testOverview exe');
  var d = new Date().getTime();
  var nowTime = new Date(d).toISOString() // ISO format of the UTC time
  // var modiTime = nowTime.slice(11,13);
  // if (parseInt(modiTime) < 17) nowTime = nowTime.replace(modiTime, String(parseInt(modiTime)+8));//加入台灣的時區
  // else {
  // nowTime = nowTime.replace(modiTime, String(parseInt(modiTime)-16)); //如果超過24小時要算在隔一天，考慮到還有大月小月的問題，還在解決這個部分
  // }
  nowTime = nowTime.slice(0,16);
  console.log(overview);
  var modi_overview;

  //把每一個待發的訊息跑一遍
  for (var i in overview){
    //把overview調成list的狀態
    if (overview[i][5] !== undefined){
      if (Array.isArray(overview[i][5])) modi_overview = overview[i][5];
      else modi_overview = overview[i][5].split(",");
    }
    //篩選要發送的
    if (overview[i][0] == nowTime || overview[i][0] == '馬上發送'){
      console.log(overview[i][2],' matched');
      let sendObj = {
        id: "",
        msg: "",
        msgtime: Date.now(),
        room: ""
      }
      //把所有的name_list跑一遍，找到標籤配合的發送
      overview_list.map(function(data) {
        if (modi_overview == undefined){
          sendObj.id = data.id;
          sendObj.channelId = data.chanId;
          for (var n=2; n<5; n++){
            if (overview[i][n]!== '未設定'){
              sendObj.msg = overview[i][n];
              socket.emit('send message', sendObj);
            }
          }
        }else if (modi_overview.length < 1){
          sendObj.id = data.id;
          sendObj.channelId = data.chanId;
          for (var n=2; n<5; n++){
            if (overview[i][n]!== '未設定'){
              sendObj.msg = overview[i][n];
              socket.emit('send message', sendObj);
            }
          }
        }else if (modi_overview.length > 0){
          var count=0;
          modi_overview.map(function(j){
            if(data.tags.split(',').indexOf(j) > -1) count++;
          });

          //如果有找到就發送
          if(count>0){
            sendObj.id = data.id;
            sendObj.channelId = data.chanId;
            console.log(sendObj.msg,' sent to ',sendObj.id);
            for (var n=2; n<5; n++){
              if (overview[i][n]!== '未設定'){
                sendObj.msg = overview[i][n];
                console.log('準備發送', sendObj.msg);
                socket.emit('send message', sendObj);
              }
            }
          }


        }

      });
      alert('群發訊息「'+overview[i][2]+'」已成功發送');
      var userId = auth.currentUser.uid;
      database.ref('message-overview/' + userId + '/' + overview[i][1]).update({
        taskStatus: '歷史'
      });





    }else {console.log(overview[i][1],' not matched');//沒有要發送的
  }
}
loadOverviewReply();
}

function loadOverviewReply(userId){
  overview = [];//讀取之前先把原先array清空
  database.ref('message-overview/' + userId).once('value', snap => {
    let dataArray = snap.val();
    setTimeout(function(){
      for (var i in dataArray){
        var modiTime = String(dataArray[i].taskTime.slice(11,13));
        if (parseInt(modiTime)-8 < 10) var newTime = '0'+ String(parseInt(modiTime)-8);
        else var newTime = String(parseInt(modiTime)-8);
        if (dataArray[i].taskTime == "馬上發送") var newTaskTime = dataArray[i].taskTime;
        else var newTaskTime = dataArray[i].taskTime.slice(0,11)+newTime+dataArray[i].taskTime.slice(13,);//調整到ISO標準時區

        if (dataArray[i].taskStatus == '保存'){
          overview[i] = [newTaskTime, i, dataArray[i].taskContent1, dataArray[i].taskContent2, dataArray[i].taskContent3, dataArray[i].taskTags];
          console.log(overview);
        }
      }
    }, 1000);
  });
  var chanId1;
  var chanId2;
  database.ref('users'+ userId).on('value', snap =>{
    let profileData = snap.val();
    if (profileData == null) console.log('profileData == null');
    else{chanId1 = profileData.chanId_1; chanId2 = profileData.chanId_2;}
  });
  database.ref('chats/Data').on('value', snap =>{
    let profInfo = snap.val();
    if (profInfo == null){
      console.log('error profInfo == null')
    }else{
      overview_list = [];//讀取之前先把原先array清空
      for (let i in profInfo){
        var room;
        if (profInfo[i].Profile.channelId == chanId1) room = 'Line_1_room';
        else if (profInfo[i].Profile.channelId == chanId2) room = 'Line_2_room';
        else room = profInfo[i].Profile.channelId;
        var tags_list;
        if (profInfo[i].Profile.標籤 == undefined && profInfo[i].Profile.VIP等級 != undefined) tags_list = profInfo[i].Profile.VIP等級;
        else if (profInfo[i].Profile.標籤 != undefined && profInfo[i].Profile.VIP等級 == undefined) tags_list = profInfo[i].Profile.標籤;
        else if (profInfo[i].Profile.標籤 == undefined && profInfo[i].Profile.VIP等級 == undefined) tags_list = '';
        else tags_list = profInfo[i].Profile.標籤+','+profInfo[i].Profile.VIP等級;
        overview_list.push({'id': profInfo[i].Profile.userId, 'chanId':room, 'tags': tags_list});
      }
    }
  });
}
    
function updateStatus() {
  let select = $(".select"),
    editable = $(".edit"),
    input = $("input");
  let name, value, json = '{';
  let obj = {};
  let id = $(this).attr("val");
  let 客戶名, 客戶ID, 回覆人員, 優先, 狀態, 描述, 到期時間;
  input.each(function() {
    $(this).blur();
  });
  for(let i = 0; i < editable.length; i++) {
    name = editable.eq(i).parent().children("th").text().split(" ");
    value = editable.eq(i).text();
    console.log('value ', value);
    json += '"' + name[0] + '":"' + value + '",';
  }
  for(let i = 0; i < select.length; i++) {
    name = select.eq(i).parent().parent().children("th").text();
    value = select.eq(i).val();
    json += '"' + name + '":' + value + ','
  }
  json += '"id":"' + id + '"}';
  obj = JSON.parse(json);
  console.log('obj', obj);
  客戶名 = obj.subject;
  客戶ID = obj.客戶ID;
  回覆人員 = obj.回覆人員;
  優先 = parseInt(obj.優先);
  狀態 = parseInt(obj.狀態);
  描述 = obj.描述;

  if(obj.到期時間過期 !== undefined) 到期時間 = obj.到期時間過期;
  else 到期時間 = obj.到期時間即期;
  var time_list = 到期時間.split("/");
  var new_time = [];
  var new_time2 = [];
  time_list.map(function(i) {
    if(i.length == 1 || i.length > 5 && !i.startsWith(0)) i = '0' + i;
    new_time.push(i);
  });
  new_time = new_time.join("-").split(" ");
  console.log('new_time', new_time);
  if(new_time[1].length < 8) {
    new_time[1].split(":").map(function(x) {
      if(x.length == 1) new_time[1] = new_time[1].replace(x, '0' + x);
    });
  };
  new_time = new_time.join("T") + "Z";
  // .split(":");
  //     new_time.map(function(i){
  //       console.log(i);
  //       if (i.length == 12 && i.endsWith('0')) i = i+'0';
  //       if (i.length==1 || i.length ==2 && i.endsWith('Z')) i = '0'+i;
  //       new_time2.push(i);
  //     })
  //     new_time = new_time2.join(":");
  console.log('客戶名',客戶名);
  console.log('狀態', 狀態);
  //freshdesk api的規則是如果狀態不是open就不能設定到期時間
  if (狀態!=1){console.log('客戶名',客戶名);obj = '{"name": "' + 客戶名 + '", "subject": "' + 客戶ID + '", "status": ' + 狀態 + ', "priority": ' + 優先 + ', "description": "' + 描述 + '"}';}
  else {console.log('客戶名',客戶名);obj = '{"name": "' + 客戶名 + '", "subject": "' + 客戶ID + '", "status": ' + 狀態 + ', "priority": ' + 優先 + ', "description": "' + 描述 + '", "due_by": "' + new_time + '"}';}
  //
  if(confirm("確定變更表單？")) {
    var ticket_id = $(this).parent().siblings().children().find('#ID_num').text();
    $.ajax({
      url: "https://" + yourdomain + ".freshdesk.com/api/v2/tickets/" + ticket_id,
      type: 'PUT',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      headers: {
        "Authorization": "Basic " + btoa(api_key + ":x")
      },
      data: obj,
      success: function(data, textStatus, jqXHR) {
        alert("表單已更新");
        setTimeout(() => {
          location.reload();
        }, 500)
      },
      error: function(jqXHR, tranStatus) {
        alert("表單更新失敗，請重試");
        console.log(jqXHR.responseText)
      }
    });
  }
}
  function submitMemo(e){
    console.log('$(#memoInput).val()', $('#memoInput').val());
    if(confirm('確認新增備註？')){
    e.preventDefault();
    var ticket_id = $('#ID_num').text();//直接抓modal的number
    console.log('ticket_id', ticket_id);
    $('.ticket_memo').append('<td class="memo_content">'+$('#memoInput').val()+'</td>');
    var ticket_memo = '{ "body": "'+$('#memoInput').val()+'", "private" : false }';

    $.ajax(
      {
        // url: "https://"+yourdomain+".freshdesk.com/api/v2/tickets/"+ticket_id[0]+ticket_id[1]+"/notes",
        url: "https://"+yourdomain+".freshdesk.com/api/v2/tickets/"+ticket_id+"/notes",
        type: 'POST',
        contentType: "application/json",
        dataType: "json",
        headers: {
          "Authorization": "Basic " + btoa(api_key + ":x")
        },
        data: ticket_memo,
        success: function(data, textStatus, jqXHR) {
          alert('成功新增備註');

        },
        error: function(jqXHR, tranStatus) {
          x_request_id = jqXHR.getResponseHeader('X-Request-Id');
          response_text = jqXHR.responseText;
          console.log(response_text);
          console.log(x_request_id);
          alert('新增備註失敗');
        }
      }
    );
  }
    $('#memoInput').val("");
    $('#memoModal').hide();
  }
