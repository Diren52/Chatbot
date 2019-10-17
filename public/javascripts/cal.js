var current_datetime = new Date();
var event_list;
var userId;
var avoidremindagain;
var socket = io.connect();
var calendar = $('#calendar');
var nowEventId = "invalid";

// jQuery
// $(document).ready(function() {
//   // $('#details').val('');
//
// });



$(document).on('click', '#signout-btn', logout); //登出
$(document).on('click', '#add-cal-btn', set_cal); //新增事件
$(document).on('click', '#save-cal-btn', set_cal); //更新事件
$(document).on('click', '#del-cal-btn', del_cal); //刪除事件

var getAuth = setInterval(function() {
    console.log("loading auth...");
    if (auth.currentUser) {
        clearInterval(getAuth);

        userId = auth.currentUser.uid;
        database.ref('cal-events/' + userId).once('value', snap => {
            event_list = [];
            let data = snap.val();
            console.log(data);
            for (let prop in data) {
                let obj = data[prop];
                obj.keyId = prop;
                event_list.push(obj);
            }
        });
    }
}, 200);

var loadCalTable = setInterval(function() { //loop until loading is done
    console.log("loading calendar...");
    if (!event_list) return; //check event_list
    clearInterval(loadCalTable); //end loop

    //reminder每10秒check一次
    var Reminder = setInterval(reminder, 10000);

    //Initialize fullCalendar.
    calendar.fullCalendar({
        theme: true, //fullcalendar的介面主題，啟用jQuery-UI
        buttonIcons: {
            prev: 'circle-triangle-w',
            next: 'circle-triangle-e'
        },
        //Defines the buttons and title position which is at the top of the calendar.
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },

        defaultDate: current_datetime, //The initial date displayed when the calendar first loads.
        editable: true, //true allow user to edit events.
        eventLimit: true, // allow "more" link when too many events
        selectable: true, //allows a user to highlight multiple days or timeslots by clicking and dragging.
        selectHelper: true, //whether to draw a "placeholder" event while the user is dragging.
        //events is the main option for calendar.
        events: event_list,
        //execute after user select timeslots.
        select: (start, end, jsEvent, view) => { //新增新事件
            nowEventId = "invalid";
            let convert_start = convertTime(start._d);
            let convert_end = convertTime(end._d);

            $('#keyId').text('');
            $('#title').val('');
            $('#startDate').val(convert_start.date); // 日期input設定
            $('#startTime').val(convert_start.time); // 時間input設定
            $('#endDate').val(convert_end.date);
            $('#endTime').val(convert_end.time);
            $('#description').val('');
            $('#allday').prop('checked', false);

            // 隱藏錯誤訊息
            $('#cal-error-msg').hide();
            $('#tim-error-msg').hide();
            // 新增視窗
            $('#myModal').modal('show');
            // 按鈕設定
            $('#add-cal-btn').show();
            $('#save-cal-btn').hide();
            $('#del-cal-btn').hide();

            calendar.fullCalendar('unselect');
        },

        // edit after click.
        eventClick: function(event, jsEvent, view) { //更改事件
            nowEventId = event._id;

            // 資料的值放進對應的input
            $('#keyId').text(event.keyId);
            $('#title').val(event.title);
            let start = convertShow(event.start._i); //轉換成輸出格式
            let end = convertShow(event.end._i);
            $('#startDate').val(start.date);
            $('#startTime').val(start.time);
            $('#endDate').val(end.date);
            $('#endTime').val(end.time);
            $('#description').val(event.description);
            $('#allday').prop('checked', event.allDay);

            // 隱藏錯誤訊息
            $('#cal-error-msg').hide();
            $('#tim-error-msg').hide();
            // 新增視窗
            $('#myModal').modal('show');
            // 按鈕設定
            $('#add-cal-btn').hide();
            $('#save-cal-btn').show();
            $('#del-cal-btn').show();

            calendar.fullCalendar('unselect');
        },

        //execute after user drag and drop an event.
        eventDrop: (event, delta, revertFunc, jsEvent, ui, view) => {
            let time_gap = delta.asMilliseconds();
            let start = Date.parse(event.start._i);
            start = ISODateTimeString(start + time_gap).date+'T'+ISODateTimeString(start + time_gap).time;
            let end = Date.parse(event.end._i);
            end = ISODateTimeString(end + time_gap).date+'T'+ISODateTimeString(end + time_gap).time;

            let keyId = event.keyId;
            let obj = {
                title: event.title,
                start: start,
                end: end,
                description: event.description,
                allDay: event.allDay,
                remind: false
            };
            database.ref('cal-events/' + userId + '/' + keyId).set(obj);
        },

        eventDurationEditable: true
    });

}, 200);

function set_cal() { //確定新增或更改事件
    let keyId = $('#keyId').text();
    let title = $('#title').val();
    let start_date = $('#startDate').val() + "T" + $('#startTime').val(); //把user輸入的日期和時間串起來
    let end_date = $('#endDate').val() + "T" + $('#endTime').val();
    let description = $('#description').val();
    let allDay = $('#allday').prop('checked');

    let flag = true;
    if (!title || !start_date || !end_date) {
        $('#cal-error-msg').show();
        flag = false;
    } else $('#cal-error-msg').hide();

    if (Date.parse(end_date) <= Date.parse(start_date)) {
        $('#tim-error-msg').show();
        flag = false;
    } else $('#tim-error-msg').hide();

    if (!flag) return;

    if (allDay) {
        start_date = ISODateString(start_date);
        end_date = ISOEndDate(end_date);
    }
    let obj = {
        title: title,
        start: start_date,
        end: end_date,
        description: description,
        allDay: allDay,
        remind: false
    };
    if (!keyId) { //新增事件
        let key = database.ref('cal-events/' + userId).push(obj).key;
        obj.keyId = key;
        calendar.fullCalendar('renderEvent', obj, true); // make the event "stick"
    } else { //更改事件
        calendar.fullCalendar('removeEvents', nowEventId);
        calendar.fullCalendar('renderEvent', obj, true); // make the event "stick"
        database.ref('cal-events/' + userId + '/' + keyId).set(obj);
    }

    $('#myModal').modal('hide');
}; //end on click

function del_cal() { //確定刪除事件
    calendar.fullCalendar('removeEvents', nowEventId);
    let keyId = $('#keyId').text();
    database.ref('cal-events/' + userId + '/' + keyId).remove();
    $('#myModal').modal('hide');
}

function del_cal() { //確定刪除事件
    calendar.fullCalendar('removeEvents', nowEventId);
    let keyId = $('#keyId').text();
    database.ref('cal-events/' + userId + '/' + keyId).remove();
    $('#myModal').modal('hide');
}

function reminder() { //事件開始時提醒
    //console.log('Check the reminder...');
    let current_datetime = new Date();
    let nowtime = ISODateTimeString(current_datetime).date + 'T' + ISODateTimeString(current_datetime).time; //convertTime(current_datetime)-8hours
    //console.log('nowtime= ' + nowtime);
    socket.emit('reminder of calendar', { //呼叫www的判斷function
        userId: userId,
        nowtime: nowtime,
        email: auth.currentUser.email
    });
}
socket.on('pop up reminder', (title) => { //接收WWW的訊息 前端pop up提醒視窗
    alert('您的事件 "' + title + '" 已經開始, 系統將對您的登入Email寄出通知信');
});

function ISOEndDate(d) {
  d = new Date(d);
  if( d.getHours()==0 && d.getMinutes()==0 ) {
    return ISODateString( d );
  }
  else {
    return ISODateString( moment(d).add('days', 1) );
  }
}

function ISODateString(d) {
  d = new Date(d);
  function pad(n) {return n<10 ? '0'+n : n}
  return d.getFullYear()+'-'
       + pad(d.getMonth()+1)+'-'
       + pad(d.getDate())+'T'
       + '00:00';
}

function ISODateTimeString(d) { //轉換時間
    d = new Date(d);

    function pad(n) {
        return n < 10 ? '0' + n : n
    }
    let finalDate = new Object(); //分割成日期和時間
    finalDate.date = d.getFullYear() + '-' +
        pad(d.getMonth() + 1) + '-' +
        pad(d.getDate());
    finalDate.time = pad(d.getHours()) + ':' +
        pad(d.getMinutes());
    return finalDate; //finalDate為物件
}

function convertTime(date) {
  let newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
  let finalDate = ISODateTimeString(newDate);
  return finalDate;
}

function convertShow(dateString) { //資料轉換成輸出格式
    let newDate = new Date(Date.parse(dateString));
    finalDate = ISODateTimeString(newDate);
    return finalDate;
}

function show_allday() { //勾選allday時，時間會hide
    if ($('#allday').prop('checked')) {
        $('#startTime').hide();
        $('#endTime').hide();
    } else {
        $('#startTime').show();
        $('#endTime').show();
    }
}

$("#myModal").on("shown.bs.modal", function() { //在show form之後做allday判斷
    show_allday();
});
