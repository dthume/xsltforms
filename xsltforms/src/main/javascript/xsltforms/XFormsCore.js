dojo.require("xsltforms");

(function() {

	dojo.declare("xsltforms.XFormsCore", null, {
		fileName : "xsltforms.js",
		isOpera : navigator.userAgent.match(/\bOpera\b/) != null,
		isIE : navigator.userAgent.match(/\bMSIE\b/) != null
		&& navigator.userAgent.match(/\bOpera\b/) == null,
		isIE6 : navigator.userAgent.match(/\bMSIE 6.0/) != null,
		isMozilla : navigator.userAgent.match(/\bGecko\b/) != null,
		isFF2 : navigator.userAgent.match(/\bFirefox[\/\s]2.\b/) != null,
		isXhtml : document.documentElement.namespaceURI == "http://www.w3.org/1999/xhtml",

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

	initHover : function(element) {
		//var Event = this.xform.getEventManager();
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



	loadProperties : function(name) {
		this.ROOT = "/up/xsltforms/";
		if (!this.ROOT) {
			var scripts = Core.getElementsByTagName(document, "script");
			for (var i = 0, len = scripts.length; i < len; i++) {
				var src = scripts[i].src;
				if (src.indexOf(Core.fileName) != -1) {
					this.ROOT = src.replace(Core.fileName, "");
					break;
				}
			}
		}
		var uri = this.ROOT + name;
		var req = Core.openRequest("GET", uri, false);
		if (req.overrideMimeType) {
			req.overrideMimeType("application/xml");
		}
		try {        
			req.send(null);
		} catch(e) {
			alert("File not found: " + uri);
		}

		if (req.status == 200) {
			Core.loadNode(Core.config, Core.selectSingleNode('//properties', req.responseXML));
			Core.config = document.getElementById("xf-instance-config").xfElement.doc.documentElement;
			Core.setMeta(Core.config, "instance", "xf-instance-config");
			Core.setMeta(Core.config, "model", "xf-model-config");
			//this.xform.dispatch(properties.model, "xforms-rebuild");
			//xforms.refresh();
		}
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
	});

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
		node.nodeType == NodeType.ELEMENT ? node.setAttribute("xsltforms_"+meta, value) : node.ownerElement ? node.ownerElement.setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value) : node.selectSingleNode("..").setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value);	
	}

	Core.setBoolMeta = function(node, meta, value) {
		if (value) {
			node.nodeType == NodeType.ELEMENT ? node.setAttribute("xsltforms_"+meta, value) : node.ownerElement ? node.ownerElement.setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value) : node.selectSingleNode("..").setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, value);
		} else {
			node.nodeType == NodeType.ELEMENT ? node.removeAttribute("xsltforms_"+meta) : node.ownerElement ? node.ownerElement.removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta) : node.selectSingleNode("..").removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta);
		}
	}

	Core.setTrueBoolMeta = function(node, meta) {
		node.nodeType == NodeType.ELEMENT ? node.setAttribute("xsltforms_"+meta, true) : node.ownerElement ? node.ownerElement.setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, true) : node.selectSingleNode("..").setAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta, true);
	}

	Core.setFalseBoolMeta = function(node, meta) {
		node.nodeType == NodeType.ELEMENT ? node.removeAttribute("xsltforms_"+meta) : node.ownerElement ? node.ownerElement.removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta) : node.selectSingleNode("..").removeAttribute("xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta);
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

})();

dojo.provide("xsltforms.XFormsCore");