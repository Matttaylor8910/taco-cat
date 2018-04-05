(function () {
  angular
    .module('taco.sign-up', [])
    .controller('SignUpController', SignUpController);

  function SignUpController($state, $firebaseAuth, $ionicHistory, $ionicPopup, $timeout, firebaseService, authService) {
    var $ctrl = this;

    $ctrl.model = {
      email: "",
      password: ""
    };

    $ctrl.user = {
      name: '',
      realName: '',
      firebaseUserId: '',
      tacos: undefined
    };

    $ctrl.signUp = signUp;
    $ctrl.goToLogin = goToLogin;

    function signUp() {
      // TODO: we need to do some form validating before we sign up a user.
      authService.signUp($ctrl.model.email, $ctrl.model.password)
        .then(saveUser)
        .catch(function(error) {
          var errorMessage = "";
          switch(error.code) {
            case "auth/email-already-in-use":
              errorMessage = "Email already in use";
              break;
            case "auth/invalid-email":
              errorMessage = "Invalid email";
              break;
            case "auth/operation-not-allowed":
              errorMessage = "Operation not allowed";
              break;
            case "auth/weak-password":
              errorMessage = "Too weak of password";
              break;
            case "auth/network-request-failed":
              errorMessage = "Network request failed";
              break;
          }

          var myPopup = $ionicPopup.show({
            title: 'Error',
            subTitle: errorMessage
          });

          // close the popup after 1 second
          $timeout(function() {
            myPopup.close();
          }, 1000);
        });
    }

    function saveUser(user) {
      $ctrl.user.tacos = parseInt($ctrl.user.tacos || 0);
      $ctrl.user.firebaseUserId = user.uid;
      firebaseService.addUser($ctrl.user);
    }

    function goToLogin() {
      $ionicHistory.nextViewOptions({
        disableBack: true,
        historyRoot: true,
        disableAnimate: true
      });
      $state.go('login');
    }
  }
})();