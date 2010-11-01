dojo.provide("xsltforms");

var Core = {
	    fileName : "xsltforms.js",

	    isOpera : navigator.userAgent.match(/\bOpera\b/) != null,
	    isIE : navigator.userAgent.match(/\bMSIE\b/) != null
	           && navigator.userAgent.match(/\bOpera\b/) == null,
			isIE6 : navigator.userAgent.match(/\bMSIE 6.0/) != null,
	    isMozilla : navigator.userAgent.match(/\bGecko\b/) != null,
			isFF2 : navigator.userAgent.match(/\bFirefox[\/\s]2.\b/) != null,
			isXhtml : document.documentElement.namespaceURI == "http://www.w3.org/1999/xhtml",
			/*
		enclosingFormHeader: function(node) {
			var nl = new dojo.NodeList();
			nl.push(node);
			nl.closest(".xforms-xform").children(".xforms-pseudo-header")[0];
		},
			*/
	    setClass : function(element, className, value) {
	        assert(element && className);

	        if (value) {
	            if (!this.hasClass(element, className)) {
	                element.className += " " + className;
	            }
	        } else if (element.className) {
	            element.className = element.className.replace(className, "");
	        }
	    },

	    hasClass : function(element, className) {
	    	var cn = element.className;

	    	return inArray(className, (cn && cn.split(" ")) || []);
	    },

	    getElementsByTagName: function(element, tagName) {
		return Core.isXhtml ?
		    element.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", tagName)
		    : element.getElementsByTagName(tagName);
	    },

	    createElementByName: function(doc, tagName) {
		return Core.isXhtml ?
		    doc.createElementNS("http://www.w3.org/1999/xhtml", tagName)
		    : doc.createElement(tagName);
	    },

	    initHover : function(Event, element) {
	        Event.attach(element, "mouseover", function(event) {
	            Core.setClass(Event.getTarget(event), "hover", true);
	        } );

	        Event.attach(element, "mouseout", function(event) {
	            Core.setClass(Event.getTarget(event), "hover", false);
	        } );
	    },
	    getEventPos : function(ev) {
	        ev = ev || window.event;
			return { x : ev.pageX || ev.clientX + window.document.body.scrollLeft || 0,
			         y : ev.pageY || ev.clientY + window.document.body.scrollTop || 0 };
	    },
	    getAbsolutePos : function(e) {
	        var r = Core.getPos(e);

	        if (e.offsetParent) {
	            var tmp = Core.getAbsolutePos(e.offsetParent);
	            r.x += tmp.x;
	            r.y += tmp.y;
	        }

	        return r;
	    },
	    getPos : function(e) {
	        var is_div = /^div$/i.test(e.tagName);

	        var r = {
	            x: e.offsetLeft - (is_div && e.scrollLeft? e.scrollLeft : 0),
	            y: e.offsetTop - (is_div && e.scrollTop? e.scrollTop : 0)
	        };

	        return r;
	    },
	    setPos : function(element, left, top) {
	        if (element.offsetParent) {
	            var tmp = Core.getAbsolutePos(element.offsetParent);
	            left -= tmp.x;
	            top -= tmp.y;
	        }

	        element.style.top = top + "px";
	        element.style.left = left + "px";
	    },

	    constructURI : function(uri) {
				if (uri.match(/^[a-zA-Z0-9+.-]+:\/\//)) {
					return uri;
				}
				if (uri.charAt(0) == '/') {
					return document.location.href.substr(0, document.location.href.replace(/:\/\//, ":\\\\").indexOf("/")) + uri;
				}
				var href = document.location.href;
				var idx = href.indexOf("?");
				href =  idx == -1 ? href : href.substr(0, idx);
				idx = href.replace(/:\/\//, ":\\\\").lastIndexOf("/");
				if (href.length > idx + 1) {
					return (idx == -1 ? href : href.substr(0, idx)) + "/" + uri;
				}
				return href + uri;
	    },

	    createElement : function(type, parent, content, className) {
	        var el = Core.createElementByName(document, type);
	        if (className) { el.className = className; }
	        if (parent) { parent.appendChild(el); }
	        if (content) { el.appendChild(document.createTextNode(content)); }
	        return el;
	    },

	    getWindowSize : function() {
					var myWidth = 0, myHeight = 0, myOffsetX = 0, myOffsetY = 0, myScrollX = 0, myScrollY = 0;
					if( typeof( window.innerWidth ) == 'number' ) {
						//Non-IE
						myWidth = document.documentElement.clientWidth;
						myHeight = document.documentElement.clientHeight;
						myOffsetX = document.body ? Math.max(document.documentElement.clientWidth, document.body.clientWidth) : document.documentElement.clientWidth; // body margins ?
						myOffsetY = document.body ? Math.max(document.documentElement.clientHeight, document.body.clientHeight) : document.documentElement.clientHeight; // body margins ?
						myScrollX = window.scrollX;
						myScrollY = window.scrollY;
					} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
						//IE 6+ in 'standards compliant mode'
						myWidth = document.documentElement.clientWidth;
						myHeight = document.documentElement.clientHeight;
						myOffsetX = Math.max(document.documentElement.clientWidth, document.body.clientWidth); // body margins ?
						myOffsetY = Math.max(document.documentElement.clientHeight, document.body.clientHeight); // body margins ?
						myScrollX = document.body.parentNode.scrollLeft;
						myScrollY = document.body.parentNode.scrollTop;
					}
	        return {
						height : myHeight,
						width : myWidth,
						offsetX : myOffsetX,
						offsetY : myOffsetY,
						scrollX : myScrollX,
						scrollY : myScrollY
	        };
	    }
	};

			

	if (window.XMLHttpRequest) {
		Core.openRequest = function(method, uri, async) {
			// netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
			var req = new XMLHttpRequest();
			req.open(method, Core.constructURI(uri), async);
			if (Core.isMozilla) {
				req.overrideMimeType("text/xml");
			}
			return req;
		};
	} else if (window.ActiveXObject) {
		Core.openRequest = function(method, uri, async) {
			try {
				req = new ActiveXObject("Msxml2.XMLHTTP.6.0"); 
			} catch (e) {
				try {
					req = new ActiveXObject("Msxml2.XMLHTTP.3.0"); 
				} catch (e) {
					try {
						req = new ActiveXObject("Msxml2.XMLHTTP");
					} catch (e) {
						throw new Error("This browser does not support XHRs(Ajax)! \n Cause: " + (e.message || e.description || e) + " \n Enable Javascript or ActiveX controls (on IE) or lower security restrictions.");
					}
				}
			}
			req.open(method, Core.constructURI(uri), async);
			return req;
		};
	} else {
		throw new Error("This browser does not support XHRs(Ajax)! \n Enable Javascript or ActiveX controls (on IE) or lower security restrictions.");
	}

			

	if (Core.isIE) {
	    Core.transformText = function(xml, xslt, inline) {
				var xmlDoc = new ActiveXObject("MSXML2.DOMDocument.6.0");
				xmlDoc.loadXML(xml);
				var xslDoc = new ActiveXObject("MSXML2.FreeThreadedDOMDocument.6.0");
				if (inline) {
					xslDoc.loadXML(xml);
				} else {
					xslDoc.async = false;
					xslDoc.load(xslt);
				}
				var xslTemplate = new ActiveXObject("MSXML2.XSLTemplate.6.0");
	      xslTemplate.stylesheet = xslDoc;
	      var xslProc = xslTemplate.createProcessor();
	      xslProc.input = xmlDoc;
				for (var i = 3, len = arguments.length-1; i < len ; i += 2) {
					xslProc.addParameter(arguments[i], arguments[i+1], "");
				}

				xslProc.transform();
				return xslProc.output;
	    };
	} else {
	    Core.transformText = function(xml, xslt, inline) {
				var parser = new DOMParser();
				var serializer = new XMLSerializer();
				var xmlDoc = parser.parseFromString(xml, "text/xml");
				var xsltDoc;
				if (inline) {
					xsltDoc = parser.parseFromString(xslt, "text/xml");
				} else {
					xsltDoc = document.implementation.createDocument("","",null);
					if (xsltDoc.load) {
						xsltDoc.async = false;
						xsltDoc.load(xslt);
					} else {
						var xhttp = new XMLHttpRequest();
						xhttp.open("GET", xslt, false);
						xhttp.send("");
						xslt = xhttp.responseText;
						xsltDoc = parser.parseFromString(xslt, "text/xml");
					}
				}
				var xsltProcessor = new XSLTProcessor();
				if (!Core.isMozilla) {
					xsltProcessor.setParameter(null, "xsltforms_caller", "true");
				}
				xsltProcessor.setParameter(null, "xsltforms_config", document.getElementById("xf-instance-config").xfElement.srcXML);
				xsltProcessor.setParameter(null, "xsltforms_debug", DebugMode+"");
				xsltProcessor.setParameter(null, "xsltforms_lang", Language);
				xsltProcessor.importStylesheet(xsltDoc);
				var resultDocument = xsltProcessor.transformToDocument(xmlDoc);
				return serializer.serializeToString(resultDocument);
	    };
	}

	Core.xsltsrc =
	 '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">'
	+'	<xsl:output method="xml" omit-xml-declaration="yes"/>'
	+'	<xsl:template match="@*[starts-with(name(),\'xsltforms_\')]" priority="1"/>'
	+'	<xsl:template match="@*|node()" priority="0">'
	+'	  <xsl:copy>'
	+'	    <xsl:apply-templates select="@*|node()"/>'
	+'	  </xsl:copy>'
	+'	</xsl:template>'
	+'</xsl:stylesheet>'
	;
	if (Core.isIE) {
		Core.createXMLDocument = function(xml) {
			var d = new ActiveXObject("Microsoft.XMLDOM");
			d.loadXML(xml);
			return d;
		}
		Core.selectSingleNode = function(xpath, node) {
			try {
				return node.selectSingleNode(xpath);
			} catch (e) {
				return null;
			}
		}
		Core.selectSingleNodeText = function(xpath, node) {
			try {
				return node.selectSingleNode(xpath).text;
			} catch (e) {
				return "";
			}
		}
		Core.xsltDoc = new ActiveXObject("Microsoft.XMLDOM");
		Core.xsltDoc.loadXML(Core.xsltsrc);
		Core.loadNode = function(dest, src) {
			var r = src.cloneNode(true);
			dest.parentNode.replaceChild(r, dest);
		}
		Core.loadXML = function(dest, xml) {
			var result = new ActiveXObject("Microsoft.XMLDOM");
			result.loadXML(xml);
			var r = result.documentElement.cloneNode(true);
			dest.parentNode.replaceChild(r, dest);
		}
		Core.saveXML = function(node) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.appendChild(node.documentElement ? node.documentElement.cloneNode(true) : node.cloneNode(true));
			return xmlDoc.transformNode(Core.xsltDoc);
		}
	} else {
		Core.createXMLDocument = function(xml) {
			return Core.parser.parseFromString(xml, "text/xml");
		}
		Core.selectSingleNode = function(xpath, node) {
			try {
				if (node.evaluate) {
					return node.evaluate(xpath, node, null, XPathResult.ANY_TYPE, null).iterateNext();
				} else {
					return node.ownerDocument.evaluate(xpath, node, null, XPathResult.ANY_TYPE, null).iterateNext();
				}
			} catch (e) {
				return null;
			}
		}
		Core.selectSingleNodeText = function(xpath, node) {
			try {
				if (node.evaluate) {
					return node.evaluate(xpath, node, null, XPathResult.ANY_TYPE, null).iterateNext().textContent;
				} else {
					return node.ownerDocument.evaluate(xpath, node, null, XPathResult.ANY_TYPE, null).iterateNext().textContent;
				}
			} catch (e) {
				return "";
			}
		}
		Core.parser = new DOMParser();
		Core.xsltDoc = Core.parser.parseFromString(Core.xsltsrc, "text/xml");
		Core.xsltProcessor = new XSLTProcessor();
		Core.xsltProcessor.importStylesheet(Core.xsltDoc);
		Core.serializer = new XMLSerializer();
		Core.loadNode = function(dest, src) {
			var r = src.cloneNode(true);
			dest.parentNode.replaceChild(r, dest);
		}
		Core.loadXML = function(dest, xml) {
			var result = Core.parser.parseFromString(xml, "text/xml");
			var r = result.documentElement.cloneNode(true);
			dest.parentNode.replaceChild(r, dest);
		}
		Core.saveXML = function(node) {
			var resultDocument = Core.xsltProcessor.transformToDocument(node);
			return Core.serializer.serializeToString(resultDocument);
		}
	}
	Core.unescape = function(xml) {
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

	Core.getMeta = function(node, meta) {
		return node.nodeType == NodeType.ELEMENT ? node.getAttribute("xsltforms_"+meta) : node.ownerElement ? node.ownerElement.getAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta) : node.selectSingleNode("..").getAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta);	
	}

	Core.getBoolMeta = function(node, meta) {
		return Boolean(node.nodeType == NodeType.ELEMENT ? node.getAttribute("xsltforms_"+meta) : node.nodeType == NodeType.ATTRIBUTE ? node.ownerElement ? node.ownerElement.getAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta) :  node.selectSingleNode("..").getAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta) : false);
	}

	Core.setMeta = function(node, meta, value) {
	    if (node) {
		node.nodeType == NodeType.ELEMENT ? node.setAttribute("xsltforms_"+meta, value) : node.ownerElement ? node.ownerElement.setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value) : node.selectSingleNode("..").setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value);
	    }
	}

	Core.setBoolMeta = function(node, meta, value) {
	    if (node) {
		if (value) {
		    node.nodeType == NodeType.ELEMENT ? node.setAttribute("xsltforms_"+meta, value) : node.ownerElement ? node.ownerElement.setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value) : node.selectSingleNode("..").setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value);
		} else {
		    node.nodeType == NodeType.ELEMENT ? node.removeAttribute("xsltforms_"+meta) : node.ownerElement ? node.ownerElement.removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta) : node.selectSingleNode("..").removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta);
		}
	    }
	}

	Core.setTrueBoolMeta = function(node, meta) {
	    if (node) {
		node.nodeType == NodeType.ELEMENT ? node.setAttribute("xsltforms_"+meta, true) : node.ownerElement ? node.ownerElement.setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, true) : node.selectSingleNode("..").setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, true);
	    }
	}

	Core.setFalseBoolMeta = function(node, meta) {
	    if (node) {
		node.nodeType == NodeType.ELEMENT ? node.removeAttribute("xsltforms_"+meta) : node.ownerElement ? node.ownerElement.removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta) : node.selectSingleNode("..").removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta);
	    }
	}

	if (!Core.isIE) {
		if (typeof XMLDocument == "undefined") {
			XMLDocument = Document;
		}
	  XMLDocument.prototype.selectNodes = function(path, single, node) {
			var r = this.evaluate(path, (node ? node : this), this.createNSResolver(this.documentElement), (single ? XPathResult.FIRST_ORDERED_NODE_TYPE : XPathResult.ORDERED_NODE_SNAPSHOT_TYPE), null);
			if (single) {
				return r.singleNodeValue ? r.singleNodeValue : null;
			}
			for (var i = 0, len = r.snapshotLength, r2 = []; i < len; i++) {
				r2.push(r.snapshotItem(i));
			}
			return r2;
		}
		XMLDocument.prototype.selectSingleNode = function(path) {
			return this.selectNodes(path, true);
		}
		XMLDocument.prototype.createNode = function(t, name, ns) {
			switch(t) {
				case NodeType.ELEMENT:
					return this.createElementNS(ns, name);
					break;
				case NodeType.ATTRIBUTE:
					return this.createAttributeNS(ns, name);
					break;
				default:
					return null;
			}
		}
		Element.prototype.selectNodes = function(path) {
			return this.ownerDocument.selectNodes(path, false, this);
		}
		Element.prototype.selectSingleNode = function(path) {	
			return this.ownerDocument.selectNodes(path, true, this);
		}
	}

			

	var DebugConsole = {
	    element_ : null,
	    isInit_ : false,
	    time_ : 0,
	    init_ : function() {
	        this.element_ = document.getElementById("console");
	        this.isInit_ = true;
	        this.time_ = new Date().getTime();
	    },

			

	    write : function(text) {
	        if (this.isOpen()) {
	            var time = new Date().getTime();
	            var msg = time - this.time_ + " -> " + text;
	            this.element_.appendChild(document.createTextNode(msg));
	            console.log(msg);
	            Core.createElement("br", this.element_);
	            this.time_ = time;
	        }
	    },

			

	    clear : function() {
	        if (this.isOpen()) {
	            while (this.element_.firstChild) {
	                this.element_.removeChild(this.element_.firstChild);
	            }

	            this.time_ = new Date().getTime();
	        }
	    },
	    isOpen : function() {
	        if (!this.isInit_) {
	            this.init_();
	        }
	        
	        return this.element_ != null;
	    }
	};

	var NumberList = function(parent, className, input, min, max, minlengh, xform) {
	    this.xform = xform;
	    var Event = this.xform.getEventManager();
	    this.element = Core.createElement("ul", parent, null, className);
	    this.move = 0;
	    this.input = input;
	    this.min = min;
	    this.max = max;
	    this.minlength = minlengh || 1;
	    var list = this;

	    this.createChild("+", function() { list.start(1); }, function() { list.stop(); } );

	    for (var i = 0; i < 7; i++) {
	        this.createChild(" ", function(event) {
	            list.input.value = Event.getTarget(event).childNodes[0].nodeValue;
	            list.close();
	            Event.dispatch(list.input, "change");
	        } );
	    }
	    
	    this.createChild("-", function() { list.start(-1); }, function() { list.stop(); } );
	};

	NumberList.prototype.show = function() {
		var input = this.input;
	    this.current = parseInt(input.value);
	    this.refresh();
	    this.xform.getDialog().show(this.element, input, false);
	};

	NumberList.prototype.close = function() {
	    this.xform.getDialog().hide(this.element, false);
	}; 
	
	NumberList.prototype.createChild = function(content, handler, handler2) {
	    var Event = this.xform.getEventManager();
	    var child = Core.createElement("li", this.element, content);
	    Core.initHover(Event, child);

	    if (handler2) {
	        Event.attach(child, "mousedown", handler);
	        Event.attach(child, "mouseup", handler2);
	    } else {
	        Event.attach(child, "click", handler);
	    }
	};
	    
	NumberList.prototype.refresh = function()  {
	    var childs = this.element.childNodes;
	    var cur = this.current;
	    
	    if (cur >= this.max - 3) {
	        cur = this.max - 3;
	    } else if (cur <= this.min + 3) {
	    	cur = this.min + 3;
	    }
	    
	    var top = cur + 4;

	    for (var i = 1; i < 8; i++) {
	        Core.setClass(childs[i], "hover", false);
	        var str = (top - i) + "";
	        
	        for (; str.length < this.minlength; str = '0' + str) {}
	        
	        childs[i].firstChild.nodeValue = str;
	    }
	};

	NumberList.prototype.start = function(value) {
	    this.move = value;
	    NumberList.current = this;
	    this.run();
	};
	    
	NumberList.prototype.stop = function() {
	    this.move = 0;
	};

	NumberList.prototype.run = function() {
	    if (   (this.move > 0 && this.current + 3 < this.max)
	        || (this.move < 0 && this.current - 3> this.min)) {
	        this.current += this.move;
	        this.refresh();
	        var list = this;
	        setTimeout("NumberList.current.run()", 60);
	    }
	};

	NumberList.current = null;


			

	function forEach(object, block) {
	    var args = [];
	   
	    for (var i = 0, len = arguments.length - 2; i < len; i++) {
	        args[i] = arguments[i + 2];
	    }

	    if (object) {
	        if (typeof object.length == "number") {
	            for (var j = 0, len1 = object.length; j < len1; j++) {
	            	var obj = object[j];
	            	var func = typeof block == "string"? obj[block] : block;
	                func.apply(obj, args);
	            }
	        } else {
	            for (var key in object) {
	            	var obj2 = object[key];
	            	var func2 = typeof block == "string"? obj2[block] : block;
	                func2.apply(obj2, args);
	            }   
	        }
	    }
	}


			

	function assert(condition, message) {
	    if (!condition && DebugConsole.isOpen()) {
	        DebugConsole.write("Assertion failed: " + message);
	        var callstack = null;

	        if (arguments.caller) { // Internet Explorer
	            this.callstack = [];
	    
	            for (var caller = arguments.caller; caller != null; caller = caller.caller) {
	                this.callstack.push(caller.name ? caller.name : "<anonymous>");
	            }
	        } else {
	            try {
	                var x; x.y;
	            } catch (exception) {
	                this.callstack = exception.stack.split("\n");
	            }
	        }

	        if (this.callstack) {
	            for (var i in this.callstack) {
	                DebugConsole.write("> " + this.callstack[i]);
	            }
	        }

	        throw message;
	    }
	}


			

	function inArray(value, array) {
	    for (var i = 0, len = array.length; i < len; i++) {
	        if (value == array[i]) {
	            return true;
	        }
	    }
	    
	    return false;
	}


			

	function zeros(value, length, right) {
		var res = "" + value;

		for (; res.length < length; res = right? res + '0' : '0' + res) {}

		return res;
	}

	function getId(element) {
		if(element.id) {
			return element.id;
		} else {
			return element.parentNode.parentNode.parentNode.parentNode.id;
		}
	}

	function show(el, type, value) {
		el.parentNode.lastChild.style.display = value? 'inline' : 'none';
	}


			

	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/, '');
	};


			

	function copyArray(source, dest) {
		if( dest ) {
			for (var i = 0, len = source.length; i < len; i++) {
				dest[i] = source[i];
			}
		}
	}

			

	function removeArrayItem(array, item) {
		var narr = [];
		for (var i = 0, len = array.length; i < len; i++) {
			if (array[i] != item ) {
				narr.push(array[i]);
			}
		}
		return narr;
	}
	

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

		    var xmlValue = null;
		    if (Core.isIE) {
			xmlValue = function(node) {
			    return node.text;
			};
		    } else {
			xmlValue = function(node) {
			    return node.textContent;
			};
		    }

			
	function stringValue(value) {
		return typeof value != "object"? "" + value
				: (value.length === 0? "" : xmlValue(value[0]));
	}

	function booleanValue(value) {
		return typeof value == "undefined"? false
				: (typeof value.length != "undefined"? value.length > 0 : !!value);
	}
	var nbvalcount = 0;
	function numberValue(value) {
	if (typeof value == "boolean") {
	    return 'A' - 0;
	} else {
	    var v = typeof value == "object"?  stringValue(value) : value;
	    return v === '' ? NaN : v - 0;
	}
	}

	function nodeSetValue(value) {
	if (typeof value != "object") {
	        throw {name: this, message: Error().stack};
	}

	return value;
	}

	function xmlResolveEntities(s) {
	var parts = stringSplit(s, '&');
	var ret = parts[0];

	for (var i = 1, len = parts.length; i < len; ++i) {
	        var p = parts[i];
	        var index = p.indexOf(";");
	        
	        if (index == -1) {
		ret += parts[i];
		continue;
	        }
	        
	        var rp = p.substring(0, index);
	        var ch;

	        switch (rp) {
	        case 'lt': ch = '<'; break;
	        case 'gt': ch = '>'; break;
	        case 'amp': ch = '&'; break;
	        case 'quot': ch = '"'; break;
	        case 'apos': ch = '\''; break;
	        case 'nbsp': ch = String.fromCharCode(160);  break;
	        default:
	            var span = Core.createElementByName(document, 'span') ;
	            span.innerHTML = '&' + rp + '; ';
	            ch = span.childNodes[0].nodeValue.charAt(0);
	        }

	        ret += ch + p.substring(index + 1);
	}

	return ret;
	}

	function stringSplit(s, c) {
	var a = s.indexOf(c);

	if (a == -1) {
	        return [ s ];
	}

	var parts = [];
	parts.push(s.substr(0,a));

	while (a != -1) {
	        var a1 = s.indexOf(c, a + 1);

	        if (a1 != -1) {
		parts.push(s.substr(a + 1, a1 - a - 1));
	        } else {
		parts.push(s.substr(a + 1));
	        } 

	        a = a1;
	}

	return parts;
	}		

	function validate_(node) {
		if (Core.getBoolMeta(node, "notvalid")) {
			return false;
		}
		var atts = node.attributes || [];
		for (var i = 0, len = atts.length; i < len; i++) {
			if (!this.validate_(atts[i])) {
				return false;
			}
		}
		var childs = node.childNodes || [];
		for (var i = 0, len = childs.length; i < len; i++) {
			if (!this.validate_(childs[i])) {
				return false;
		}
		}
		return true;
	}

	var XFProcessor = {
	    error : function(element, type, value) {
	        alert(type+": "+value);
	    }
	};
