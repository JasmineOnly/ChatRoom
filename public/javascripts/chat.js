$(document).ready(function() {

  /*$(window).keydown(function (e) {
    if (e.keyCode == 116) {
      if (!confirm("Are you sure")) {
        e.preventDefault();
      }
    }
  });*/


  var socket = io.connect();
  var from = $.cookie('user');// read user name from cookie
  var to = 'all';//default receiver : all


  //emit online information to all
  socket.emit('online', {user: from});

  socket.on('online', function (data) {
    
    if (data.user != from) {
      var sys = '<div style="color:#00008B">System(' + now() + '):' + 'User ' + data.user + ' is online！</div>';
    } else {
      var sys = '<div style="color:#00008B">System(' + now() + '):You enter the chat room！</div>';
    }
    $("#contents").append(sys + "<br/>");
    //refresh the online user list
    flushUsers(data.users);
    //show the information of talk
    showSayTo();
  });

  socket.on('msg-list', function (data) {
    console.log(data);
    for (i = 0; i<data.length; i++) {
      console.log(data[i]);
      $("#contents").append('<div>' + data[i].from + ' said to ' + data[i].to + '： <br/>' + data[i].msg + '</div><br />');
    }
    
  });

  socket.on('say', function (data) {
    //say to all
    if (data.to == 'all') {
      $("#contents").append('<div>' + data.from + '(' + now() + ')say to all：<br/>' + data.msg + '</div><br />');
    }

    //say to somebody
    if (data.to == from) {
      $("#contents").append('<div style="color:#00f" >' + data.from + '(' + now() + ')say to you：<br/>' + data.msg + '</div><br />');
    }
  });

  socket.on('offline', function (data) {
    
    var sys = '<div style="color:#00008B">System(' + now() + '):' + 'User ' + data.user + ' is offline！</div>';
    $("#contents").append(sys + "<br/>");
    // refresh online user list
    flushUsers(data.users);
    
    if (data.user == to) {
      to = "all";
    }
    
    showSayTo();
  });

  //shut down server
  socket.on('disconnect', function() {
    var sys = '<div style="color:#00008B">System: fail to connent to server！</div>';
    $("#contents").append(sys + "<br/>");
    $("#list").empty();
  });

  //restart server
  socket.on('reconnect', function() {
    var sys = '<div style="color:#00008B">System:reconnect the server！</div>';
    $("#contents").append(sys + "<br/>");
    socket.emit('online', {user: from});
  });

  //this method is used to refresh the online user list
  function flushUsers(users) {
    // clear the list. set all as gray
    $("#list").empty().append('<li title="double click to talk" alt="all" class="sayingto" onselectstart="return false">all</li>');
    
    for (var i in users) {
      $("#list").append('<li alt="' + users[i] + '" title="double click to talk" onselectstart="return false">' + users[i] + '</li>');
    }
    //talk to somebady
    $("#list > li").dblclick(function() {
      //peopel cannot talk to themselves
      if ($(this).attr('alt') != from) {
        //
        to = $(this).attr('alt');
        //cancel "grey"
        $("#list > li").removeClass('sayingto');
        
        $(this).addClass('sayingto');
        
        showSayTo();
      }
    });
  }

  //this method is used to show the infomation of speak
  function showSayTo() {
    $("#from").html(from);
    $("#to").html(to == "all" ? "all" : to);
  }

  //get the current time
  function now() {
    var date = new Date();
    var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
    return time;
  }

  //say
  $("#send").click(function() {
    //get the messages
    var $msg = $("#input_content").html();
    if ($msg == "") return;
    //add the messages to browser
    if (to == "all") {
      $("#contents").append('<div>You(' + now() + ')say to all：<br/>' + $msg + '</div><br />');
    } else {
      $("#contents").append('<div style="color:#00008B" >You(' + now() + ')are talking to ' + to + '：<br/>' + $msg + '</div><br />');
    }
    //send the messages
    socket.emit('say', {from: from, to: to, msg: $msg});
    
    $("#input_content").html("").focus();
  });
});
