(function () {
  angular
    .module('taco.sign-up', [])
    .controller('SignUpController', SignUpController);

  function SignUpController($ionicPopup, $timeout, firebaseService, authService) {
    var $ctrl = this;

    // disallow double taps
    $ctrl.created = false;

    $ctrl.model = {
      email: '',
      password: ''
    };

    $ctrl.user = {
      name: '',
      realName: '',
      firebaseUserId: ''
    };

    $ctrl.signUp = signUp;
    $ctrl.isValid = isValid;

    function signUp() {
      // short-circuit in case anything fucky is happening
      if ($ctrl.created) return;
      else $ctrl.created = true;

      // sign up the user with the info provided and catch any errors
      authService.signUp($ctrl.model.email, $ctrl.model.password)
        .then(saveUser)
        .catch(function(error) {
          var errorMessage = '';
          switch(error.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'Email already in use';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Invalid email';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Operation not allowed';
              break;
            case 'auth/weak-password':
              errorMessage = 'Too weak of password';
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network request failed';
              break;
          }

          var myPopup = $ionicPopup.show({
            title: 'Error',
            subTitle: errorMessage
          });

          // close the popup after 1 second
          $timeout(function() {
            $ctrl.created = false;
            myPopup.close();
          }, 1000);
        });
    }

    function isValid() {
      return !$ctrl.created && $ctrl.user.name && $ctrl.user.realName && $ctrl.model.email && $ctrl.model.password;
    }

    function saveUser(user) {
      $ctrl.user.firebaseUserId = user.uid;

      // Random 'id' key on user.
      delete $ctrl.user.id;

      firebaseService.addUser($ctrl.user);
    }
  }
})();
