mootools-soap
=====

Leveraging mootools to consume SOAP WebServices.

Example
-----

    new Soap.Client("http://zend.lojcomm.com.br/geshi/?wsdl", {
        onReady: function(WebService){
            WebService.invoke(
                "highlight",
                {
                    "code":"var s = 'Hello World';",
                    "lang":"javascript",
                    "line_numbers": false
                },
                function(Ret){
                    air.trace(Ret.response["#text"]);
                }
            );
        }
    });

Features
-----

* Consumes SOAP 1.1 WebServices

Version
-----

`0.0.0.1` - Initial working version

Roadmap
-----

* Consume WebServices following SOAP 1.2 specification
* Build a SOAP WebService server based on mootools classes
