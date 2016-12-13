DEFAULT_SOCKET_URL = 'http://www.hyperlocalcontext.com/';


/**
 * dashboard Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver (reelyActive)
 * - socket.io (btford)
 */
angular.module('soundroll', ['btford.socket-io', 'reelyactive.beaver'])


/**
 * Socket Factory
 * Creates the websocket connection to the given URL using socket.io.
 */
.factory('Socket', function(socketFactory) {
  return socketFactory({
    ioSocket: io.connect(DEFAULT_SOCKET_URL)
  });
})


/**
 * DashCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('RollCtrl', function($scope, Socket, beaver) {

  // Variables accessible in the HTML scope
  $scope.devices = beaver.getDevices();
  $scope.stats = beaver.getStats();
  $scope.events = [];
  $scope.loaded = false;

  beaver.listen(Socket);

  var sampler = new Tone.Sampler("./samples/bloop.mp3").toMaster();

  // Load the sound samples
  Tone.Buffer.on('load', function() {
    console.log('Samples loaded');
    $scope.loaded = true;
    sampler.triggerAttack();
  });

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', function(event) {
    if($scope.loaded && isAccepted(event)) {
      sampler.triggerAttack(7);
    }
  });
  beaver.on('displacement', function(event) {
    if($scope.loaded && isAccepted(event)) {
      sampler.triggerAttack(0);
    }
  });
  beaver.on('keep-alive', function(event) {
    //handleEvent(event);
  });
  beaver.on('disappearance', function(event) {
    if($scope.loaded && isAccepted(event)) {
      sampler.triggerAttack(-5);
    }
  });

  function isAccepted(event) {
    if(event.hasOwnProperty('tiraid') &&
       event.tiraid.hasOwnProperty('identifier') &&
       event.tiraid.identifier.hasOwnProperty('advData')) {
      var advData = event.tiraid.identifier.advData;
      if(advData.hasOwnProperty('manufacturerSpecificData') &&
         advData.manufacturerSpecificData.hasOwnProperty('nearable')) {
        return false; // Nearable
      }
      if(advData.hasOwnProperty('manufacturerSpecificData') &&
        advData.manufacturerSpecificData.hasOwnProperty('iBeacon')) {
        return false; // iBeacon
      }
      if(advData.hasOwnProperty('complete128BitUUIDs') &&
         (advData.complete128BitUUIDs ===
          '7265656c794163746976652055554944')) {
        return false; // Reelceiver
      }
    }
    return true;
  }

});
