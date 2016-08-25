var myKey = new DSA();
var socket = io.connect('http://localhost:4200'); //connect to server
var secret = "ghostbusters";
var is_trust = false;
var is_encrypted = false;
var is_exited = false;
var username = "client";

$("#chat").onchange = function() {
    $("#chat").scrollTop = this.scrollHeight;
};

$(function() { //When jQuery is ready

    var options = {
        fragment_size: 140
        , send_interval: 200
        , priv: myKey
    };
    var smp = $("#smp_button");
    smp.hide();
    var exit = $("#exit");
    exit.hide();
    secret = prompt("Enter connection secret: ", "herky4prez");

    if (secret === '')  // default name is 'Guest'
        secret = "herky4prez";

    username = prompt("Enter your username:", "client");

    var buddy = new OTR(options);
    var question = "who are you going to call?";

    buddy.on('io', function (msg, meta) {
        console.log("message to send to buddy: " + msg);
        socket.emit('messages', msg);
    });

    buddy.on('error', function (err, severity) {
        if (severity === 'error')  // either 'error' or 'warn'
            console.error("error occurred: " + err)
    });

    buddy.on('ui', function (msg, encrypted, meta) {
        console.log("Message to display to the user: " + msg);
        if(encrypted){
            console.log("Encrypted: " + meta.message);
        }

        if (msg === "User has exited...Please restart for next chat!") {
            $('#encrypted').append("<p>" + meta.username + ": " + msg + "</p>");
            $('#chat').text('');
            is_encrypted = false;
            is_trust =false;
            is_exited = true;
        } else { // if succesful
            if( is_trust && is_encrypted) {
                $('#chat').append("<p>" + meta.username + ": " + msg + "</p>");
            }
        }
        // encrypted === true, if the received msg was encrypted
    });

    var chatStatusBox =  $('#encrypted');
    socket.emit('changeUsername', username);
    socket.on('init', function(msg) {
        var num = parseInt(msg);
        if (num===2) {
            chatStatusBox.append("<p>" + "Encrypto Chat: We have begun initializing an encrypted TCP connection with the other client."+"</p>");
            buddy.sendMsg("initiating encryption...");
        } else if(num ===1) {
            $('#encrypted').text("Security Bot: Waiting for another client");
        }
    });

    buddy.on('smp', function (type, data, act) {
        switch (type) {
            case 'question':
                buddy.smpSecret(secret,question);
                // call(data) some function with question?
                // return the user supplied data to
                // userA.smpSecret(secret)
                break;
            case 'trust':
                is_trust = data;
                if(is_trust === true) {
                    chatStatusBox.append("<p>" + "Identification verified. No packets were intercepted during connection. This chat is secured!"+"</p>");
                    smp.hide();
                    exit.show();
                    $("#changeSecretBtn").hide();
                }else {
                    chatStatusBox.append("<p>" + "Identification failure. We could not verify the other client's identity. Aborting!"+"</p>");
                }
                // smp completed
                // check data (true|false) and update ui accordingly
                // act ("asked"|"answered") provides info one who initiated the smp
                break;
            case 'abort':
                is_trust = false;
            // smp was aborted. notify the user or update ui
            default:
                chatStatusBox.append("<p>" + "Smp abort!"+"</p>");
                throw new Error('Unknown type.')
        }
    });


    smp.on('click', function(e){
        chatStatusBox.append("<p>" + "Security Bot: We are now confirming the identity of other client."+"</p>");
        buddy.sendMsg("Security Bot: We are now confirming the identity of other client.");
        buddy.smpSecret(secret);
    });

    $('#changeSecretBtn').on('click', function(e){
        secret = prompt("Re-enter connection secret: ", "herky4prez");
        if (secret === '') { // default name is 'Guest'
            secret = "herky4prez";
        }
    });

    exit.on('click', function(e){
        $('#encrypted').text("Exited!");
        buddy.sendMsg("User has exited...Please reload your browser for a new chat session");
        is_encrypted = false;
        is_trust = false;
        is_exited = true;
        $('#chat').text('');
    });

    buddy.on('status', function (state) {
        switch (state) {
            case OTR.CONST.STATUS_AKE_SUCCESS:
                // sucessfully ake'd with buddy
                // check if buddy.msgstate === OTR.CONST.MSGSTATE_ENCRYPTED
                if(buddy.msgstate === OTR.CONST.MSGSTATE_ENCRYPTED){
                    console.log("message is now encrypted");
                    $("#encrypted").text("This chat is now encrypted!");
                    exit.hide();
                    is_encrypted = true;
                    smp.show();
                }
                break;
            case OTR.CONST.STATUS_END_OTR:
                // if buddy.msgstate === OTR.CONST.MSGSTATE_FINISHED
                // inform the user that his correspondent has closed his end
                // of the private connection and the user should do the same
                is_encrypted = false;
                break;
        }
    });

    buddy.REQUIRE_ENCRYPTION = true;

    //on connect...
    socket.on('connect', function(data) {
    });

    //when msgs are received
    socket.on('messages', function(data){
        //populate p element with text
        $('#chat').text(data);
    });

    //on broadcast...server sends message to all connected clients
    socket.on('broad', function(data) {
        buddy.receiveMsg(data.message, data);
    });

    //when client sends msg...
    $('form').submit(function(e){
        //prevents form from submitting
        e.preventDefault();
        //get and send msg
        if (!is_exited) {
            var message = $('#chat_input');
            if (is_encrypted && is_trust) {
                if (message.val()!="") {
                    $('#chat').append("<p>" + "Me: " +  message.val() +  "</p>");
                    buddy.sendMsg(message.val());
                }
            } else if(is_encrypted) {
                $('#encrypted').append("<p>" + "Socialist millionaire protocol not ready yet!" + "</p>");
            } else {
                $('#encrypted').append("<p>" + "Please wait for encryption..." + "</p>");
            }

        } else {
            var okToRefresh = confirm("Please restart for next chat!");
            if (okToRefresh) {
                window.location = window.location.href;
            }
        }
        message.val('');
    });
});