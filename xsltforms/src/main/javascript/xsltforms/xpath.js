dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

(function() {

    var XPathAxis = {
        ANCESTOR_OR_SELF: 'ancestor-or-self',
        ANCESTOR: 'ancestor',
        ATTRIBUTE: 'attribute',
        CHILD: 'child',
        DESCENDANT_OR_SELF: 'descendant-or-self',
        DESCENDANT: 'descendant',
        FOLLOWING_SIBLING: 'following-sibling',
        FOLLOWING: 'following',
        NAMESPACE: 'namespace',
        PARENT: 'parent',
        PRECEDING_SIBLING: 'preceding-sibling',
        PRECEDING: 'preceding',
        SELF: 'self'
    };
    
    var NodeType = {
	    ELEMENT : 1,
	    ATTRIBUTE : 2,
	    TEXT : 3,
	    CDATA_SECTION : 4,
	    ENTITY_REFERENCE : 5,
	    ENTITY : 6,
	    PROCESSING_INSTRUCTION : 7,
	    COMMENT : 8,
	    DOCUMENT : 9,
	    DOCUMENT_TYPE : 10,
	    DOCUMENT_FRAGMENT : 11,
	    NOTATION : 12
    };

    function createSchemaDependentClasses(factory, xform) {
        var IdManager = xform.getIdManager();
        var schemaManager = xform.getSchemaManager();
        var XMLEvents = xform.getXMLEventManager();
        var I8N = xform.getI8N();
        
        var XNode = dojo.declare(null, {
            "-chains-": {
                constructor: "manual"
	        },
	        
	        constructor: function(type, ns, prefix, name, value, owner) {
	            this.attributes = [];
	            this.childNodes = [];
	            this.init(type, ns, prefix, name, value, owner);
	        },

	        init: function(type, ns, prefix, name, value, owner) {
	            this.nodeType = type;
	            this.nodeName = name;
	            this.prefix = prefix;
	            this.namespaceURI = ns;
	            this.nodeValue = value;
	            this.ownerDocument = owner;
	            this.firstChild = null;
	            this.lastChild = null;
	            this.nextSibling = null;
	            this.previousSibling = null;
	            this.parentNode = null;
	            this.ns = null;

	            this.valid = true;
	            this.required = false;
	            this.relevant = true;
	            this.readonly = false;
	            this.type = schemaManager.getType("xsd_:string");
	            this.schemaType = false;
	            this.bind = null;
	            this.repeat = null;
	            this.init = false;
	            this.changes = null;
	        },

	        getElementsByTagName: function(name) {
	            var targets = this.nodeName == name ? [this] : [];
	            for (var i = 0, len = this.childNodes.length; i < len; ++i) {
	                targets = targets.concat(this.childNodes[i].getElementsByTagName(name));
	            }
	            return targets;
	        },

	        getTextContent: function() {
	            return xform.getValue(this);
	        },

	        appendChild: function(node) {
	            if (this.childNodes.length === 0) {
	                this.firstChild = node;
	            }

	            node.previousSibling = this.lastChild;
	            node.nextSibling = null;

	            if (this.lastChild) {
	                this.lastChild.nextSibling = node;
	            }

	            node.parentNode = this;
	            this.lastChild = node;
	            this.childNodes.push(node);
	        },

	        replaceChild: function(newNode, oldNode) {
	            if (oldNode == newNode) {
	                return;
	            }

	            for (var i = 0, len = this.childNodes.length; i < len; ++i) {
	                if (this.childNodes[i] == oldNode) {
	                    this.childNodes[i] = newNode;
	                    var p = oldNode.parentNode;
	                    oldNode.parentNode = null;
	                    newNode.parentNode = p;
	                    p = oldNode.previousSibling;
	                    oldNode.previousSibling = null;
	                    newNode.previousSibling = p;
	                    
	                    if (newNode.previousSibling) {
	                        newNode.previousSibling.nextSibling = newNode;
	                    }
			
	                    p = oldNode.nextSibling;
	                    oldNode.nextSibling = null;
	                    newNode.nextSibling = p;
	                    
	                    if (newNode.nextSibling) {
	                        newNode.nextSibling.previousSibling = newNode;
	                    }

	                    if (this.firstChild == oldNode) {
	                        this.firstChild = newNode;
	                    }

	                    if (this.lastChild == oldNode) {
	                        this.lastChild = newNode;
	                    }

	                    break;
	                } 
	            }
	        },

	        insertBefore: function(newNode, oldNode) {
	            if (oldNode == newNode || oldNode.parentNode != this) {
	                return;
	            }

	            if (newNode.parentNode) {
	                newNode.parentNode.removeChild(newNode);
	            }

	            var newChildren = [];
	            for (var i = 0; i < this.childNodes.length; ++i) {
	                var c = this.childNodes[i];
	                
	                if (c == oldNode) {
	                    newChildren.push(newNode);
	                    newNode.parentNode = this;
	                    newNode.previousSibling = oldNode.previousSibling;
	                    oldNode.previousSibling = newNode;

	                    if (newNode.previousSibling) {
	                        newNode.previousSibling.nextSibling = newNode;
	                    }
			
	                    newNode.nextSibling = oldNode;

	                    if (this.firstChild == oldNode) {
	                        this.firstChild = newNode;
	                    } 
	                }

	                newChildren.push(c);
	            }
	            this.childNodes = newChildren;
	        },

	        removeChild: function(node) {
	            var newChildren = [];

	            for (var i = 0; i < this.childNodes.length; ++i) {
	                var c = this.childNodes[i];

	                if (c != node) {
	                    newChildren.push(c);
	                } else {
	                    if (c.previousSibling) {
	                        c.previousSibling.nextSibling = c.nextSibling;
	                    }
	                    
	                    if (c.nextSibling) {
	                        c.nextSibling.previousSibling = c.previousSibling;
	                    }

	                    if (this.firstChild == c) {
	                        this.firstChild = c.nextSibling;
	                    }
	                    
	                    if (this.lastChild == c) {
	                        this.lastChild = c.previousSibling;
	                    }
	                }
	            }

	            this.childNodes = newChildren;
	        },

	        setAttributeNS: function(ns, prefix, name, value) {
	            var founded = false;
	            
	            for (var i = 0, len = this.attributes.length;
	                 !founded && i < len;
	                 i++) {
	                var att = this.attributes[i];

	                if (att.nodeName == name && (!ns || att.namespaceURI == ns)) {
	                    att.nodeValue = '' + value;
	                    founded = true;
	                }
	            }

	            if (!founded) {
	                var attf = new XNode(NodeType.ATTRIBUTE, ns, prefix, name,
	                        value, this.ownerDocument);
	                attf.parentNode = this;
	                this.attributes.push(attf);
	            }

	            if (ns == "http://www.w3.org/2001/XMLSchema-instance" && name == "type") {
	                var type = schemaManage.getType(value);

	                if (type) {
	                    this.type = type;
	                    this.schemaType = true;
	                }
	            }
	        },

	        setAttribute: function(name, value) {
	            this.setAttributeNS(null, "", name, value);
	        },

	        getAttributeNS: function(ns, name) {
	            for (var i = 0, len = this.attributes.length; i < len; ++i) {
	                var att = this.attributes[i];
	                
	                if (att.nodeName == name && (!ns || att.namespaceURI == ns)) {
	                    return att.nodeValue;
	                }
	            }
	            
	            return null;
	        },

	        removeAttributeNS: function(ns, name) {
	            var a = [];

	            for (var i = 0, len = this.attributes.length; i < len; i++) {
	                var att = this.attributes[i];
	                
	                if (att.nodeName != name || att.namespaceURI != ns) {
	                    a.push(att);
	                }
	            }

	            this.attributes = a;
	        },

	        cloneNode: function(deep, doc) {
	            var clone = null;
	            doc = doc || this.ownerDocument;
	            
	            if (this.nodeType == NodeType.DOCUMENT) {
	                clone = new XDocument();
	                doc = clone;
	            } else {
	                clone = new XNode(this.nodeType, this.namespaceURI,
	                        this.prefix, this.nodeName, this.nodeValue, doc);
	            }

	            for (var i = 0, len = this.childNodes.length; i < len; i++) {
	                clone.appendChild(this.childNodes[i].cloneNode(true, doc));
	            }
		
	            for (var j = 0, len1 = this.attributes.length ; j < len1; j++) {
	                var att = this.attributes[j];
	                clone.setAttributeNS(att.namespaceURI, att.prefix,
	                        att.nodeName, att.nodeValue);
	            }

	            return clone;
	        }
        });

        XNode.unused_ = [];

        XNode.recycle = function(node) {
            if (node) {
                if (node.constructor == XDocument) {
                    XNode.recycle(node.documentElement);
                    return;
                }

                if (node.constructor != this) {
                    return;
                }
                
                XNode.unused_.push(node);
                
                for (var a = 0; a < node.attributes.length; ++a) {
                    XNode.recycle(node.attributes[a]);
                }

                for (var c = 0; c < node.childNodes.length; ++c) {
                    XNode.recycle(node.childNodes[c]);
                }

                node.attributes.length = 0;
                node.childNodes.length = 0;
                XNode.init.call(node, 0, '', "", '', '', null);
            }
        };

        XNode.create = function(type, ns, prefix, name, value, owner) {
            while (XNode.unused_.length > 0) {
                var node = XNode.unused_.pop();
                if (!node.clear) {
                    XNode.init.call(node, type, ns, prefix, name, value, owner);
                    return node;
                }
            }
            return new XNode(type, ns, prefix, name, value, owner);
        };		

        var XDocument = dojo.declare(null, XNode , {
	    
            constructor: function() {
		        this.inherited(arguments,
		                [NodeType.DOCUMENT, null, "", "#document", null, this]);
		        this.documentElement = null;
	        },

	        clear: function() {
	            XNode.recycle(this.documentElement);
	            this.documentElement = null;
	        },

	        appendChild: function(node) {
	            this.inherited(arguments);
	            this.documentElement = this.childNodes[0];
	        },

	        createElementNS: function(ns, prefix, name) {
	            return XNode.create(NodeType.ELEMENT, ns, prefix,
	                    name, null, this);
	        },

	        createTextNode: function(value) {
	            return XNode.create(NodeType.TEXT, null, "",
	                    '#text', value, this);
	        },

	        createAttributeNS: function(ns, prefix, name) {
	            return XNode.create(NodeType.ATTRIBUTE, ns, prefix,
	                    name, null, this);
	        },

	        getElementsByTagName: function(name) {
	            return this.documentElement.getElementsByTagName(name);
	        },

	        transformToText: function(xslt) {
	            if (Core.isIE) {
	                var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
	                xmlDoc.loadXML(Core.saveXML(this));
	                var xsltDoc = new ActiveXObject("Microsoft.XMLDOM");
	                xsltDoc.loadXML(Core.saveXML(xslt));
	                var resultNode = xmlDoc.transformNode(xsltDoc);
	                return resultNode;
	            } else {
	                var parser = new DOMParser();
	                // var serializer = new XMLSerializer();
	                var xmlDoc =
	                    parser.parseFromString(Core.saveXML(this), "text/xml");
	                var xsltDoc =
	                    parser.parseFromString(Core.saveXML(xslt), "text/xml");
	                var xsltProcessor = new XSLTProcessor();
	                xsltProcessor.importStylesheet(xsltDoc);
	                var resultDocument = xsltProcessor.transformToDocument(xmlDoc);
	                // alert(serializer.serializeToString(resultDocument));
	                if (resultDocument.documentElement.nodeName == "html") {
	                    return resultDocument.documentElement.firstChild.nextSibling.nextSibling.nextSibling.firstChild.nextSibling.textContent;
	                }
	                return resultDocument.documentElement.textContent;
	            }
	        }
        });

        XDocument.unescape = function(xml) {
            if (xml == null) {
                return "";
            }
            var regex_escapepb = /^\s*</;
            if (!xml.match(regex_escapepb)) {
                xml = xml.replace(/&lt;/g, "<");
                xml = xml.replace(/&gt;/g, ">");
                xml = xml.replace(/&amp;/g, "&");
            }
            return xml;
        }
	
        XDocument.parse = function(xml, root) {
	    /*
	      var start1 = new Date().getTime();
	      var end1 = new Date().getTime();
	      var time1 = end1 - start1;
	      var start = new Date().getTime();*/
	    xml = XDocument.unescape(xml);
	    var regex_empty = /\/$/;
	    var regex_tagname = /^([\w:\-\.]*)/;
	    var regex_attribute = /([\w:\-\.]+)\s?=\s?('([^\']*)'|"([^\"]*)")/g;
	    var xmldoc;
	    var nons;
	    if(root) {
		xmldoc = root.ownerDocument;
		nons = !Core.isXhtml;
	    } else {
		xmldoc = new XDocument();
		root = xmldoc;
		nons = false;
	    }
	    var stack = [];
	    var parent = root;
	    stack.push(parent);
	    var x = stringSplit(xml, "<");

	    for (var i = 1, len = x.length; i < len; i++) {
		var xx = stringSplit(x[i], ">");
		if (xx.length == 1) {
		    x[i+1] = x[i] + "<" + x[i+1];
		    continue;
		}
		var tag = xx[0];
		var text = xmlResolveEntities(xx[1] || "");

		if (tag.charAt(0) == "/") {
		    var el = stack.pop();

		    if (tag.substring(1).toLowerCase().indexOf(el.nodeName.toLowerCase()) == -1) {
			throw "XML parser exception: endTag " + tag + " not valid. " + el.nodeName;
		    }
		    
		    parent = stack[stack.length - 1];
		} else if (tag.charAt(0) == "?" || tag.charAt(0) == "!") {
		    // Ignore XML declaration and processing instructions, notation and comments
		} else {
		    var empty = tag.match(regex_empty);
		    var tagname = regex_tagname.exec(tag)[1];
		    var atts = [];
		    var ns = [];
		    if(parent == root) {
			ns["xml"] = "http://www.w3.org/XML/1998/namespace";
			ns.length++;
			ns["xmlns"] = "http://www.w3.org/2000/xmlns/";
			ns.length++;
			ns[""] = "";
			factory.registerNS("", "");
			ns.length++;
		    }
		    var att;

		    while (att = regex_attribute.exec(tag)) {
			var val = xmlResolveEntities(att[3] || att[4] || "");
			var name = att[1];
			
			if (name.indexOf("xmlns") === 0) {
			    var prefix = name.length == 5? "" : name.substring(6);
			    ns[prefix] = val;
			    factory.registerNS(prefix, val);
			    ns.length++;
			}
			atts.push([name, val]);
		    } 

		    var parsed = this.parseName_(parent, ns, tagname, false);
		    var node = nons ? xmldoc.createElement(parsed[2]) : xmldoc.createElementNS(parsed[0], parsed[1], parsed[2]);

		    if (ns.length > 0) {
			node.ns = ns;
		    }
		    
		    for (var j = 0, len1 = atts.length; j < len1; j++) {
			var attParsed = this.parseName_(parent, ns, atts[j][0], true);
			nons || attParsed[0] == "" ? node.setAttribute(attParsed[2], atts[j][1]) : node.setAttributeNS(attParsed[0], attParsed[1], attParsed[2], atts[j][1]);
		    }
		    
		    if (empty) {
			parent.appendChild(node);
		    } else {
			parent.appendChild(node);
			parent = node;
			stack.push(node);
		    }
		}

		if (text && parent != root) {
		    parent.appendChild(xmldoc.createTextNode(text));
		}
	    }
	    /*
	      var end = new Date().getTime();
	      var time = end - start;
	      alert('Execution time1: ' + time1 + '\nExecution time: ' + time);
	    */
	    return root;
	};

	XDocument.parseName_ = function(parent, nsList, name, att) {
	    var index = name.indexOf(":");
	    var prefix;
	    var ns = "";
	    
	    if (name == "xmlns") {
		return ["http://www.w3.org/2000/xmlns/", "xmlns"];
	    }
	    
	    if (index != -1) {
		prefix = name.substring(0, index);
		name = name.substring(index + 1);
	    }

	    if (!att || prefix) {
		ns = nsList[prefix || ""];

		while (!ns && parent) {
		    if (parent.ns) {
			ns = parent.ns[prefix || ""];
		    }

		    parent = parent.parentNode;
		}
	    }

	    if (prefix && !ns) {
		throw "XML parser exception: prefix " + prefix + " not found";
	    }
	    
	    return [ns, prefix, name];
	};

	XDocument.load = function(location) {
	    try {
		var req = Core.openRequest("get", location, false);
		req.send(null);
		try {
		    if (req.status != 200 && req.status != 0) {
			throw "Request error: " + req.status + " for '" + location + "'";
		    }
		    return this.parse(req.responseText);
		} catch(e) {
		    throw e;
		}
	    } catch(e) {
		throw e;
	    }
	};

	var coreFunctions = (function() {
	    var xformInstanceSpecific = {
	        "http://www.w3.org/2002/xforms seconds-to-dateTime" :
	            new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
	                function(number) {
                        if (arguments.length != 1) {
                            throw XPathCoreFunctionsExceptions.secondsToDateTimeInvalidArgumentsNumber;
                        }
                        number = numberValue(number);
                        if( isNaN(number) ) {
                            return "";
                        }
                        d = new Date();
                        d.setTime(Math.floor(number + 0.000001) * 1000);
                        return I8N.format(d, "yyyy-MM-ddThh:mm:ssz", false);
                    }),
                    
	        "http://www.w3.org/2002/xforms now" :
	            new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
	                function() {
                        if (arguments.length != 0) {
                            throw XPathCoreFunctionsExceptions.nowInvalidArgumentsNumber;
                        }
                        return I8N.format(new Date(), "yyyy-MM-ddThh:mm:ssz", false);
                    }),

            "http://www.w3.org/2002/xforms local-date" :
                new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
                    function() {
                        if (arguments.length != 0) {
                            throw XPathCoreFunctionsExceptions.localDateInvalidArgumentsNumber;
                        }
                        return I8N.format(new Date(), "yyyy-MM-ddz", true);
                    }),

            "http://www.w3.org/2002/xforms local-dateTime" :
                new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
                    function() {
                        if (arguments.length != 0) {
                            throw XPathCoreFunctionsExceptions.localDateTimeInvalidArgumentsNumber;
                        }
                        return I8N.format(new Date(), "yyyy-MM-ddThh:mm:ssz", true);
                    }),

            "http://www.w3.org/2002/xforms days-to-date" :
                new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
                    function(number) {
                        if (arguments.length != 1) {
                            throw XPathCoreFunctionsExceptions.daysToDateInvalidArgumentsNumber;
                        }
                        number = numberValue(number);
                        if( isNaN(number) ) {
                            return "";
                        }
                        d = new Date();
                        d.setTime(Math.floor(number + 0.000001) * 86400000);
                        return I8N.format(d, "yyyy-MM-dd", false);
                }),

            "http://www.w3.org/2002/xforms index" :
                new XPathFunction(true, XPathFunction.DEFAULT_NONE, false,
				    function(ctx, id) {
					if (arguments.length != 2) {
					    throw XPathCoreFunctionsExceptions.indexInvalidArgumentsNumber;
					}
					var xf = IdManager.find(stringValue(id)).xfElement;
					ctx.addDepElement(xf);
					return xf.index;
				    } ),
		"http://www.w3.org/2002/xforms nodeindex"
		: new XPathFunction(true, XPathFunction.DEFAULT_NONE, false,
				    function(ctx, id) {
					if (arguments.length != 2) {
					    throw XPathCoreFunctionsExceptions.nodeIndexInvalidArgumentsNumber;
					}
					var control = IdManager.find(stringValue(id));
					var node = control.node;
					ctx.addDepElement(control.xfElement);
					
					if (node) {
					    ctx.addDepNode(node);
					    ctx.addDepElement(document.getElementById(Core.getMeta(node.documentElement ? node.documentElement : node.ownerDocument.documentElement, "model")).xfElement);
					}
					
					return node? [ node ] : [];
				    } ),
		"http://www.w3.org/2002/xforms days-from-date"
		: new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
				    function(string) {
					if (arguments.length != 1) {
					    throw XPathCoreFunctionsExceptions.daysFromDateInvalidArgumentsNumber;
					}
					string = stringValue(string);
					if( !schemaManager.getType("xsd_:date").validate(string) && !schemaManager.getType("xsd_:dateTime").validate(string)) {
					    return "NaN";
					}
					
					p = /^([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])/;
					c = p.exec(string);
					d = new Date(Date.UTC(c[1], c[2]-1, c[3]));
					return Math.floor(d.getTime()/ 86400000 + 0.000001);
				    } ),
		"http://www.w3.org/2002/xforms seconds-from-dateTime"
		: new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
				    function(string) {
					if (arguments.length != 1) {
					    throw XPathCoreFunctionsExceptions.secondsFromDateTimeInvalidArgumentsNumber;
					}
					string = stringValue(string);
					if( !schemaManager.getType("xsd_:dateTime").validate(string)) {
					    return "NaN";
					}
					p = /^([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-])?([01][0-9]|2[0-3])?:?([0-5][0-9])?/;
					c = p.exec(string);
					d = new Date(Date.UTC(c[1], c[2]-1, c[3], c[4], c[5], c[6]));
					if(c[8] && c[8] != "Z") {
					    d.setUTCMinutes(d.getUTCMinutes() + (c[8] == "+" ? 1 : -1)*(c[9]*60 + c[10]));
					}
					return Math.floor(d.getTime() / 1000 + 0.000001) + (c[7]?c[7]:0);
				    } ),
		"http://www.w3.org/2002/xforms event"
		: new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							  function(attribute) {
							      if (arguments.length != 1) {
								  throw XPathCoreFunctionsExceptions.eventInvalidArgumentsNumber;
							      }
							      var context = XMLEvents.getCurrentContext();
							      if (context) {
								  return context[attribute];
							      } else {
								  return null;
							      }
							  } )
	    }
	    return dojo.mixin(xformInstanceSpecific, XPathCoreFunctions);
	})();

	var FunctionCallExpr = function(name) {
	    this.name = name;
	    this.func = coreFunctions[name];
	    this.args = [];
	    
	    if (!this.func) {
		throw {name: "Function " + name + "() not found"};
	    }
	    
	    for (var i = 1, len = arguments.length; i < len; i++) {
		this.args.push(arguments[i]);
	    }
	}
	
	FunctionCallExpr.prototype.evaluate = function(ctx) {
	    var arguments_ = [];
	    
	    for (var i = 0, len = this.args.length; i < len; i++) {
		arguments_[i] = this.args[i].evaluate(ctx);
	    }
	    
	    return this.func.call(ctx, arguments_);
	};
	
	return {
	    XNode: XNode,
	    XDocument: XDocument,
	    FunctionCallExpr: FunctionCallExpr
	};

    }
    
    var Writer = {
	toString : function(node, map, init) {
	    var st = "";
	    
	    if (!map) {
	        map = {length : 0};
	        this.loadNS(node, map);
	    }
	    switch(node.nodeType) {
	    case NodeType.ELEMENT :
	        var name = this.name(node, map);
	        st += "<" + name;
		
	        if (!init) {
	            for (var i in map) {
			if (i != "http://www.w3.org/2000/xmlns/") {
	                    if (i == "length") { continue; }
	                    
	                    var prefix = map[i];
	                    st += " xmlns";

	                    if (prefix) {
				st += ":" + prefix;
	                    }
	                    
	                    st += "=\"" + i + "\"";
			}
	            }

	            init = true;
	        }

	        var atts = node.attributes || [];
		
	        for (var j = 0, len = atts.length; j < len; j++) {
	            st += this.toString(atts[j], map, init);
	        }
		
	        st += ">";
		
	        var childs = node.childNodes;
		
	        for (var k = 0, len1 = childs.length; k < len1; k++) {
	            st += this.toString(childs[k], map, init);
	        }
		
	        st += "</" + name + ">";
		
	        break;
	    case NodeType.ATTRIBUTE :
		if (node.namespaceURI == "http://www.w3.org/2000/xmlns/") {
		    return "";
		}
	        return " " + this.name(node, map) + "=\"" + this.encoding(node.nodeValue) + "\"";
	    case NodeType.TEXT :
	        return this.encoding(node.nodeValue);
	    case NodeType.DOCUMENT :
	        return this.toString(node.documentElement, map, init);
	    }
	    
	    return st;
	},
	loadNS : function(node, map) {
	    var ns = node.namespaceURI;
	    
	    if (ns != null && typeof map[ns] == "undefined" && ns != "http://www.w3.org/XML/1998/namespace") {
	        if (map.length === 0) {
	            map[ns] = null;
	        } else {
	            map[ns] = "pre" + map.length;            
	        }
	        
	        map.length++;
	    }
	    
	    var atts = node.attributes || [];
	    var childs = node.childNodes;
	    
	    for (var i = 0, len = atts.length; i < len; i++) {
	        this.loadNS(atts[i], map);
	    }
	    
	    for (var j = 0, len1 = childs.length; j < len1; j++) {
	        this.loadNS(childs[j], map);
	    }
	},
	name : function(node, map) {
	    var ns = node.namespaceURI;
	    var name = node.nodeName;
	    
	    if (ns) {
		if (ns == "http://www.w3.org/XML/1998/namespace") {
		    name = "xml:" + name;
		} else {
		    var prefix = map[ns];
		    
		    if (prefix) {
		        name = prefix + ":" + name;
		    }
		}
	    }
	    
	    return name;
	},
	encoding : function(value) {
            var res = "";

            for (var i = 0, len = value.length; i < len; i++) {
        	var ch = value.charAt(i);

		if (ch == '>') {
            	    res += "&gt;";
		} else if (ch == '<') {
            	    res += "&lt;";
		} else if (ch == '&') {
		    res += "&amp;";
		} else if (ch == '"') {
		    res += "&quot;";
		} else {
	            var c = value.charCodeAt(i);
	            res +=  c >= 160? "&#" + c + ";" : value.charAt(i);
	        }
            }
            
            return res;
	}
    };
    
    // rely on the browser to write wf XML
    var XMLWriter = {
	toString: function(node) {
            var doc = this.toDOM(node);
            if (typeof XMLSerializer != "undefined") {
		return (new XMLSerializer()).serializeToString(doc);
            } else if (doc.xml) {
		return doc.xml;
            } else { alert("Can't serialize XML"); }
	},
	toDOM: function(node) {
            var ns = node.namespaceURI ? node.namespaceURI : null;
            var prefix = ""; // try to preserve the prefix
            for (var scopedpfx in node.ns) {
		if (node.ns[scopedpfx] == ns) { prefix = scopedpfx; }
            }
            switch(node.nodeType) {
            case NodeType.ELEMENT:
		var e = document.createElementNS(ns, prefix? (prefix + ":" + node.nodeName) : node.nodeName);
		for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                    e.appendChild(this.toDOM(node.childNodes[i]));
		}
		return e;
            case NodeType.ATTRIBUTE:
		var a = document.createAttributeNS(ns, prefix? (prefix + ":" + node.nodeName) : node.nodeName);
		a.nodeValue = node.nodeValue;
		return a;
            case NodeType.TEXT:
		return document.createTextNode(node.nodeValue());
            case NodeType.DOCUMENT:
		return this.toDOM(node.documentElement);
            }
	}
    };

    var ArrayExpr = function(exprs) {
	this.exprs = exprs;
    }

    ArrayExpr.prototype.evaluate = function(ctx) {
	var nodes = [];
	for (var i = 0, len = this.exprs.length; i < len; i++) {
	    nodes[i] = this.exprs[i].evaluate(ctx);
	}
	return nodes;
    };

    var BinaryExpr = function(expr1, op, expr2) {
	this.expr1 = expr1;
	this.expr2 = expr2;
	this.op = op.replace("&gt;", ">").replace("&lt;", "<");
    }

    BinaryExpr.prototype.evaluate = function(ctx) {
	var v1 = this.expr1.evaluate(ctx);
	var v2 = this.expr2.evaluate(ctx);
	var n1;
	var n2;
	if ((((typeof v1) == "object" && v1.length > 1) || ((typeof v2) == "object" && v2.length > 1)) && 
	    (this.op == "=" || this.op == "!=" || this.op == "<" || this.op == "<=" || this.op == ">" || this.op == ">=")) {
	    for (var i = 0, len = v1.length; i < len; i++) {
		n1 = numberValue([v1[i]]);
		if (isNaN(n1)) {
		    n1 = stringValue([v1[i]]);
		}
		for (var j = 0, len1 = v2.length; j < len1; j++) {
		    n2 = numberValue([v2[j]]);
		    if (isNaN(n2)) {
			n2 = stringValue([v2[j]]);
		    }
		    switch (this.op) {
		    case '='   : if (n1 == n2) return true; break;
		    case '!='  : if (n1 != n2) return true; break;
		    case '<'   : if (n1 < n2) return true; break;
		    case '<='  : if (n1 <= n2) return true; break;
		    case '>'   : if (n1 > n2) return true; break;
		    case '>='  : if (n1 >= n2) return true; break;
		    }
		}
	    }
	    return false;
	}
	n1 = numberValue(v1);
	n2 = numberValue(v2);
	
	if (isNaN(n1) || isNaN(n2)) {
            n1 = stringValue(v1);
            n2 = stringValue(v2);
	}
	
	var res = 0;
	switch (this.op) {
        case 'or'  : res = booleanValue(v1) || booleanValue(v2); break;
        case 'and' : res = booleanValue(v1) && booleanValue(v2); break;
        case '+'   : res = n1 + n2; break;
        case '-'   : res = n1 - n2; break;
        case '*'   : res = n1 * n2; break;
        case 'mod' : res = n1 % n2; break;
        case 'div' : res = n1 / n2; break;
        case '='   : res = n1 == n2; break;
        case '!='  : res = n1 != n2; break;
        case '<'   : res = n1 < n2; break;
        case '<='  : res = n1 <= n2; break;
        case '>'   : res = n1 > n2; break;
        case '>='  : res = n1 >= n2; break;
	}
	return typeof res == "number" ? Math.round(res*1000000)/1000000 : res;
    };

    function ExprContext(node, position, nodelist, parent, nsresolver, current,
			       depsNodes, depsId, depsElements) {
	this.node = node;
	this.current = current || node;
	if(position == null) {
	    var repeat = node ? Core.getMeta(node, "repeat") : null;
	    if(repeat) {
		var xrepeat = document.getElementById(repeat).xfElement;
		for(position = 1, len = xrepeat.nodes.length; position <= len; position++) {
		    if(node == xrepeat.nodes[position-1]) {
			break;
		    }
		}
	    }
	}
	this.position = position || 1;
	this.nodelist = nodelist || [ node ];
	this.parent = parent;
	this.root = parent? parent.root : node ? node.ownerDocument : null;
	this.nsresolver = nsresolver;
	this.depsId = depsId;
	this.initDeps(depsNodes, depsElements);
    }

    ExprContext.prototype.clone = function(node, position, nodelist) {
	return new ExprContext(node || this.node, 
			       typeof position == "undefined"? this.position : position,
			       nodelist || this.nodelist, this, this.nsresolver, this.current,
			       this.depsNodes, this.depsId, this.depsElements);
    };

    ExprContext.prototype.setNode = function(node, position) {
	this.node = node;
	this.position = position;
    };

    ExprContext.prototype.initDeps = function(depsNodes, depsElements) {
	this.depsNodes = depsNodes;
	this.depsElements = depsElements;
    };

    ExprContext.prototype.addDepNode = function(node) {
	var deps = this.depsNodes;
	//alert("Binding:"+this.depsId+" "+deps+" addDepNode "+node.nodeName);

	if (deps && !Core.getBoolMeta(node, "depfor_"+this.depsId)) { // !inArray(node, deps)) {
	    Core.setTrueBoolMeta(node, "depfor_"+this.depsId);
	    deps.push(node);
	}
    };

    ExprContext.prototype.addDepElement = function(element) {
	var deps = this.depsElements;

	if (deps && !inArray(element, deps)) {
	    deps.push(element);
	}
    };

    function TokenExpr(m) {
	this.value = m;
    }

    TokenExpr.prototype.evaluate = function() {
	return stringValue(this.value);
    };

    function UnaryMinusExpr(expr) {
	this.expr = expr;
    }

    UnaryMinusExpr.prototype.evaluate = function(ctx) {
	return -numberValue(this.expr.evaluate(ctx));
    };

    function CteExpr(value) {
	this.value = value;
    }

    CteExpr.prototype.evaluate = function() {
	return this.value;
    };

    function FilterExpr(expr, predicate) {
	this.expr = expr;
	this.predicate = predicate;
    }

    FilterExpr.prototype.evaluate = function(ctx) {
	var nodes = nodeSetValue(this.expr.evaluate(ctx));

	for (var i = 0, len = this.predicate.length; i < len; ++i) {
            var nodes0 = nodes;
            nodes = [];

            for (var j = 0, len1 = nodes0.length; j < len1; ++j) {
		var n = nodes0[j];
		var newCtx = ctx.clone(n, j, nodes0);

		if (booleanValue(this.predicate[i].evaluate(newCtx))) {
                    nodes.push(n);
		}
            }
	}

	return nodes;
    };

    function LocationExpr(absolute) {
	this.absolute = absolute;
	this.steps = [];

	for (var i = 1, len = arguments.length; i < len; i++) {
            this.steps.push(arguments[i]);
	}
    }

    LocationExpr.prototype.evaluate = function(ctx) {
	var start = this.absolute? ctx.root : ctx.node;
	ctx.addDepElement(document.getElementById(Core.getMeta((start.documentElement ? start.documentElement : start.ownerDocument.documentElement), "model")).xfElement);

	var nodes = [];
	this.xPathStep(nodes, this.steps, 0, start, ctx);
	return nodes;
    };

    LocationExpr.prototype.xPathStep = function(nodes, steps, step, input, ctx) {
	var s = steps[step];
	var nodelist = s.evaluate(ctx.clone(input));

	for (var i = 0, len = nodelist.length; i < len; ++i) {
            var node = nodelist[i];

            if (step == steps.length - 1) {
		nodes.push(node);
		ctx.addDepNode(node);
            } else {
		this.xPathStep(nodes, steps, step + 1, node, ctx);
            }
	}
    };

    function NodeTestAny() {
    }

    NodeTestAny.prototype.evaluate = function(node) {
	return true;
    };

    function NodeTestName(prefix, name) {
	this.prefix = prefix;
	this.name = name;
    }

    NodeTestName.prototype.evaluate = function(node, nsresolver) {
	var pre = this.prefix;

	if (this.name == "*") {
            return pre && pre != "*" ? node.namespaceURI == nsresolver.lookupNamespaceURI(pre) : true;
	}
	
	var ns = node.namespaceURI;

	return (node.localName || node.baseName) == this.name
	    && (pre && pre != "*" ? ns == nsresolver.lookupNamespaceURI(pre)
		: (pre != "*" ? ns == null || ns == "" || ns == nsresolver.lookupNamespaceURI("") : true));
    };

    function NodeTestPI(target) {
	this.target = target;
    }

    NodeTestPI.prototype.evaluate = function(node) {
	return node.nodeType == NodeType.PROCESSING_INSTRUCTION &&
            (!this.target || node.nodeName == this.target);
    };

    function NodeTestType(type) {
	this.type = type;
    }

    NodeTestType.prototype.evaluate = function(node) {
	return node.nodeType == this.type;
    };

    function PathExpr(filter, rel) {
	this.filter = filter;
	this.rel = rel;
    }

    PathExpr.prototype.evaluate = function(ctx) {
	var nodes = nodeSetValue(this.filter.evaluate(ctx));
	var nodes1 = [];

	for (var i = 0, len = nodes.length; i < len; i++) {
            var newCtx = ctx.clone(nodes[i], i, nodes);
            var nodes0 = nodeSetValue(this.rel.evaluate(newCtx));

            for (var j = 0, len1 = nodes0.length; j < len1; j++) {
		nodes1.push(nodes0[j]);
            }
	}

	return nodes1;
    };

    function PredicateExpr(expr) {
	this.expr = expr;
    }

    PredicateExpr.prototype.evaluate = function(ctx) {
	var v = this.expr.evaluate(ctx);
	return typeof v == "number" ? ctx.position == v : booleanValue(v);
    };

    function StepExpr(axis, nodetest) {
	this.axis = axis;
	this.nodetest = nodetest;
	this.predicates = [];

	for (var i = 2, len = arguments.length; i < len; i++) {
	    this.predicates.push(arguments[i]);
	}
    }

    StepExpr.prototype.evaluate = function(ctx) {
	var input = ctx.node;
	var list = [];

	switch(this.axis) {
	case XPathAxis.ANCESTOR_OR_SELF :
	    _push(ctx, list, input, this.nodetest);
	    // explicit no break here -- fallthrough
	case XPathAxis.ANCESTOR :
	    for (var pn = input.parentNode; pn.parentNode; pn = pn.parentNode) {
		_push(ctx, list, pn, this.nodetest);
	    }
	    break;
	case XPathAxis.ATTRIBUTE :
	    _pushList(ctx, list, input.attributes, this.nodetest);
	    break;
	case XPathAxis.CHILD :
	    _pushList(ctx, list, input.childNodes, this.nodetest);
	    break;
	case XPathAxis.DESCENDANT_OR_SELF :
	    _push(ctx, list, input, this.nodetest);
	    // explicit no break here -- fallthrough
	case XPathAxis.DESCENDANT :
	    _pushDescendants(ctx, list, input, this.nodetest);
	    break;
	case XPathAxis.FOLLOWING :
	    for (var n = input.parentNode; n; n = n.parentNode) {
		for (var nn = n.nextSibling; nn; nn = nn.nextSibling) {
		    _push(ctx, list, nn, this.nodetest);
		    _pushDescendants(ctx, list, nn, this.nodetest);
		}
	    }
	    break;
	case XPathAxis.FOLLOWING_SIBLING :
	    for (var ns = input.nextSibling; ns; ns = ns.nextSibling) {
		_push(ctx, list, ns, this.nodetest);
	    }
	    break;
	case XPathAxis.NAMESPACE : 
	    alert('not implemented: axis namespace');
	    break;
	case XPathAxis.PARENT :
	    if (input.parentNode) {
		_push(ctx, list, input.parentNode, this.nodetest);
	    }
	    break;
	case XPathAxis.PRECEDING :
	    for (var p = input.parentNode; p; p = p.parentNode) {
		for (var pp = p.previousSibling; pp; pp = pp.previousSibling) {
		    _push(ctx, list, pp, this.nodetest);
		    _pushDescendantsRev(ctx, list, pp, this.nodetest);
		}
	    }
	    break;
	case XPathAxis.PRECEDING_SIBLING :
	    for (var ps = input.previousSibling; ps; ps = ps.previousSibling) {
		_push(ctx, list, ps, this.nodetest);
	    }
	    break;
	case XPathAxis.SELF :
	    _push(ctx, list, input, this.nodetest);
	    break;
	default :
	    throw {name:'ERROR -- NO SUCH AXIS: ' + this.axis};
	}   

	for (var i = 0, len = this.predicates.length; i < len; i++) {
	    var pred = this.predicates[i];
	    var newList = [];

	    for (var j = 0, len1 = list.length; j < len1; j++) {
		var x = list[j];
		var newCtx = ctx.clone(x, j + 1, list);

		if (booleanValue(pred.evaluate(newCtx))) {
		    newList.push(x);
		}
	    }
	    
	    list = newList;
	}

	return list;
    };

    function _push(ctx, list, node, test) {
	if (test.evaluate(node, ctx.nsresolver)) {
            list[list.length] = node;
            //list.push(node);
	}
    }

    function _pushList(ctx, list, l, test) {
	for (var i = 0, len = l.length; i < len; i++) {
            _push(ctx, list, l[i], test);
	}
    }

    function _pushDescendants(ctx, list, node, test) {
	for (var n = node.firstChild; n; n = n.nextSibling) {
            _push(ctx, list, n, test);
            arguments.callee(ctx, list, n, test);
	}
    }

    function _pushDescendantsRev(ctx, list, node, test) {
	for (var n = node.lastChildd; n; n = n.previousSibling) {
            _push(ctx, list, n, test);
            arguments.callee(ctx, list, n, test);
	}
    }

    function UnionExpr(expr1, expr2) {
	this.expr1 = expr1;
	this.expr2 = expr2;
    }

    UnionExpr.prototype.evaluate = function(ctx) {
	var nodes1 = nodeSetValue(this.expr1.evaluate(ctx));
	var nodes2 = nodeSetValue(this.expr2.evaluate(ctx));

	var I1 = nodes1.length;

	for (var i2 = 0, len = nodes2.length; i2 < len; ++i2) {
            for (var i1 = 0; i1 < I1; ++i1) {
		if (nodes1[i1] == nodes2[i2]) {
                    i1 = I1;
		}
            }
	    
            nodes1.push(nodes2[i2]);
	}
	
	return nodes1;
    };


    
    function XPathFunction(acceptContext, defaultTo, returnNodes, body) {
	this.evaluate = body;
	this.defaultTo = defaultTo;
	this.acceptContext = acceptContext;
	this.returnNodes = returnNodes;
    }

    XPathFunction.DEFAULT_NONE = null;
    XPathFunction.DEFAULT_NODE = 0;
    XPathFunction.DEFAULT_NODESET = 1;
    XPathFunction.DEFAULT_STRING = 2;

    XPathFunction.prototype.call = function(context, arguments_) {
	if (arguments_.length === 0) {
	    switch (this.defaultTo) {
	    case XPathFunction.DEFAULT_NODE:
		if (context.node != null) {
		    arguments_ = [context.node];
		}

		break;
	    case XPathFunction.DEFAULT_NODESET:
		if (context.node != null) {
		    arguments_ = [[context.node]];
		}

		break;
	    case XPathFunction.DEFAULT_STRING:
		arguments_ = [XPathCoreFunctions.string.evaluate([context.node])];
		break;
	    }
	}
	
	if (this.acceptContext) {
	    arguments_.unshift(context);
	}

	return this.evaluate.apply(null, arguments_);
    };
    
    var MathConstants = {
	"PI": "3.1415926535897932384626433832795028841971693993751",
	"E": "2.71828182845904523536028747135266249775724709369996",
	"SQRT2": "1.41421356237309504880168872420969807856967187537694",
	"LN2": "0.69314718055994530941723212145817656807550013436025",
	"LN10": "2.30258509299404568401799145468436420760110148862877",
	"LOG2E": "1.442695040888963387",
	"SQRT1_2": "0.7071067811865476"
    };				
    
    var XPathCoreFunctions = {

	

	"http://www.w3.org/2005/xpath-functions last" : new XPathFunction(true, XPathFunction.DEFAULT_NONE, false,
									  function(ctx) {
									      if (arguments.length != 1) {
										  throw XPathCoreFunctionsExceptions.lastInvalidArgumentsNumber;
									      }
									      return ctx.nodelist.length;
									  } ),

	

	"http://www.w3.org/2005/xpath-functions position" : new XPathFunction(true, XPathFunction.DEFAULT_NONE, false,
									      function(ctx) {
										  if (arguments.length != 1) {
										      throw XPathCoreFunctionsExceptions.positionInvalidArgumentsNumber;
										  }
										  return ctx.position;
									      } ),

	

	"http://www.w3.org/2002/xforms context" : new XPathFunction(true, XPathFunction.DEFAULT_NONE, false,
								    function(ctx) {
									if (arguments.length != 1) {
									    throw XPathCoreFunctionsExceptions.positionInvalidArgumentsNumber;
									}
									return [ctx.node];
								    } ),

	

	"http://www.w3.org/2005/xpath-functions count" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									   function(nodeSet) { 
									       if (arguments.length != 1) {
										   throw XPathCoreFunctionsExceptions.countInvalidArgumentsNumber;
									       }
									       if (typeof nodeSet != "object") {
										   throw XPathCoreFunctionsExceptions.countInvalidArgumentType;
									       }
									       return nodeSet.length;
									   } ),

	

	"http://www.w3.org/2005/xpath-functions id" : new XPathFunction(true, XPathFunction.DEFAULT_NODE, false,
									function(context, object) {
									    if (arguments.length != 2) {
										throw XPathCoreFunctionsExceptions.idInvalidArgumentsNumber;
									    }
									    if (typeof object != "object" && typeof object != "string") {
										throw XPathCoreFunctionsExceptions.idInvalidArgumentType;
									    }
									    var result = [];

									    if (typeof(object.length) != "undefined") {
										for (var i = 0, len = object.length; i < len; ++i) {
										    var res = XPathCoreFunctions['http://www.w3.org/2005/xpath-functions id'].evaluate(context, object[i]);

										    for (var j = 0, len1 = res.length; j < len1; j++) {
											result.push(res[j]);
										    }
										}
									    } else if (context.node != null) {
										var ids = stringValue(object).split(/\s+/);
										
										for (var j in ids) {
										    result.add(context.node.ownerDocument.getElementById(ids[j]));
										}
									    }
									    
									    return result;
									} ),

	

	"http://www.w3.org/2005/xpath-functions local-name" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
										function(nodeSet) {
										    if (arguments.length > 1) {
											throw XPathCoreFunctionsExceptions.localNameInvalidArgumentsNumber;
										    }
										    if (arguments.length == 1 && typeof nodeSet != "object") {
											throw XPathCoreFunctionsExceptions.localNameInvalidArgumentType;
										    }
										    if (arguments.length == 0) {
											throw XPathCoreFunctionsExceptions.localNameNoContext;
										    }
										    return nodeSet.length === 0? "" : nodeSet[0].nodeName.replace(/^.*:/, "");
										} ),

	

	"http://www.w3.org/2005/xpath-functions namespace-uri" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
										   function(nodeSet) {
										       if (arguments.length > 1) {
											   throw XPathCoreFunctionsExceptions.namespaceUriInvalidArgumentsNumber;
										       }
										       if (arguments.length == 1 && typeof nodeSet != "object") {
											   throw XPathCoreFunctionsExceptions.namespaceUriInvalidArgumentType;
										       }
										       return nodeSet.length === 0? "" : nodeSet[0].namespaceURI;
										   } ),

	

	"http://www.w3.org/2005/xpath-functions name" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
									  function(nodeSet) {
									      if (arguments.length > 1) {
										  throw XPathCoreFunctionsExceptions.nameInvalidArgumentsNumber;
									      }
									      if (arguments.length == 1 && typeof nodeSet != "object") {
										  throw XPathCoreFunctionsExceptions.nameInvalidArgumentType;
									      }
									      return nodeSet.length === 0? "" : nodeSet[0].nodeName;
									  } ),

	

	"http://www.w3.org/2005/xpath-functions string" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
									    function(object) {
										if (arguments.length > 1) {
										    throw XPathCoreFunctionsExceptions.stringInvalidArgumentsNumber;
										}
										return stringValue(object);
									    } ),

	

	"http://www.w3.org/2005/xpath-functions concat" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									    function() {
										if (arguments.length <2) {
										    throw XPathCoreFunctionsExceptions.concatInvalidArgumentsNumber;
										}
										var string = "";

										for (var i = 0, len = arguments.length; i < len; ++i) {
										    string += stringValue(arguments[i]);
										}
										
										return string;
									    } ),

	

	"http://www.w3.org/2005/xpath-functions starts-with" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
										 function(string, prefix) {   
										     if (arguments.length != 2) {
											 throw XPathCoreFunctionsExceptions.startsWithInvalidArgumentsNumber;
										     }
										     return stringValue(string).indexOf(stringValue(prefix)) === 0;
										 } ),

	

	"http://www.w3.org/2005/xpath-functions contains" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									      function(string, substring) {
										  if (arguments.length != 2) {
										      throw XPathCoreFunctionsExceptions.containsInvalidArgumentsNumber;
										  }
										  return stringValue(string).indexOf(stringValue(substring)) != -1;
									      } ),

	

	"http://www.w3.org/2005/xpath-functions substring-before" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
										      function(string, substring) {
											  if (arguments.length != 2) {
											      throw XPathCoreFunctionsExceptions.substringBeforeInvalidArgumentsNumber;
											  }
											  string = stringValue(string);
											  return string.substring(0, string.indexOf(stringValue(substring)));
										      } ),

	

	"http://www.w3.org/2005/xpath-functions substring-after" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
										     function(string, substring) {
											 if (arguments.length != 2) {
											     throw XPathCoreFunctionsExceptions.substringAfterInvalidArgumentsNumber;
											 }
											 string = stringValue(string);
											 substring = stringValue(substring);
											 var index = string.indexOf(substring);
											 return index == -1? "" : string.substring(index + substring.length);
										     } ),

	

	"http://www.w3.org/2005/xpath-functions substring" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									       function(string, index, length) {
										   if (arguments.length != 2 && arguments.length != 3) {
										       throw XPathCoreFunctionsExceptions.substringInvalidArgumentsNumber;
										   }
										   string = stringValue(string);
										   index  = Math.round(numberValue(index));
										   
										   if (length != null) {
										       length = Math.round(numberValue(length));
										       return string.substr(index - 1, length);
										   }
										   
										   return string.substr(index - 1);
									       } ),

	

	"http://www.w3.org/2005/xpath-functions compare" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									     function(string1, string2) {
										 if (arguments.length != 2) {
										     throw XPathCoreFunctionsExceptions.compareInvalidArgumentsNumber;
										 }
										 string1 = stringValue(string1);
										 string2 = stringValue(string2);
										 return (string1 == string2 ? 0 : (string1 > string2 ? 1 : -1));
									     } ),

	

	"http://www.w3.org/2005/xpath-functions string-length" : new XPathFunction(false, XPathFunction.DEFAULT_STRING, false,
										   function(string) {
										       if (arguments.length > 1) {
											   throw XPathCoreFunctionsExceptions.stringLengthInvalidArgumentsNumber;
										       }
										       return stringValue(string).length;
										   } ),

	

	"http://www.w3.org/2005/xpath-functions normalize-space" : new XPathFunction(false, XPathFunction.DEFAULT_STRING, false,
										     function(string) {
											 if (arguments.length > 1) {
											     throw XPathCoreFunctionsExceptions.normalizeSpaceLengthInvalidArgumentsNumber;
											 }
											 return stringValue(string).replace(/^\s+|\s+$/g, "")
											     .replace(/\s+/, " ");
										     } ),

	

	"http://www.w3.org/2005/xpath-functions translate" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									       function(string, from, to) {
										   if (arguments.length != 3) {
										       throw XPathCoreFunctionsExceptions.translateInvalidArgumentsNumber;
										   }
										   string =  stringValue(string);
										   from = stringValue(from);
										   to = stringValue(to);
										   
										   var result = "";
										   
										   for (var i = 0, len = string.length; i < len; ++i) {
										       var index = from.indexOf(string.charAt(i));
										       result += index == -1? string.charAt(i) : to.charAt(index);
										   }
										   
										   return result;
									       } ),

	

	"http://www.w3.org/2005/xpath-functions boolean" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									     function(object) {
										 if (arguments.length != 1) {
										     throw XPathCoreFunctionsExceptions.booleanInvalidArgumentsNumber;
										 }
										 return booleanValue(object);
									     } ),

	

	"http://www.w3.org/2005/xpath-functions not" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									 function(condition) {
									     if (arguments.length != 1) {
										 throw XPathCoreFunctionsExceptions.notInvalidArgumentsNumber;
									     }
									     return !booleanValue(condition);
									 } ),

	

	"http://www.w3.org/2005/xpath-functions true" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									  function() {
									      if (arguments.length != 0) {
										  throw XPathCoreFunctionsExceptions.trueInvalidArgumentsNumber;
									      }
									      return true;
									  } ),

	

	"http://www.w3.org/2005/xpath-functions false" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									   function() {
									       if (arguments.length != 0) {
										   throw XPathCoreFunctionsExceptions.falseInvalidArgumentsNumber;
									       }
									       return false;
									   } ),

	

	"http://www.w3.org/2005/xpath-functions lang" : new XPathFunction(true, XPathFunction.DEFAULT_NONE, false,
									  function(context, language) {
									      if (arguments.length != 2) {
										  throw XPathCoreFunctionsExceptions.langInvalidArgumentsNumber;
									      }
									      language = stringValue(language);

									      for (var node = context.node; node != null; node = node.parentNode) {
										  if (typeof(node.attributes) == "undefined") {
										      continue;
										  }
										  
										  var xmlLang = node.attributes.getNamedItemNS(XML.Namespaces.XML, "lang");
										  
										  if (xmlLang != null) {
										      xmlLang  = xmlLang.value.toLowerCase();
										      language = language.toLowerCase();
										      
										      return xmlLang.indexOf(language) === 0
											  && (language.length == xmlLang.length || language.charAt(xmlLang.length) == '-');
										  }
									      }

									      return false;
									  } ),

	

	"http://www.w3.org/2005/xpath-functions number" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
									    function(object) {
										if (arguments.length != 1) {
										    throw XPathCoreFunctionsExceptions.numberInvalidArgumentsNumber;
										}
										return numberValue(object);
									    } ),

	

	"http://www.w3.org/2005/xpath-functions sum" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									 function(nodeSet) {
									     if (arguments.length != 1) {
										 throw XPathCoreFunctionsExceptions.sumInvalidArgumentsNumber;
									     }
									     if (typeof nodeSet != "object") {
										 throw XPathCoreFunctionsExceptions.sumInvalidArgumentType;
									     }
									     var sum = 0;

									     for (var i = 0, len = nodeSet.length; i < len; ++i) {
										 sum += numberValue(xmlValue(nodeSet[i]));
									     }

									     return sum;
									 } ),

	

	"http://www.w3.org/2005/xpath-functions floor" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									   function(number) {
									       if (arguments.length != 1) {
										   throw XPathCoreFunctionsExceptions.floorInvalidArgumentsNumber;
									       }
									       return Math.floor(numberValue(number));
									   } ),

	

	"http://www.w3.org/2005/xpath-functions ceiling" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									     function(number) {
										 if (arguments.length != 1) {
										     throw XPathCoreFunctionsExceptions.ceilingInvalidArgumentsNumber;
										 }
										 return Math.ceil(numberValue(number));
									     } ),

	

	"http://www.w3.org/2005/xpath-functions round" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									   function(number) {
									       if (arguments.length != 1) {
										   throw XPathCoreFunctionsExceptions.roundInvalidArgumentsNumber;
									       }
									       return Math.round(numberValue(number));
									   } ),

	

	"http://www.w3.org/2002/xforms power" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
								  function(x, y) {
								      if (arguments.length != 2) {
									  throw XPathCoreFunctionsExceptions.powerInvalidArgumentsNumber;
								      }
								      return Math.pow(numberValue(x), numberValue(y));
								  } ),

	

	"http://www.w3.org/2002/xforms random" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
								   function() {
								       if (arguments.length > 1) {
									   throw XPathCoreFunctionsExceptions.randomInvalidArgumentsNumber;
								       }
								       return Math.random();
								   } ),

	

	"http://www.w3.org/2002/xforms boolean-from-string" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
										function(string) {
										    if (arguments.length != 1) {
											throw XPathCoreFunctionsExceptions.booleanFromStringInvalidArgumentsNumber;
										    }
										    string = stringValue(string);

										    switch (string.toLowerCase()) {
										    case "true":  case "1": return true;
										    case "false": case "0": return false;
										    default: return false;
										    }
										} ),

	

	"http://www.w3.org/2002/xforms if" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, true,
							       function(condition, onTrue, onFalse) {
								   if (arguments.length != 3) {
								       throw XPathCoreFunctionsExceptions.ifInvalidArgumentsNumber;
								   }
								   return booleanValue(condition)? onTrue : onFalse;
							       } ),

	

	"http://www.w3.org/2002/xforms choose" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, true,
								   function(condition, onTrue, onFalse) {
								       if (arguments.length != 3) {
									   throw XPathCoreFunctionsExceptions.chooseInvalidArgumentsNumber;
								       }
								       return booleanValue(condition)? onTrue : onFalse;
								   } ),

	

	"http://www.w3.org/2005/xpath-functions avg" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									 function(nodeSet) {
									     if (arguments.length != 1) {
										 throw XPathCoreFunctionsExceptions.avgInvalidArgumentsNumber;
									     }
									     if (typeof nodeSet != "object") {
										 throw XPathCoreFunctionsExceptions.avgInvalidArgumentType;
									     }
									     var sum = XPathCoreFunctions['http://www.w3.org/2005/xpath-functions sum'].evaluate(nodeSet);
									     var quant = XPathCoreFunctions['http://www.w3.org/2005/xpath-functions count'].evaluate(nodeSet);
									     return sum / quant;
									 } ),

	

	"http://www.w3.org/2005/xpath-functions min" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									 function (nodeSet) {
									     if (arguments.length != 1) {
										 throw XPathCoreFunctionsExceptions.minInvalidArgumentsNumber;
									     }
									     if (typeof nodeSet != "object") {
										 throw XPathCoreFunctionsExceptions.minInvalidArgumentType;
									     }
									     if (nodeSet.length === 0) {
										 return Number.NaN;
									     }
									     
									     var minimum = numberValue(xmlValue(nodeSet[0]));
									     
									     for (var i = 1, len = nodeSet.length; i < len; ++i) {
										 var value = numberValue(xmlValue(nodeSet[i]));
										 
										 if (isNaN(value)) {
										     return Number.NaN;
										 }
										 
										 if (value < minimum) {
										     minimum = value;
										 }
									     }
									     
									     return minimum;
									 } ),

	

	"http://www.w3.org/2005/xpath-functions max" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									 function (nodeSet) {
									     if (arguments.length != 1) {
										 throw XPathCoreFunctionsExceptions.maxInvalidArgumentsNumber;
									     }
									     if (typeof nodeSet != "object") {
										 throw XPathCoreFunctionsExceptions.maxInvalidArgumentType;
									     }
									     if (nodeSet.length === 0) {
										 return Number.NaN;
									     }
									     
									     var maximum = numberValue(xmlValue(nodeSet[0]));
									     
									     for (var i = 1, len = nodeSet.length; i < len; ++i) {
										 var value = numberValue(xmlValue(nodeSet[i]));
										 
										 if (isNaN(value)) {
										     return Number.NaN;
										 }
										 
										 if (value > maximum) {
										     maximum = value;
										 }
									     }
									     
									     return maximum;
									 } ),

	

	"http://www.w3.org/2002/xforms count-non-empty" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
									    function(nodeSet) {
										if (arguments.length != 1) {
										    throw XPathCoreFunctionsExceptions.countNonEmptyInvalidArgumentsNumber;
										}
										if (typeof nodeSet != "object") {
										    throw XPathCoreFunctionsExceptions.countNonEmptyInvalidArgumentType;
										}
										var count = 0;
										
										for (var i = 0, len = nodeSet.length; i < len; ++i) {
										    if (xmlValue(nodeSet[i]).length > 0) {
											count++;
										    }
										}
										
										return count;
									    } ),

	"http://www.w3.org/2002/xforms property" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
								     function(name) {
									 if (arguments.length != 1) {
									     throw XPathCoreFunctionsExceptions.propertyInvalidArgumentsNumber;
									 }
									 name = stringValue(name);

									 switch (name) {
									 case "version" : return "1.1";
									 case "conformance-level" : return "full";
									 }
									 return "";
								     } ),

	

	"http://www.w3.org/2002/xforms instance" : new XPathFunction(true, XPathFunction.DEFAULT_NONE, true,
								     function(ctx, idRef) {
									 if (arguments.length > 2) {
									     throw XPathCoreFunctionsExceptions.instanceInvalidArgumentsNumber;
									 }
									 var name = idRef ? stringValue(idRef) : "";
									 if (name != "") {
									     var instance = document.getElementById(name);
									     if (!instance) { throw {name: "instance " + name + " not found"}; }
									     return [instance.xfElement.doc.documentElement];
									 } else {
									     return [ctx.node.ownerDocument.documentElement];
									 }
								     } ),
	
	/*
	  "http://www.w3.org/2002/xforms days-from-date" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
	  function(string) {
	  if (arguments.length != 1) {
	  throw XPathCoreFunctionsExceptions.daysFromDateInvalidArgumentsNumber;
	  }
	  string = stringValue(string);
	  if( !Schema.getType("xsd_:date").validate(string) && !Schema.getType("xsd_:dateTime").validate(string)) {
	  return "NaN";
	  }

	  p = /^([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])/;
	  c = p.exec(string);
	  d = new Date(Date.UTC(c[1], c[2]-1, c[3]));
	  return Math.floor(d.getTime()/ 86400000 + 0.000001);
	  } ),
	*/
	
	/*
	  "http://www.w3.org/2002/xforms seconds-from-dateTime" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
	  function(string) {
	  if (arguments.length != 1) {
	  throw XPathCoreFunctionsExceptions.secondsFromDateTimeInvalidArgumentsNumber;
	  }
	  string = stringValue(string);
	  if( !Schema.getType("xsd_:dateTime").validate(string)) {
	  return "NaN";
	  }
	  p = /^([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-])?([01][0-9]|2[0-3])?:?([0-5][0-9])?/;
	  c = p.exec(string);
	  d = new Date(Date.UTC(c[1], c[2]-1, c[3], c[4], c[5], c[6]));
	  if(c[8] && c[8] != "Z") {
	  d.setUTCMinutes(d.getUTCMinutes() + (c[8] == "+" ? 1 : -1)*(c[9]*60 + c[10]));
	  }
	  return Math.floor(d.getTime() / 1000 + 0.000001) + (c[7]?c[7]:0);
	  } ),
	*/

	"http://www.w3.org/2002/xforms current" : new XPathFunction(true, XPathFunction.DEFAULT_NONE, true,
								    function(ctx) {
									if (arguments.length != 1) {
									    throw XPathCoreFunctionsExceptions.currentInvalidArgumentsNumber;
									}
									ctx.addDepNode(ctx.node);
									ctx.addDepElement(document.getElementById(Core.getMeta(ctx.node.documentElement ? ctx.node.documentElement : ctx.node.ownerDocument.documentElement, "model")).xfElement);
									return [ctx.current];
								    } ),

	

	"http://www.w3.org/2002/xforms is-valid" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
								     function(nodeSet) {
									 if (arguments.length != 1) {
									     throw XPathCoreFunctionsExceptions.isValidInvalidArgumentsNumber;
									 }
									 if (typeof nodeSet != "object") {
									     throw XPathCoreFunctionsExceptions.isValidInvalidArgumentType;
									 }
									 var valid = true;
									 
									 for (var i = 0, len = nodeSet.length; valid && i < len; i++) {
									     valid = valid && validate_(nodeSet[i]);
									 }

									 return valid;
								     } ),

	

	"http://www.w3.org/2002/xforms is-card-number" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
									   function(string) {
									       if (arguments.length != 1) {
										   throw XPathCoreFunctionsExceptions.isCardNumberInvalidArgumentsNumber;
									       }
									       string = stringValue(string).trim();
									       var odd = true;
									       var sum = 0;
									       for (var i = string.length - 1; i >= 0; i--) {
										   var d = string.charAt(i) - '0';
										   if( d < 0 || d > 9 ) {
										       return false;
										   }
										   sum += odd ? d : d*2 - (d > 5 ? 9 : 0);
										   odd = !odd;
									       }
									       return sum % 10 == 0;
									   } ),

	

	"http://www.w3.org/2002/xforms digest" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
								   function(str, algo, enco) {
								       if (arguments.length != 2 && arguments.length != 3) {
									   throw XPathCoreFunctionsExceptions.digestInvalidArgumentsNumber;
								       }
								       str = stringValue(str);
								       algo = stringValue(algo);
								       enco = enco ? stringValue(enco) : "base64";
								       switch(algo) {
								       case "SHA-1" :
									   var l = str.length;
									   var bl = l*8;
									   var W = [];
									   var H0 = 0x67452301;
									   var H1 = 0xefcdab89;
									   var H2 = 0x98badcfe;
									   var H3 = 0x10325476;
									   var H4 = 0xc3d2e1f0;
									   var a, b, c, d, e, T;
									   var msg = [];
									   for(var i = 0; i<l; i++){
									       msg[i >> 2] |= (str.charCodeAt(i)& 0xFF)<<((3-i%4)<<3);
									   }
									   msg[bl >> 5] |= 0x80 <<(24-bl%32);
									   msg[((bl+65 >> 9)<< 4)+ 15] = bl;
									   l = msg.length;
									   var rotl = function(x,n){
									       return(x <<  n)|(x >>>(32-n));
									   };
									   var add32 = function(x,y){
									       var lsw = (x & 0xFFFF)+(y & 0xFFFF);
									       return ((((x >>> 16)+(y >>> 16)+(lsw >>> 16)) & 0xFFFF)<< 16)|(lsw & 0xFFFF);
									   };
									   for(var i = 0; i<l; i += 16){
									       a = H0;
									       b = H1;
									       c = H2;
									       d = H3;
									       e = H4;
									       for(var t = 0; t<20; t++){
										   T = add32(add32(add32(add32(rotl(a,5),(b & c)^(~b & d)),e),0x5a827999),W[t] = t<16 ? msg[t+i] : rotl(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16],1));
										   e = d, d = c, c = rotl(b,30), b = a, a = T;
									       }
									       for(var t = 20; t<40; t++){
										   T = add32(add32(add32(add32(rotl(a,5),b^c^d),e),0x6ed9eba1),W[t] = rotl(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16],1));
										   e = d, d = c, c = rotl(b,30), b = a, a = T;
									       }
									       for(var t = 40; t<60; t++){
										   T = add32(add32(add32(add32(rotl(a,5),(b & c)^(b & d)^(c & d)),e),0x8f1bbcdc),W[t] = rotl(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16],1));
										   e = d, d = c, c = rotl(b,30), b = a, a = T;
									       }
									       for(var t = 60; t<80; t++){
										   T = add32(add32(add32(add32(rotl(a,5),b^c^d),e),0xca62c1d6),W[t] = rotl(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16],1));
										   e = d, d = c, c = rotl(b,30), b = a, a = T;
									       }
									       H0 = add32(a,H0);
									       H1 = add32(b,H1);
									       H2 = add32(c,H2);
									       H3 = add32(d,H3);
									       H4 = add32(e,H4);
									   }
									   var hex32 = function(v) {
									       var h = v >>> 16;
									       var l = v & 0xFFFF;
									       return (h >= 0x1000 ? "" : h >= 0x100 ? "0" : h >= 0x10 ? "00" : "000")+h.toString(16)+(l >= 0x1000 ? "" : l >= 0x100 ? "0" : l >= 0x10 ? "00" : "000")+l.toString(16);
									   };
									   var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
									   var b12 = function(v) {
									       return b64.charAt((v >>> 6) & 0x3F)+b64.charAt(v & 0x3F);
									   }
									   var b30 = function(v) {
									       return b64.charAt(v >>> 24)+b64.charAt((v >>> 18) & 0x3F)+b64.charAt((v >>> 12) & 0x3F)+b64.charAt((v >>> 6) & 0x3F)+b64.charAt(v & 0x3F);
									   }
									   switch(enco) {
									   case "hex" :
									       return hex32(H0)+hex32(H1)+hex32(H2)+hex32(H3)+hex32(H4);
									       break;
									   case "base64" :
									       return b30(H0 >>> 2)+b30(((H0 & 0x3) << 28) | (H1 >>> 4))+b30(((H1 & 0xF) << 26) | (H2 >>> 6))+b30(((H2 & 0x3F) << 24) | (H3 >>> 8))+b30(((H3 & 0xFF) << 22) | (H4 >>> 10))+b12((H4 & 0x3FF)<<2)+"=";
									       break;
									   default :
									       break;
									   }
									   break;
								       }
								       return "unsupported";
								   } ),

	

	"http://www.w3.org/2005/xpath-functions upper-case" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
										function(str) {
										    if (arguments.length != 1) {
											throw XPathCoreFunctionsExceptions.upperCaseInvalidArgumentsNumber;
										    }
										    str = stringValue(str);
										    return str.toUpperCase();
										} ),

	

	"http://www.w3.org/2005/xpath-functions lower-case" : new XPathFunction(false, XPathFunction.DEFAULT_NODESET, false,
										function(str) {
										    if (arguments.length != 1) {
											throw XPathCoreFunctionsExceptions.lowerCaseInvalidArgumentsNumber;
										    }
										    str = stringValue(str);
										    return str.toLowerCase();
										} ),

	

	"http://www.w3.org/2002/xforms transform" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
								      function(nodeSet, xslhref) {
									  if (arguments.length != 2) {
									      throw XPathCoreFunctionsExceptions.transformInvalidArgumentsNumber;
									  }
									  xslhref = stringValue(xslhref);
									  return Core.transformText(Core.saveXML(nodeSet[0]), xslhref, false);
									  ;
								      } ),

	

	"http://www.w3.org/2002/xforms serialize" : new XPathFunction(false, XPathFunction.DEFAULT_NODE, false,
								      function(nodeSet) {
									  if (arguments.length > 1) {
									      throw XPathCoreFunctionsExceptions.serializeInvalidArgumentsNumber;
									  }
									  if (arguments.length == 1 && typeof nodeSet != "object") {
									      throw XPathCoreFunctionsExceptions.serializeInvalidArgumentType;
									  }
									  if (arguments.length == 0) {
									      throw XPathCoreFunctionsExceptions.serializeNoContext;
									  }
									  return Core.saveXML(nodeSet[0]);
								      } ),
	"http://exslt.org/math abs" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							function(number) {
							    if (arguments.length != 1) {
								throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							    }
							    return Math.abs(numberValue(number));
							} ),
	"http://exslt.org/math acos" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							 function(number) {
							     if (arguments.length != 1) {
								 throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							     }
							     return Math.acos(numberValue(number));
							 } ),
	"http://exslt.org/math asin" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							 function(number) {
							     if (arguments.length != 1) {
								 throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							     }
							     return Math.asin(numberValue(number));
							 } ),
	"http://exslt.org/math atan" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							 function(number) {
							     if (arguments.length != 1) {
								 throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							     }
							     return Math.atan(numberValue(number));
							 } ),
	"http://exslt.org/math atan2" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							  function(number1, number2) {
							      if (arguments.length != 2) {
								  throw XPathCoreFunctionsExceptions.math2InvalidArgumentsNumber;
							      }
							      return Math.atan2(numberValue(number1), numberValue(number2));
							  } ),
	"http://exslt.org/math constant" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							     function(string, number) {
								 if (arguments.length != 2) {
								     throw XPathCoreFunctionsExceptions.math2InvalidArgumentsNumber;
								 }
								 var val = MathConstants[stringValue(string)] || "0";
								 return parseFloat(val.substr(0, numberValue(number)+2));
							     } ),
	"http://exslt.org/math cos" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							function(number) {
							    if (arguments.length != 1) {
								throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							    }
							    return Math.cos(numberValue(number));
							} ),
	"http://exslt.org/math exp" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							function(number) {
							    if (arguments.length != 1) {
								throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							    }
							    return Math.exp(numberValue(number));
							} ),
	"http://exslt.org/math log" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							function(number) {
							    if (arguments.length != 1) {
								throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							    }
							    return Math.log(numberValue(number));
							} ),
	"http://exslt.org/math power" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							  function(number1, number2) {
							      if (arguments.length != 2) {
								  throw XPathCoreFunctionsExceptions.math2InvalidArgumentsNumber;
							      }
							      return Math.pow(numberValue(number1), numberValue(number2));
							  } ),
	"http://exslt.org/math sin" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							function(number) {
							    if (arguments.length != 1) {
								throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							    }
							    return Math.sin(numberValue(number));
							} ),
	"http://exslt.org/math sqrt" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							 function(number) {
							     if (arguments.length != 1) {
								 throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							     }
							     return Math.sqrt(numberValue(number));
							 } ),
	"http://exslt.org/math tan" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
							function(number) {
							    if (arguments.length != 1) {
								throw XPathCoreFunctionsExceptions.math1InvalidArgumentsNumber;
							    }
							    return Math.tan(numberValue(number));
							} ),


	"http://www.w3.org/2005/xpath-functions string-join" : new XPathFunction(false, XPathFunction.DEFAULT_NONE, false,
										 function(nodeSet, joinString) { 
										     if (arguments.length != 1 && arguments.length != 2) {
											 throw XPathCoreFunctionsExceptions.stringJoinInvalidArgumentsNumber;
										     }
										     if (typeof nodeSet != "object") {
											 throw XPathCoreFunctionsExceptions.stringJoinInvalidArgumentType;
										     }
										     var strings = [];
										     joinString = joinString || "";
										     for (var i = 0, len = nodeSet.length; i < len; i++) {
											 strings.push(xmlValue(nodeSet[i]));
										     }
										     return strings.join(joinString);
										 } )
    };

    XPathCoreFunctionsExceptions = {
	lastInvalidArgumentsNumber : {
	    name : "last() : Invalid number of arguments",
	    message : "last() function has no argument"
	},
	positionInvalidArgumentsNumber : {
	    name : "position() : Invalid number of arguments",
	    message : "position() function has no argument"
	},
	countInvalidArgumentsNumber : {
	    name : "count() : Invalid number of arguments",
	    message : "count() function must have one argument exactly"
	},
	countInvalidArgumentType : {
	    name : "count() : Invalid type of argument",
	    message : "count() function must have a nodeset argument"
	},
	idInvalidArgumentsNumber : {
	    name : "id() : Invalid number of arguments",
	    message : "id() function must have one argument exactly"
	},
	idInvalidArgumentType : {
	    name : "id() : Invalid type of argument",
	    message : "id() function must have a nodeset or string argument"
	},
	localNameInvalidArgumentsNumber : {
	    name : "local-name() : Invalid number of arguments",
	    message : "local-name() function must have one argument at most"
	},
	localNameInvalidArgumentType : {
	    name : "local-name() : Invalid type of argument",
	    message : "local-name() function must have a nodeset argument"
	},
	localNameNoContext : {
	    name : "local-name() : no context node",
	    message : "local-name() function must have a nodeset argument"
	},
	namespaceUriInvalidArgumentsNumber : {
	    name : "namespace-uri() : Invalid number of arguments",
	    message : "namespace-uri() function must have one argument at most"
	},
	namespaceUriInvalidArgumentType : {
	    name : "namespace-uri() : Invalid type of argument",
	    message : "namespace-uri() function must have a nodeset argument"
	},
	nameInvalidArgumentsNumber : {
	    name : "name() : Invalid number of arguments",
	    message : "name() function must have one argument at most"
	},
	nameInvalidArgumentType : {
	    name : "name() : Invalid type of argument",
	    message : "name() function must have a nodeset argument"
	},
	stringInvalidArgumentsNumber : {
	    name : "string() : Invalid number of arguments",
	    message : "string() function must have one argument at most"
	},
	concatInvalidArgumentsNumber : {
	    name : "concat() : Invalid number of arguments",
	    message : "concat() function must have at least two arguments"
	},
	startsWithInvalidArgumentsNumber : {
	    name : "starts-with() : Invalid number of arguments",
	    message : "starts-with() function must have two arguments exactly"
	},
	containsInvalidArgumentsNumber : {
	    name : "contains() : Invalid number of arguments",
	    message : "contains() function must have two arguments exactly"
	},
	substringBeforeInvalidArgumentsNumber : {
	    name : "substring-before() : Invalid number of arguments",
	    message : "substring-before() function must have two arguments exactly"
	},
	substringAfterInvalidArgumentsNumber : {
	    name : "substring-after() : Invalid number of arguments",
	    message : "substring-after() function must have two arguments exactly"
	},
	substringInvalidArgumentsNumber : {
	    name : "substring() : Invalid number of arguments",
	    message : "substring() function must have two or three arguments"
	},
	compareInvalidArgumentsNumber : {
	    name : "compare() : Invalid number of arguments",
	    message : "compare() function must have two arguments exactly"
	},
	stringLengthInvalidArgumentsNumber : {
	    name : "string-length() : Invalid number of arguments",
	    message : "string-length() function must have one argument at most"
	},
	normalizeSpaceInvalidArgumentsNumber : {
	    name : "normalize-space() : Invalid number of arguments",
	    message : "normalize-space() function must have one argument at most"
	},
	translateInvalidArgumentsNumber : {
	    name : "translate() : Invalid number of arguments",
	    message : "translate() function must have three argument exactly"
	},
	booleanInvalidArgumentsNumber : {
	    name : "boolean() : Invalid number of arguments",
	    message : "boolean() function must have one argument exactly"
	},
	notInvalidArgumentsNumber : {
	    name : "not() : Invalid number of arguments",
	    message : "not() function must have one argument exactly"
	},
	trueInvalidArgumentsNumber : {
	    name : "true() : Invalid number of arguments",
	    message : "true() function must have no argument"
	},
	falseInvalidArgumentsNumber : {
	    name : "false() : Invalid number of arguments",
	    message : "false() function must have no argument"
	},
	langInvalidArgumentsNumber : {
	    name : "lang() : Invalid number of arguments",
	    message : "lang() function must have one argument exactly"
	},
	numberInvalidArgumentsNumber : {
	    name : "number() : Invalid number of arguments",
	    message : "number() function must have one argument exactly"
	},
	sumInvalidArgumentsNumber : {
	    name : "sum() : Invalid number of arguments",
	    message : "sum() function must have one argument exactly"
	},
	sumInvalidArgumentType : {
	    name : "sum() : Invalid type of argument",
	    message : "sum() function must have a nodeset argument"
	},
	floorInvalidArgumentsNumber : {
	    name : "floor() : Invalid number of arguments",
	    message : "floor() function must have one argument exactly"
	},
	ceilingInvalidArgumentsNumber : {
	    name : "ceiling() : Invalid number of arguments",
	    message : "ceiling() function must have one argument exactly"
	},
	roundInvalidArgumentsNumber : {
	    name : "round() : Invalid number of arguments",
	    message : "round() function must have one argument exactly"
	},
	powerInvalidArgumentsNumber : {
	    name : "power() : Invalid number of arguments",
	    message : "power() function must have one argument exactly"
	},
	randomInvalidArgumentsNumber : {
	    name : "random() : Invalid number of arguments",
	    message : "random() function must have no argument"
	},
	booleanFromStringInvalidArgumentsNumber : {
	    name : "boolean-from-string() : Invalid number of arguments",
	    message : "boolean-from-string() function must have one argument exactly"
	},
	ifInvalidArgumentsNumber : {
	    name : "if() : Invalid number of arguments",
	    message : "if() function must have three argument exactly"
	},
	chooseInvalidArgumentsNumber : {
	    name : "choose() : Invalid number of arguments",
	    message : "choose() function must have three argument exactly"
	},
	avgInvalidArgumentsNumber : {
	    name : "avg() : Invalid number of arguments",
	    message : "avg() function must have one argument exactly"
	},
	avgInvalidArgumentType : {
	    name : "avg() : Invalid type of argument",
	    message : "avg() function must have a nodeset argument"
	},
	minInvalidArgumentsNumber : {
	    name : "min() : Invalid number of arguments",
	    message : "min() function must have one argument exactly"
	},
	minInvalidArgumentType : {
	    name : "min() : Invalid type of argument",
	    message : "min() function must have a nodeset argument"
	},
	maxInvalidArgumentsNumber : {
	    name : "max() : Invalid number of arguments",
	    message : "max() function must have one argument exactly"
	},
	maxInvalidArgumentType : {
	    name : "max() : Invalid type of argument",
	    message : "max() function must have a nodeset argument"
	},
	serializeInvalidArgumentType : {
	    name : "serialize() : Invalid type of argument",
	    message : "serialize() function must have a nodeset argument"
	},
	countNonEmptyInvalidArgumentsNumber : {
	    name : "count-non-empty() : Invalid number of arguments",
	    message : "count-non-empty() function must have one argument exactly"
	},
	countNonEmptyInvalidArgumentType : {
	    name : "count-non-empty() : Invalid type of argument",
	    message : "count-non-empty() function must have a nodeset argument"
	},
	indexInvalidArgumentsNumber : {
	    name : "index() : Invalid number of arguments",
	    message : "index() function must have one argument exactly"
	},
	nodeIndexInvalidArgumentsNumber : {
	    name : "nodeIndex() : Invalid number of arguments",
	    message : "nodeIndex() function must have one argument exactly"
	},
	propertyInvalidArgumentsNumber : {
	    name : "property() : Invalid number of arguments",
	    message : "property() function must have one argument exactly"
	},
	propertyInvalidArgument : {
	    name : "property() : Invalid argument",
	    message : "Invalid property name"
	},
	instanceInvalidArgumentsNumber : {
	    name : "instance() : Invalid number of arguments",
	    message : "instance() function must have zero or one argument"
	},
	nowInvalidArgumentsNumber : {
	    name : "now() : Invalid number of arguments",
	    message : "now() function must have no argument"
	},
	localDateInvalidArgumentsNumber : {
	    name : "local-date() : Invalid number of arguments",
	    message : "local-date() function must have no argument"
	},
	localDateTimeInvalidArgumentsNumber : {
	    name : "local-dateTime() : Invalid number of arguments",
	    message : "local-dateTime() function must have no argument"
	},
	daysFromDateInvalidArgumentsNumber : {
	    name : "days-from-date() : Invalid number of arguments",
	    message : "days-from-date() function must have one argument exactly"
	},
	daysToDateInvalidArgumentsNumber : {
	    name : "days-to-date() : Invalid number of arguments",
	    message : "days-to-date() function must have one argument exactly"
	},
	secondsToDateTimeInvalidArgumentsNumber : {
	    name : "seconds-to-dateTime() : Invalid number of arguments",
	    message : "seconds-to-dateTime() function must have one argument exactly"
	},
	secondsFromDateTimeInvalidArgumentsNumber : {
	    name : "seconds-from-dateTime() : Invalid number of arguments",
	    message : "seconds-from-dateTime() function must have one argument exactly"
	},
	currentInvalidArgumentsNumber : {
	    name : "current() : Invalid number of arguments",
	    message : "current() function must have no argument"
	},
	isValidInvalidArgumentsNumber : {
	    name : "is-valid() : Invalid number of arguments",
	    message : "is-valid() function must have one argument exactly"
	},
	isValidInvalidArgumentType : {
	    name : "is-valid() : Invalid type of argument",
	    message : "is-valid() function must have a nodeset argument"
	},
	isCardNumberInvalidArgumentsNumber : {
	    name : "is-card-number() : Invalid number of arguments",
	    message : "is-card-number() function must have one argument exactly"
	},
	upperCaseInvalidArgumentsNumber : {
	    name : "upper-case() : Invalid number of arguments",
	    message : "upper-case() function must have one argument exactly"
	},
	lowerCaseInvalidArgumentsNumber : {
	    name : "lower-case() : Invalid number of arguments",
	    message : "lower-case() function must have one argument exactly"
	},
	transformInvalidArgumentsNumber : {
	    name : "transform() : Invalid number of arguments",
	    message : "transform() function must have two arguments exactly"
	},
	serializeNoContext : {
	    name : "serialize() : no context node",
	    message : "serialize() function must have a node argument"
	},
	serializeInvalidArgumentsNumber : {
	    name : "serialize() : Invalid number of arguments",
	    message : "serialize() function must have one argument exactly"
	},
	eventInvalidArgumentsNumber : {
	    name : "event() : Invalid number of arguments",
	    message : "event() function must have one argument exactly"
	},
	stringJoinInvalidArgumentsNumber : {
	    name : "string-join() : Invalid number of arguments",
	    message : "string-join() function must have one or two arguments"
	},
	stringJoinInvalidArgumentType : {
	    name : "string-join() : Invalid type of argument",
	    message : "string-join() function must have a nodeset argument"
	}
    };

    
    var NSResolver = dojo.declare(null, {
	constructor: function() {
	    this.map = {};
	    this.notfound = false;
	},
	
	registerAll: function(resolver) {
	    for (var prefix in resolver.map) {
		this.map[prefix] = resolver.map[prefix];
	    }
	},

	register: function(prefix, uri) {
	    this.map[prefix] = uri;
	    if( uri == "notfound" ) {
		this.notfound = true;
	    }
	},

	registerNotFound: function(prefix, uri) {
	    if( this.map[prefix] == "notfound" ) {
		this.map[prefix] = uri;
		for(p in this.map) {
		    if( this.map[p] == "notfound" ) {
			this.notfound = true;
		    }
		}
	    }
	},

	lookupNamespaceURI: function(prefix) {
	    return this.map[prefix];
	}
    });
    
    dojo.declare("xsltforms.xpath.XPath", xsltforms.XFAbstractObject, {
	//function XPath(expression, compiled, ns) {
	constructor: function(args) {
    	this._factory = args.factory;
	    this.expression = args.expression;
	    if (typeof args.compiled == "string") {
		alert("XSLTForms Exception\n--------------------------\n\nError parsing the following XPath expression :\n\n"+args.expression+"\n\n"+args.compiled);
		return;
	    }
	    this.compiled = args.compiled;
	    this.compiled.isRoot = true;
	    this.nsresolver = new NSResolver();
	    
	    var ns = args.ns;
	    if (ns.length > 0)  {
		for (var i = 0, len = ns.length; i < len; i += 2) {
		    this.nsresolver.register(ns[i], ns[i + 1]);
		}
	    } else {
		this.nsresolver.register("", "http://www.w3.org/1999/xhtml");
	    }
	    if (this.nsresolver.notfound) {
		// FIXME
		//XPath.notfound = true;
	    }
    },
	evaluate: function(ctx) {
		assert(ctx);

//		alert("XPath evaluate \""+this.expression+"\"");
		if (!ctx.node) {
			ctx = new ExprContext(ctx, 1, null, null, this.nsresolver);
		} else if (!ctx.nsresolver) {
			ctx.nsresolver = this.nsresolver;
		}

		try {
			return this.compiled.evaluate(ctx);
		} catch(e) {
			alert("XSLTForms Exception\n--------------------------\n\nError evaluating the following XPath expression :\n\n"+this.expression+"\n\n"+e.name+"\n\n"+e.message);
			return null;
		}
	}
    });

    function getXPathClasses() {
	return {
	    ArrayExpr: ArrayExpr,
	    BinaryExpr: BinaryExpr,
	    ExprContext: ExprContext,
	    TokenExpr: TokenExpr,
	    UnaryMinusExpr: UnaryMinusExpr,
	    CteExpr: CteExpr,
	    FilterExpr: FilterExpr,
	    LocationExpr: LocationExpr,
	    NodeTestAny: NodeTestAny,
	    NodeTestName: NodeTestName,
	    NodeTestPI: NodeTestPI,
	    NodeTestType: NodeTestType,
	    PathExpr: PathExpr,
	    PredicateExpr: PredicateExpr,
	    StepExpr: StepExpr,
	    UnionExpr: UnionExpr
	};
    }
    
    dojo.declare("xsltforms.xpath.XPathFactory", xsltforms.XFAbstractObject, {
	constructor: function(args) {
	    this._expressions = [];
	    dojo.safeMixin(this, getXPathClasses());
	    dojo.safeMixin(this, createSchemaDependentClasses(this, this.xform));
	},
	get: function(expr) {
	    return this._expressions[expr];
	},
	create: function(expression, compiled) {
	    var xpath = this._expressions[expression];
	    if (null != xpath && compiled) {
		delete compiled;
	    } else {
		var ns = [];
		for (var i = 2, len = arguments.length; i < len; i += 2) {
		    ns[i-2] = arguments[i];
		    ns[i-1] = arguments[i+1];
		}
		xpath = new xsltforms.xpath.XPath({
			factory: this,
		    xform: this.xform,
		    expression: expression,
		    compiled: compiled ? compiled : null,
		    ns: ns
		});
		this._expressions[expression] = xpath;
	    }
	    return xpath;
	},
	registerNS: function(prefix, uri) {
		/*
		if (XPath.notfound) {
			XPath.notfound = false;
			for( e in XPath.expressions ) {
				XPath.expressions[e].nsresolver.registerNotFound(prefix, uri);
				if (XPath.expressions[e].nsresolver.notfound) {
					XPath.notfound = true;
				}
			}
		}
		*/
	}
    });

})();

dojo.provide("xsltforms.xpath");