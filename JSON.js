JSON.extend({

    toXML: function(json, container) {
        function __sanitize(value) {
            return value.sanitize(
                ['&',    '<',   '>',    '\'',    '"'],
                ['&amp;','&lt;','&gt;', '&apos;','&quot;']
            );
        };
        
        function __toXML(o, t) {
            var xml = [];
            switch( $type(o) ) {
                case "array":
                    var a = o;
                    if(a.length === 0) {
                        xml.push("<{tag}/>".substitute({"tag":t}));
                    } else {
                        for(var i = 0, len = a.length; i < len; i++) {
                            xml.push(__toXML(a[i], t));
                        }
                    }
                    break;
                
                case "object":
                    xml.push("<{tag}".substitute({"tag":t}));
                    var childs = [];
                    for(var p in o) {
                        if(o.hasOwnProperty(p)) {
                            if(p.charAt(0) === "@") xml.push(" {param}='{content}'".substitute({"param":p.substr(1), "content":__sanitize(o[p].toString())}));
                            else childs.push(p);
                        }
                    }
                    if(childs.length === 0) {
                        xml.push("/>");
                    } else {
                        xml.push(">");
                        for(var i = 0, len = childs.length; i < len; i++) {
                            if(p === "#text") { xml.push(__sanitize(o[childs[i]])); }
                            else if(p === "#cdata") { xml.push("<![CDATA[{code}]]>".substitute({"code": o[childs[i]].toString()})); }
                            else if(p.charAt(0) !== "@") { xml.push(__toXML(o[childs[i]], childs[i])); }
                        }
                        xml.push("</{tag}>".substitute({"tag":t}));
                    }
                    break;
                
                default:
                    var s = o.toString();
                    if(s.length === 0) {
                        xml.push("<{tag}/>".substitute({"tag":t}));
                    } else {
                        xml.push("<{tag}>{value}</{tag}>".substitute({"tag":t, "value":__sanitize(s)}));
                    }
            }
            return xml.join('');
        }
        
        var xml = [];
        if(container) xml.push("<{tag}>".substitute({"tag":container}));
        for(var p in json) {
            if(json.hasOwnProperty(p)) {
                xml.push(__toXML(json[p], p));
            }
        }
        if(container) xml.push("</{tag}>".substitute({"tag":container}));
        return xml.join('');
    },

    fromXML: function(xml) {
        function __removeWhite(tree) {
            tree.normalize();
            for(var n = tree.firstChild; n; ) {
                if(n.nodeType === 3) {
                    if(!n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                        var nxt = n.nextSibling;
                        tree.removeChild(n);
                        n = nxt;
                    } else {
                        n = n.nextSibling;
                    }
                } else if(n.nodeType === 1) {
                    __removeWhite(n);
                    n = n.nextSibling;
                } else {
                    n = n.nextSibling;
                }
            }
            return tree;
        }

        function __toProxy(xml) {
            var o = {};
            if(xml.nodeType === 1) {
                if(xml.attributes.length) {
                    for(var i = 0, len = xml.attributes.length; i < len; i++) {
                        o["@" + xml.attributes[i].nodeName] = xml.attributes[i].nodeValue || "";
                    }
                }
                if(xml.firstChild) {
                    var textChild = 0,
                        cdataChild = 0,
                        hasElementChild = false;
                    
                    for(var n = xml.firstChild; n; n = n.nextSibling) {
                        if(n.nodeType === 1) { hasElementChild = true; }
                        else if(n.nodeType === 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) { textChild += 1; }
                        else if(n.nodeType === 4) {cdataChild += 1; }
                    }
                    
                    if(hasElementChild) {
                        if(textChild < 2 && cdataChild < 2) {
                            __removeWhite(xml);
                            for(var n = xml.firstChild; n; n = n.nextSibling) {
                                if(n.nodeType === 3) { o["#text"] = __escape(n.nodeValue); }
                                else if(n.nodeType === 4) { o["#cdata"] = __escape(n.nodeValue); }
                                else if(o[n.nodeName]) {
                                    if(o[n.nodeName] instanceof Array) o[n.nodeName][o[n.nodeName].length] = __toProxy(n);
                                    else o[n.nodeName] = [o[n.nodeName], __toProxy(n)];
                                }
                                else { o[n.nodeName] = __toProxy(n); }
                            }
                        } else {
                            if(!xml.attributes.length) o = __escape(__innerXml(xml));
                            else o["#text"] = __escape(__innerXml(xml));
                        }
                    } else if(textChild) {
                        if(!xml.attributes.length) { o = __escape(__innerXml(xml)); }
                        else { o["#text"] = __escape(__innerXml(xml)); }
                    } else if(cdataChild) {
                        if(cdataChild > 1) {
                            o = __escape(__innerXml(xml));
                        } else {
                            for(n = xml.firstChild; n; n = n.nextSibling) {
                                o["#cdata"] = __escape(n.nodeValue);
                            }
                        }
                    }
                }
                if(!xml.attributes.length && !xml.firstChild) {
                    o = null;
                }
            } else if(xml.nodeType === 9) {
                o = __toProxy(xml.documentElement);
            } else {
                throw new TypeError("Unhandled node type: {type}".substitute({type: xml.nodeType}));
            }
            return o;
        }

        function __toJson(o, name) {
            var json = [];
            if(name) json.push('"{key}"'.substitute({"key": name}));
            if(o === "[]") {
                json.push(name ? ":[]" : "[]");
            } else if(o instanceof Array) {
                for(var i = 0, len = o.length; i < len; i += 1) {
                    o[i] = __toJson(o[i]);
                }
                json.push((name ? ":[" : "[") + (o.length > 1 ? o.join(",") : o.join("")) + "]");
            } else if(o === null) {
                json.push((name && ":") + "null");
            } else if(typeof(o) === "object") {
                var arr = [], m;
                for(m in o) if(o.hasOwnProperty(m)) {
                    arr[arr.length] = __toJson(o[m], m);
                }
                json.push((name ? ":{" : "{") + (arr.length > 1 ? arr.join(",") : arr.join("")) + "}");
            } else if(typeof(o) === "string") {
                var isNumber  = /(^-?\d+\.?\d*$)/;
                if(isNumber.test(o)) { json.push((name && ":") + o); }
                else { json.push((name && ":") + '"' + o + '"'); }
            } else {
                json.push((name && ":") + o.toString());
            }
            return json.join('');
        }

        function __innerXml(node) {
            if("innerHTML" in node) return node.innerHTML;

            function __mixed(n) {
                var s = [], i;
                if(n.nodeType === 1) {
                    s.push("<{tag}".substitute({"tag": n.nodeName}));
                    for(i = 0; i < n.attributes.length; i += 1) {
                        s.push(' {attrib}="{value}"'.substitute({"attrib": n.attributes[i].nodeName, "value": n.attributes[i].nodeValue || ""}));
                    }
                    if(n.firstChild) {
                        s.push(">");
                        for(var c = n.firstChild; c; c = c.nextSibling) {
                            s.push(__mixed(c));
                        }
                        s.push("</{tag}>".substitute({"tag": n.nodeName}));
                    } else {
                        s.push("/>");
                    }
                } else if(n.nodeType === 3) {
                    s.push(n.nodeValue);
                } else if(n.nodeType === 4) {
                    s.push("<![CDATA[{code}]]>".substitute({"code": n.nodeValue}));
                }
                return s.join('');
            }

            var s = [];
            for(var c = node.firstChild; c; c = c.nextSibling) {
                s.push( __mixed(c) );
            }
            return s.join('');
        }

        function __escape(txt) {
            return txt.replace(/[\\]/g, "\\\\").replace(/[\"]/g, '\\"').replace(/[\n]/g, '\\n').replace(/[\r]/g, '\\r');
        }

        if(xml.nodeType === 9) xml = xml.documentElement;
        var clean = __removeWhite(xml),
            proxy = __toProxy(clean),
            body = __toJson(proxy, xml.nodeName);
        return JSON.parse("{" + body + "}");
    }

});
