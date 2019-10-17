$(document).ready(function() {
  $(document).on('click', '#login-btn', login); //登入
  // $(document).on('click', '#google-log', googleLog); //Google登入
  var rString = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if(window.location.pathname === '/login') {
    $('a.login_token').attr('href','https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=1548063773&redirect_uri=https://7e7a81a7.ngrok.io&state='+rString+'&scope=openid%20profile');
    console.log('at login');
  }
});

function login() {
  var email = document.getElementById('login-email').value;
  var password = document.getElementById('login-password').value;
  auth.signInWithEmailAndPassword(email, password).then(response => {}).catch(error => {
    showError(error.message);
    alert(error.message);
  });
};

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function showError(msg) {
  $('#reg-error').hide();
  $('#reg-error').text('');
  $('#reg-error').append(msg);
  $('#reg-error').show();
}
