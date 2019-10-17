$(document).ready(function() {
  $(document).on('click', '#register-btn', register); //註冊
});

function register() {
  let fname = document.getElementById('first-name').value;
  let lname = document.getElementById('last-name').value;
  let email = document.getElementById('register-email').value;
  let password = document.getElementById('register-password').value;
  let nick = document.getElementById('nick').value;
  let full_name = fname + ' ' + lname;
  // console.log(full_name, email, password);
  if(fname === '') {
    showError('Please type in your first name');
  } else if(lname === '') {
    showError('Please type in your last name');
  } else {
    auth.createUserWithEmailAndPassword(email, password).then(() => {
      database.ref('users/' + auth.currentUser.uid).set({
        name: full_name,
        nickname: nick,
        email: email,
        group1: "line群組1",
        group2: "line群組2",
        fbgroup: "臉書群組"
      });
    }).catch(error => {
      showError(error.message);
    });
  }
};

function showError(msg) {
  $('#reg-error').hide();
  $('#reg-error').text('');
  $('#reg-error').append(msg);
  $('#reg-error').show();
}
