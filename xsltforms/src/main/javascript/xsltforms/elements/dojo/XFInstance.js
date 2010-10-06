dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFCoreElement");

(function() {

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
	
    dojo.declare(
            "xsltforms.elements.dojo.XFInstance",
            xsltforms.elements.dojo.XFCoreElement,
	{
	    constructor: function(args) {
		    this.init(args.id, args.model, "xforms-instance");
		    this.src = args.src;
		    this.srcXML = Core.unescape(args.srcXML);
		    this.model = args.model;
		    this.doc = Core.createXMLDocument("<dummy/>");
		    Core.setMeta(this.doc.documentElement, "instance", args.id);
		    Core.setMeta(this.doc.documentElement, "model", args.model.element.id);
		    args.model.addInstance(this);
	    },
	    
	    dispose: function() {
	        this.inherited(arguments);
	        this.xform.getXPath().XNode.recycle(this.old);
	        this.xform.getXPath().XNode.recycle(this.doc);
	    },

	    construct: function() {
	        if (!this.xform.ready) {
	            if (this.src) {
	                var cross = false;
	                if (this.src.match(/^[a-zA-Z0-9+.-]+:\/\//)) {
	                    var domain = /^([a-zA-Z0-9+.-]+:\/\/[^\/]*)/;
	                    var sdom = domain.exec(this.src);
	                    var ldom = domain.exec(document.location.href);
	                    cross = sdom[0] != ldom[0];
	                }
	                if (cross) {
	                    this.setDoc('<dummy xmlns=""/>');
	                    jsoninstobj = this;
	                    var scriptelt = Core.createElementByName(document, "script");
	                    scriptelt.setAttribute("src", this.src+"&callback=jsoninst");
	                    scriptelt.setAttribute("id", "jsoninst");
	                    scriptelt.setAttribute("type", "text/javascript");
	                    var body = Core.getElementsByTagName(document, "body")[0];
	                    body.insertBefore(scriptelt, body.firstChild);
	                } else {
	                    try {
	                        var req = Core.openRequest("GET", this.src, false);
	                        DebugConsole.write("Loading " + this.src);
	                        req.send(null);
	                        if (req.status != 200 && req.status != 0) {
	                            throw "Request error: " + req.status;
	                        }
	                        this.setDoc(req.responseText);
	                    } catch(e) {
	                        this.xform.error(this.element,
	                                "xforms-link-exception",
	                                "Fatal error loading " + this.src,
	                                e.toString());
	                    }
	                }
	            } else {
	                this.setDoc(this.srcXML);
	            }
	        }
	    },

	    reset: function() {
	        this.setDoc(this.oldXML, true);
	    },

	    store: function(isReset) {
	        if (this.oldXML && !isReset) {
	            this.oldXML = null;
	        }
	        this.oldXML = Core.saveXML(this.doc.documentElement);
	    },

	    setDoc: function(xml, isReset, preserveOld) {
	        var instid = Core.getMeta(this.doc.documentElement, "instance");
	        var modid = Core.getMeta(this.doc.documentElement, "model");
	        Core.loadXML(this.doc.documentElement, xml);
	        Core.setMeta(this.doc.documentElement, "instance", instid);
	        Core.setMeta(this.doc.documentElement, "model", modid);
	        if (!preserveOld) {
	            this.store(isReset);
	        }
	    },

	    revalidate: function() {
	        this.validation_(this.doc.documentElement);
	    },

	    validation_: function(node, readonly, notrelevant) {
	        if (readonly == null) { readonly = false; }
	        if (notrelevant == null) { notrelevant = false; }

	        this.validate_(node, readonly, notrelevant);
	        readonly = Core.getBoolMeta(node, "readonly");
	        notrelevant = Core.getBoolMeta(node, "notrelevant");
	        var atts = node.attributes || [];

	        if (atts) {
	            for (var i = 0, len = atts.length; i < len; i++) {
	                if (atts[i].nodeName.substr(0,10) != "xsltforms_") {
	                    this.validation_(atts[i], readonly, notrelevant);
	                }
	            }
	        }
		
	        for (var j = 0, len1 = node.childNodes.length; j < len1; j++) {
	            var child = node.childNodes[j];
	            
	            if (child.nodeType == NodeType.ELEMENT) {
	                this.validation_(child, readonly, notrelevant);
	            }
	        }
	    },

	    validate_: function(node, readonly, notrelevant) {
	        var bindid = Core.getMeta(node, "bind");
	        var value = xmlValue(node);
	        var Schema = this.xform.getSchemaManager();
	        var ExprContext = this.xform.getXPath().ExprContext;
	        var schtyp = Schema.getType(Core.getMeta(node, "type") || "xsd_:string");
	        if (bindid) {
	            var bind = this.xform.getElementById(bindid).xfElement;
	            var nodes = bind.nodes;
	            var i = 0;
	            for (var len = nodes.length; i < len; i++) {
	                if (nodes[i] == node) {
	                    break;
	                }
	            }
	            var ctx = new ExprContext(node, i, nodes);
	            if (bind.required) {
	                this.setProperty_(node, "required", booleanValue(bind.required.evaluate(ctx)));
	            }
	            this.setProperty_(node, "notrelevant", notrelevant || !(bind.relevant? booleanValue(bind.relevant.evaluate(ctx)) : true));
	            this.setProperty_(node, "readonly", readonly || (bind.readonly? booleanValue(bind.readonly.evaluate(ctx)) : bind.calculate ? true : false));
	            this.setProperty_(node, "notvalid",
	                    !node.notrelevant && !(!(Core.getMeta(node, "required") == "true" && (!value || value == ""))
	                            && (!schtyp || schtyp.validate(value))
							    && (!bind.constraint || booleanValue(bind.constraint.evaluate(ctx)))));
	        } else {
	            this.setProperty_(node, "notrelevant", notrelevant);
	            this.setProperty_(node, "readonly", readonly);
	            this.setProperty_(node, "notvalid", schtyp && !schtyp.validate(value));
	        }
	    },

	    setProperty_: function (node, property, value) {
	        if (Core.getBoolMeta(node, property) != value) {
	            Core.setBoolMeta(node, property, value);
	            this.model.addChange(node);   
	        }
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFInstance");