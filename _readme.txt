Cisco Finesse non-Gadget Code Sample

------------------------------------------------------------------------------
1) INTRODUCTION
------------------------------------------------------------------------------
The sample presents a page allowing the ability to sign in/out, query for and 
change agent state, and perform basic call control operations.
The example page implements the logic to connect to a BOSH/XMPP server using
the Cisco Ajax XMPP Library (http://developer.cisco.com/site/im-and-presence/)
to receive events. All responses and events will simply print to the debugger
console. The code has been tested with Firefox 3.2.0 ESR with Firebug 2.0.14
and Internet Explorer 11.

------------------------------------------------------------------------------
2) DISCLAIMER
------------------------------------------------------------------------------

This is only a sample and is NOT intended to be production quality and will not
be supported as such.  It is NOT guaranteed to be bug free. It is merely provided
as a guide for a programmer to see how to use the Cisco Ajax XMPP Library and
jQuery to make Finesse REST API requests and process the Finesse notifications.

------------------------------------------------------------------------------
3) DEPENDENCIES
------------------------------------------------------------------------------
jQuery: The code requires jQuery JavaScript library to be imported. The library
is used to simplify client-side scripting of the DOM and used to make Ajax
requests. The HTML page currently uses jQuery 1.9.1.

CAXL: Cisco Ajax XMPP Library (also known as JabberWerx) is the XMPP library
used to connect to the Notification Service to receive events. The sample page
depends on the library be imported. Developers can have a choice of using this
library or utilizing their own. Download the library from
http://developer.cisco.com/site/im-and-presence/

------------------------------------------------------------------------------
4) FILES
------------------------------------------------------------------------------
- index.html: The HTML UI.

- finessenongadget.js: An example object library which expose interfaces to make
requests to Finesse Web Services API. Uses jQuery to make the Ajax request.

- sample.js: Controller file imported to bind actions to buttons, create
dependent objects, and manage UI functions.

------------------------------------------------------------------------------
5) DEPLOYMENT
------------------------------------------------------------------------------
Developers who wish to use the sample page should be aware of the same-origin
policy. A page loaded in a browser can only make Ajax requests to the server
which is hosting the original web content. Since the sample page is loading
from a webserver outside of the Cisco Finesse server, the page cannot make
direct Ajax request to the Web Service or Notification Service. A common
deployment solution is to set up a HTTP proxy on the developer web server
which can proxy all BOSH connections and HTTP request to the Cisco Finesse
server.

The following is an example of configuring the Apache Web Server as a proxy:
Note that this information is provided 'As IS'  Cisco will not provide assistance
setting up your Apache web server

1. You need to create a reverse proxy URL on your web server to point to the
appropriate Cisco Finesse host and port.
    '/finesse' ==> 'http://host:8082/finesse'
    '/http-bind/' ==> 'http://host:7071/http-bind/'

To do so, add the following entry in the main Apache config file httpd.conf
for forwarding both BOSH and Web Service requests:
    ProxyPass /finesse http://host:8082/finesse
    ProxyPass /http-bind/ http://host:7071/http-bind/ keepalive=On
        disablereuse=Off
    ProxyPassReverse /http-bind http://10.86.139.39:7071/http-bind/
	
2. Also in httpd.conf, enable the following modules.
    LoadModule proxy_module modules/mod_proxy.so
    LoadModule proxy_http_module modules/mod_proxy_http.so
    LoadModule rewrite_module modules/mod_rewrite.so
	
3. Create the proxy info
<Proxy *>
Order Deny,Allow
#Deny from all
Allow from <finesse server>
Allow from <proxy server>
</Proxy>


4. Restart the Apache server for the changes to take effect.

Note: Included with the sample is a sample Apache config file httpd.conf.  It is intended as a 
sample only.  Cisco will not provide support in configuring your proxy server.

------------------------------------------------------------------------------
6) CONTACT US
------------------------------------------------------------------------------
Questions? Visit the Finesse CDN Center and post your questions in the forums.
    http://developer.cisco.com/site/finesse/