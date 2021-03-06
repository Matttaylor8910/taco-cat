(function () {
  angular
    .module('taco.overview', [])
    .controller('OverviewController', OverviewController);

  function OverviewController($scope, $rootScope, $state, $timeout, $ionicHistory, $ionicScrollDelegate, infiniteScroll, firebaseService, settings, localStorage) {
    var $ctrl = this;

    var DEFAULT_LOAD = 10;

    $ctrl.tacoCounter = 0;
    $ctrl.firebase = firebaseService;
    $ctrl.settings = settings;

    $ctrl.clearUser = clearUser;
    $ctrl.loadMore = loadMore;
    $ctrl.canLoadMore = canLoadMore;

    $scope.$on('$ionicView.beforeEnter', beforeEnter);
    $rootScope.$on('firebase.usersUpdated', getUserFromFirebase);

    function beforeEnter() {
      if ($state.params.userId) {
        $ctrl.userId = $state.params.userId;
        $ctrl.you = $ctrl.firebase.user.id === $ctrl.userId;

        if ($ctrl.you) {
          $ctrl.user = localStorage.getObject('overviewUser');
          $ctrl.allActivity = localStorage.getObject('overviewActivity');
          $ctrl.activity = infiniteScroll.loadMore([], $ctrl.allActivity, DEFAULT_LOAD);
          $ctrl.loading = !$ctrl.user;
          
          // only update the counter if there are tacos to update
          if ($ctrl.user && $ctrl.user.tacos) {
            updateTacoCounter();
          }
        }
        else {
          $ctrl.user = undefined;
          $ctrl.activity = undefined;
          $ctrl.loading = true;
        }

        if (firebaseService.users) {
          getUserFromFirebase();
        }

        $ionicScrollDelegate.scrollTop();
      }
      else if (firebaseService.user.id) {
        $ionicHistory.nextViewOptions({
          disableAnimation: true,
          disableBack: true,
          historyRoot: true
        });
        $state.go('app.overview', {userId: firebaseService.user.id});
      }
      else {
        clearUser();
      }
    }

    function getUserFromFirebase() {
      var user = firebaseService.getUser($ctrl.userId);
      if (user) {
        $ctrl.allActivity = _(user.tacoEvents)
          .flatten()
          .sortBy('time')
          .reverse()
          .groupBy('grouping')
          .map(function (events, grouping) {
            return {
              grouping: grouping,
              events: events,
              tacos: _.sumBy(events, 'tacos')
            };
          })
          .value();
        
        // if the tacos for each event (or any of the times) in activity has changed from what is cached, update it
        if (isAnythingDifferent(_.map($ctrl.allActivity, 'tacos'), _.map($ctrl.activity, 'tacos')) || isAnythingDifferent(_.map($ctrl.allActivity, 'time'), _.map($ctrl.activity, 'time'))) {
          var length = $ctrl.activity ? $ctrl.activity.length : DEFAULT_LOAD;
          $ctrl.activity = infiniteScroll.loadMore([], $ctrl.allActivity, length);
        }

        // if anything about the user has changed, update the user
        if (isAnythingDifferent(user, $ctrl.user)) {
          $ctrl.user = user;
        }

        // if we're looking at the user's overview, cache the data
        if ($ctrl.you) {
          localStorage.setObject('overviewUser', $ctrl.user);
          localStorage.setObject('overviewActivity', $ctrl.allActivity);
        }

        $ctrl.error = false;
        updateTacoCounter();
      }
      else {
        $ctrl.error = true;
      }
      $ctrl.loading = false;
    }

    function isAnythingDifferent(obj1, obj2) {
      return JSON.stringify(obj1) !== JSON.stringify(obj2)
    }

    function updateTacoCounter() {
      // don't allow two functions to update the counter at the same time
      if ($ctrl.tacoCounterStarted) {
        return;
      }

      // if the taco counter is at 0 and we're definitely going to increment it,
      // start the counter at 1 so it never incorrectly shows that you have 0 tacos
      if ($ctrl.tacoCounter === 0 && $ctrl.user.tacos > 0) {
        $ctrl.tacoCounter = 1;
      }

      // only add the tacos that aren't accounted for yet in the counter
      $ctrl.tacoCounterStarted = true;
      incrementTacoDelay();
    }

    function clearUser() {
      firebaseService.clearUser();
      $state.go('welcome');
    }

    function incrementTacoDelay(delay) {
      // set a delay that ensures the counter is correct within 1 second, but only
      // if there is no delay passed in (from recursive call)
      var tacosRemaining = $ctrl.user.tacos - $ctrl.tacoCounter;
      var DELAY = delay || (1000 / Math.abs(tacosRemaining));

      // stop if there are no more tacos to update the counter
      if (tacosRemaining === 0) {
        $ctrl.tacoCounterStarted = false;
      }

      // otherwise update the counter and call the function again
      else {
        $timeout(function () {
          if (tacosRemaining > 0) {
            $ctrl.tacoCounter++;
          }
          else {
            $ctrl.tacoCounter--;
          }
          incrementTacoDelay(DELAY);
        }, DELAY);
      }
    }

    function loadMore() {
      if ($ctrl.allActivity) {
        $ctrl.activity = infiniteScroll.loadMore($ctrl.activity, $ctrl.allActivity, DEFAULT_LOAD);
      }
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }

    function canLoadMore() {
      return $ctrl.allActivity && infiniteScroll.canLoadMore($ctrl.activity, $ctrl.allActivity);
    }
  }
})();
