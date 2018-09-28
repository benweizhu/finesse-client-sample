/**
 * Controller JavaScript to manage the functions of the page. The init function
 * is located near the bottom, which will bind actions to all buttons.
 */

var

//Private finesse object.
_finesse,

//Store agent information
_username, _password, _extension, _domain, _login,

//Private reference to JabberWerx eventing object.
_jwClient;

/**
 * Reset the sample page back to a signed out state.
 */
function _reset() {
    //Clear console.
    $("#console-area").val("");

    //Show sign in boxes.
    $("#div-signin").show();

    //Hide all API actions DIV until successful sign in.
    $("#actions").hide();

    //Hide agent info DIV until successful sign in.
    $("#div-signout").hide();

    //Reset agent info data.
    $("#span-agent-info").html("");

    //Clear the dial number field.
    $("#field-call-control-make-dialnum").val("");

    //Clear the callid field.
    $("#field-call-control-callid").val("");
}

function replaceAll(str, stringToReplace, replaceWith) {
	var result = str, index = 1;
	while (index > 0) {
        result = result.replace(stringToReplace, replaceWith);
        index = result.indexOf(stringToReplace);
    }
 	return result;
}

/**
 * Print text to console output.
 */
function print2Console(type, data) {
    var date = new Date(),
    xml = null,
    consoleArea = $("#console-area");

    if (type === "EVENT") {
      xml = data.data._DOM.xml;
      xml = replaceAll(xml, "&lt;", "<");
      xml = replaceAll(xml, "&gt;", ">");
   
      consoleArea.val(consoleArea.val() + "[" + date.getTime() + "] [" +
            type + "] " + xml + "\n\n");
    } else  {
      //Convert data object to string and print to console.
      consoleArea.val(consoleArea.val() + "[" + date.getTime() + "] [" +
              type + "] " + data + "\n\n");
    }

    //Scroll to bottom to see latest.
    consoleArea.scrollTop(consoleArea[0].scrollHeight);
    consoleArea = null;
}

function onClientError(rsp) {
    print2Console("ERROR " + rsp);
}

/**
 * Event handler that prints events to console.
 */
function _eventHandler(data) {
    print2Console("EVENT", data);

	data = data.selected.firstChild.data;
	print2Console("MYEVENT", data);
	// try to get the callid
    var callid = $(data).find("id");
	if (callid.text() !== "") {
        $("#field-call-control-callid").val(callid.text());
	}
    callid = null;
}

/**
 * Connects to the BOSH connection. Any XMPP library or implementation can be
 * used to connect, as long as it conforms to BOSH over XMPP specifications. In
 * this case, we are using Cisco's Ajax XMPP library (aka JabberWerx). In order
 * to make a cross-domain request to the XMPP server, a proxy should be
 * configured to forward requests to the correct server.
 */
function _eventConnect() {
    if (window.jabberwerx) {
        var
        //Construct JID with username and domain.
        jid = _username + "@" + _domain,

        //Create JabbwerWerx object.
        _jwClient = new jabberwerx.Client("cisco");

        //Arguments to feed into the JabberWerx client on creation.
        jwArgs = {
            //Defines the BOSH path. Should match the path pattern in the proxy
            //so that it knows where to forward the BOSH request to.
            httpBindingURL: "/http-bind",
            //Calls this function callback on successful BOSH connection by the
            //JabberWerx library.
			errorCallback: onClientError,
            successCallback: function () {
                //Get the server generated resource ID to be used for subscriptions.
                _finesse.setResource(_jwClient.resourceName);
            }
        };

        
        jabberwerx._config.unsecureAllowed = true;
        //Bind invoker function to any events that is received. Only invoke
        //handler if XMPP message is in the specified structure.
        _jwClient.event("messageReceived").bindWhen(
                "event[xmlns='http://jabber.org/protocol/pubsub#event'] items item notification",
                _eventHandler);
		_jwClient.event("clientStatusChanged").bind(function(evt) {
            if (evt.data.next == jabberwerx.Client.status_connected) {
                // attempt to login the agent
                _finesse.signIn(_username, _extension, true, _signInHandler, _signInHandler);
		   } else if ( evt.data.next == jabberwerx.Client.status_disconnected) {
                _finesse.signOut(_username, _extension, null, _signOutHandler, _signOutHandler);
		   }		
		});

        //Connect to BOSH connection.
        _jwClient.connect(jid, _password, jwArgs);
    } else {
        alert("CAXL library not found. Please download from http://developer.cisco.com/web/xmpp/resources")
    }
}

/**
 * Disconnects from the BOSH connection.
 */
function _eventDisconnect() {
    if(_jwClient) {
        _jwClient.disconnect();
        _jwClient = null;
    }
}

/**
 * Generic handler that prints response to console.
 */
function _handler(data, statusText, xhr) {
    if(xhr) {
        print2Console("RESPONSE", xhr.status);
    } else {
        print2Console("RESPONSE", data);
    }
}

/**
 * GetState handler that prints response to console.
 */
function _getStateHandler(data) {
    print2Console("RESPONSE", data.xml);
}

/**
 * Handler for the make call that will validate the response and automatically
 * store the call id retrieve from the response data.
 */
function _makeCallHandler(data, statusText, xhr) {
    print2Console("Make call RESPONSE", statusText);

    //Validate success.
    if (statusText === "success") {
        $("#field-call-control-callid").val("");
    }
}

/**
 * Sign in handler. If successful, hide sign in forms, display actions, and
 * connect to BOSH channel to receive events.
 */
function _signInHandler(data, statusText, xhr) {
    print2Console("Sign in RESPONSE", xhr.status);

    //Ensure success.
	if (xhr.status === 202) {
        //Hide signin forms and show actions.
        $("#div-signin").hide();
        $("#actions").show();
        $("#div-signout").show();
        $("#span-agent-info").html("Logged in as <b>" + _username + "</b> with extension <b>" + _extension + "</b>");
    }
}

function _signOutHandler(data, statusText, xhr) {
    print2Console("Sign out RESPONSE", xhr.status);

    //Ensure success.
	if (xhr.status === 202) {
        // Disconnect from getting events
        _eventDisconnect();

        // Clean up the values of objects
        _reset();
        _username = null;
        _password = null;
        _extension = null;
        _domain = null;

        // Clean up the Finesse object
        _finesse = null;

        // Reload the page after successful sign out.
		// go to logout.jsp
        window.location.reload();
    }
}

/**
 * Init function. Wait until document is ready before binding actions to buttons
 * on the page.
 */
$(document).ready(function () {
    //Reset UI to sign out state.
    _reset();

    //Binds the button to clear the console output box.
    $("#button-clear-console").click(function () {
        $("#console-area").val("");
    });

    /** Bind all buttons to actions **/

	// SYSINFO button
	$("#form-sysinfo").submit(function() {
	  _finesse.sysInfo(_handler, _handler);
	});

    //SIGNIN button
    $("#form-agent-signin").submit(function () {
        //Grabs the credentials from the input fields.
        _username = $("#field-agentid").val();
        _password = $("#field-password").val();
        _extension = $("#field-extension").val();
        _domain = $("#field-domain").val();

        //Check non-empty fields
        if (!_username || !_password || !_extension || !_domain) {
            alert("Please enter valid domain and credentials.");
        } else {
            login = true;

            //Create Finesse object and sign in user. On successful sign in, a
            //handler will be invoked to present more API options in UI.
			
            _finesse = new Finesse(_username, _password);
			
			_eventConnect();
        }

        return false;
    });

    //SIGNOUT button
    $("#button-signout").click(function () {
        _finesse.signOut(_username, _extension, null, _signOutHandler, _signOutHandler);
    });

    //GET AGENT STATE button
    $("#button-get-agent-state").click(function () {
        _finesse.getState(_username, _getStateHandler, _handler);
    });

    //CHANGE AGENT STATE READY button
    $("#button-change-agent-state-ready").click(function () {
        var newState = "READY"
        if (newState) {
            _finesse.changeState(_username, newState, null, _handler, _handler);
        }
    });
	
	//CHANGE AGENT STATE NOT READY button
    $("#button-change-agent-state-notready").click(function () {
        var newState = "NOT_READY"
        if (newState) {
            _finesse.changeState(_username, newState, null, _handler, _handler);
        }
    });
 
    //MAKE CALL button
    $("#form-call-control-make").submit(function () {
        var dialNum = $("#field-call-control-make-dialnum").val();
        _finesse.makeCall(dialNum, _extension, _makeCallHandler, _handler);
        return false;
    });

    //ANSWER CALL button
    $("#button-call-control-answer").click(function () {
        var callId = $("#field-call-control-callid").val();
        _finesse.answerCall(callId, _extension, _handler, _handler);
    });

    //HOLD CALL button
    $("#button-call-control-hold").click(function () {
        var callId = $("#field-call-control-callid").val();
        _finesse.holdCall(callId, _extension, _handler, _handler);
    });

    //RETRIEVE CALL button
    $("#button-call-control-retrieve").click(function () {
        var callId = $("#field-call-control-callid").val();
        _finesse.retrieveCall(callId, _extension, _handler, _handler);
    });

    //DROP CALL button
    $("#button-call-control-drop").click(function () {
        var callId = $("#field-call-control-callid").val();
        _finesse.dropCall(callId, _extension, _handler, _handler);
    });
});