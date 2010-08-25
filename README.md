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
