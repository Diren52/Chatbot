$(document).ready(function() {
  $('.sub-tag').hide();
  // $(document).on('mouseover', '#nav_message', subMessage); //Message 導覽標籤 sub-tags
  $(document).on('click', '#nav_message', subMessage); //Message 導覽標籤 sub-tags
});
function subMessage() {
  if ($('.sub-tag').is(':visible')) {
    $('.sub-tag').fadeOut(500, "swing");
  } else {
    $('.sub-tag').fadeIn(500, "swing");
  }
} // end of subMessage
