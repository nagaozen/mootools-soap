var Soap = Soap || {};

Soap.Client = new Class({

    Implements: [Events, Options],

    options: {
        /*
        onReady: $empty,
        */
        version: "SOAP_1_1",
        encoding: "UTF-8",
        user: null,
        pass: null
    },

    initialize:function(wsdl, options) {
        this.wsdl = wsdl;
        this.WSDL = null;
        this.methods = {};
        this.setOptions(options);
        
        var that = this;
        
        var Xhr = new Request({
            url: this.wsdl,
            method: 'GET',
            onSuccess: function(txt, Xml) {
                that.WSDL = Xml.documentElement;
                that.namespace = that.WSDL.attributes["targetNamespace"].value || "";
                
                var Parser, Doc, ns, Nodes, Node;
                Parser = new DOMParser();
                Doc = Parser.parseFromString(txt, "text/xml");
                ns = document.createNSResolver(that.WSDL);
                
                // get WebService address
                Nodes = Doc.evaluate('//soap:address', Doc, ns, 0, null);
                Node = Nodes.iterateNext();
                if(Node) {
                    that.address = Node.attributes["location"].value;
                } else {
                    throw new TypeError("Invalid SOAP definition");
                }
                
                // get WebService operations
                Nodes = Doc.evaluate('//soap:operation', Doc, ns, 0, null);
                Node = Nodes.iterateNext();
                while(Node) {
                    var url = Node.attributes["soapAction"].value;
                    var action = Node.parentNode.attributes["name"].value;
                    that.methods[action] = url;
                    Node = Nodes.iterateNext();
                }
                
                that.fireEvent('ready', that);
            },
            onFailure: function(Transport) {
                throw new URIError("Invalid WSDL url");
            }
        }).send();
    },

    invoke: function(method, args, cbf) {
        var that = this,
            envelope = '<?xml version="1.0" encoding="{encoding}"?>\
<soap:Envelope\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"\
    xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"\
>\
    <soap:Body>\
        <{method} xmlns="{namespace}">\
{args}\
        </{method}>\
    </soap:Body>\
</soap:Envelope>'.substitute({
            "encoding": this.options.encoding,
            "namespace": this.namespace,
            "method": method,
            "args": JSON.toXML(args)
        });
        
        var Xhr = Browser.Request();
        Xhr.open("POST", this.address, true);
        Xhr.setRequestHeader("Content-Type", "text/xml;charset={encoding}".substitute({"encoding": this.options.encoding}));
        Xhr.setRequestHeader("SOAPAction", this.methods[method]);
        Xhr.onreadystatechange = function() {
            if(this.readyState == 4 && this.status == 200) {
                var txt = this.responseText,
                    Xml = this.responseXML;
                
                var Parser, Doc, ns, Nodes, Node;
                Parser = new DOMParser();
                Doc = Parser.parseFromString(txt, "text/xml");
                ns = document.createNSResolver(Xml);
                
                Nodes = Doc.evaluate("//*[local-name()='{method}Response']".substitute({"method": method}), Doc, ns, 0, null);
                Node = Nodes.iterateNext();
                if(Node) {
                    cbf.run(JSON.fromXML(Node.firstChild, ""), that);
                } else {
                    throw new TypeError("Invalid SOAP Response");
                }
                
            } else if(this.readyState == 4 && this.status != 200) {
                throw "Can't process your XMLHTTPRequest.";
            }
        }
        Xhr.send(envelope);
    }

});
