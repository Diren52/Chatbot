// jQuery
$(document).ready(function() {
  $("#a").hide();//隱藏選單

  $(document).on('click', '#signout-btn', logout); //登出

  // $(document).on('click', '#search-btn', filterChart);

  $("#search-input").click(function(){$("#a").show()});//選單
  $(document).on('click', '#search-input', getH);//總覽
  $(document).on('click', '#get_h', getH);//總覽
  $(document).on('click', '#get_a', getA);//瀏覽人數
  $(document).on('click', '#get_b', getB);//收入分析
  $(document).on('click', '#get_c', getC);//回饋
  $(document).on('click', '#get_d', getD);//通知
  $(document).on('click', '#get_e', getE);//收入比例
  $(document).on('click', '#get_g', getG);//聊天室

  $("#a").click(function(){$(this).hide();});//隱藏選單

});

//Click elsewhere to close 選單
window.addEventListener('mouseup', function(event){
	var box = document.getElementById('a');
	if (event.target != box && event.target.parentNode != box){
        box.style.display = 'none';
    }
});

//搜尋篩選要檢視的chart
function filterChart(){
  let getInputVal = $('#search-input').val().toLowerCase();
  console.log(getInputVal);
  if(getInputVal !== '總覽'){
    $('.panel-default').css("display","none");

    if($('.name').is('#' + getInputVal)){
      $('#' + getInputVal).parent().parent().css("display","block");
    }
  } else {
    $('.panel-default').css("display","block");
  }

};

//自動填入篩選
function getH() {
  $('#search-input').val('總覽');
  filterChart();
};

function getA() {
  $('#search-input').val('瀏覽人數');
  filterChart();
};

function getB() {
  $('#search-input').val('收入分析');
  filterChart();
};

function getC() {
  $('#search-input').val('回饋');
  filterChart();
};

function getD() {
  $('#search-input').val('通知');
  filterChart();
};

function getE() {
  $('#search-input').val('收入比例');
  filterChart();
};

function getG() {
  $('#search-input').val('聊天室');
  filterChart();
};

function logout(){
  auth.signOut()
  .then(response => {
    window.location.assign("/login");
  })
}
