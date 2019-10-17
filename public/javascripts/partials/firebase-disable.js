const ALERT = {
  SECOND: 10
};

/**
* firebase 資料庫空時會提出警告
*
*
*/
(function firebaseDisable(){
  $('#alert-chatshier .close').on('click', function(){
    $('#alert-chatshier').removeClass('alert-in');
    $('#alert-chatshier').addClass('hidden');
  });

  var snap = null;
  database.ref('tags/Data').once('value', (s) => {
    snap = s;
  });

  setInterval(() => {

    if(null === snap){
      $('#alert-chatshier').removeClass('hidden');

      $('#alert-chatshier').removeClass('alert-out');
      $('#alert-chatshier').addClass('alert-in');

    }else{
      $('#alert-chatshier').addClass('hidden');

    }
  }, ALERT.SECOND * 1000);

})();
