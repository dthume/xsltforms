dojo.require("xsltforms");

dojo.require("xsltforms.Binding");
dojo.require("xsltforms.ConfigManager");
dojo.require("xsltforms.DebugConsole");
dojo.require("xsltforms.Dialog");
dojo.require("xsltforms.DojoElementFactory");
dojo.require("xsltforms.EventManager");
dojo.require("xsltforms.I8NManager");
dojo.require("xsltforms.IdManager");
dojo.require("xsltforms.Listener");
dojo.require("xsltforms.NodeType");
dojo.require("xsltforms.schema");
dojo.require("xsltforms.WidgetFactory");
dojo.require("xsltforms.XMLEventManager");
dojo.require("xsltforms.xpath");

(function() {

	var XHTML_NS = "http://www.w3.org/1999/xhtml";

	var NodeType = xsltforms.NodeType;

	function factory(xform, ElementType) {
		return function(args) {
			var newArgs = {xform: xform};
			dojo.mixin(newArgs, args);
			return new ElementType(newArgs);
		};
	}

	dojo.declare("xsltforms.XForm", null, {
		constructor: function(args) {
	        this.id = args.id;
	        this._engine = args.engine;
	        
	        this._isClosed = false;
	        this._isClosing = false;
	        this._onClose = args.onClose;
	        
	        // From var xforms
	        this.cont = 0;
	        this.ready = false;
	        this.body = null;
	        this.models = [];
	        this.defaultModel = null;
	        this.changes = [];
	        this.newChanges = [];
	        this.building = false;
	        this.posibleBlur = false;
	        this.bindErrMsgs = []; // binding-error messages gathered during refresh

	        this.isXhtml = false;
	        
	        var thisForm = this;
	        function newXFObject(TargetClass, args) {
	            var ctxt = {xform: thisForm};
	            if (args) dojo.mixin(ctxt, args);
	            return new TargetClass(ctxt);
	        }

	        this._configManager = newXFObject(xsltforms.ConfigManager);
	        this._i8n = newXFObject(xsltforms.I8NManager);
	        this._debugConsole = newXFObject(xsltforms.DebugConsole);
	        this._elementFactory = new xsltforms.DojoElementFactory(this);
	        this._eventManager = new xsltforms.EventManager();
	        this._xmlEventManager = newXFObject(xsltforms.XMLEventManager);
	        this._idManager = new xsltforms.IdManager();
	        this._dialog = newXFObject(xsltforms.Dialog);
	        this._schemaManager = newXFObject(xsltforms.schema.SchemaManager);
	        this._xpath = newXFObject(xsltforms.xpath.XPathFactory);
	        this._widgetRegistry = xsltforms.GLOBAL_WIDGET_REGISTRY;
		
	        this.dispatch = dojo.hitch(this._xmlEventManager,
	                this._xmlEventManager.dispatch);

	        this.Binding = factory(this, xsltforms.Binding);
	        this.Listener = factory(this, xsltforms.Listener);
	    },
	    
	    getContainingModel: function(node) {
	        var doc = node.documentElement ?
	                node.documentElement : node.ownerDocument.documentElement;
	        
	        return this.getElementById(Core.getMeta(doc, "model")).xfElement;
	    },
	
	    query: function(qs) {
	        return this._engine.query(qs);
	    },
	    
	    setContent: function(content) {
	        this._engine.setContent(content);
	    },
	    
	    setLocation: function(href) {
            this._engine.setLocation(href);
        },

	    destroy: function() {
	        console.log("Shutting down xform %s", this.id);
	        this.close();
	        this.id = null;
	    },
	    
	    getConfigBaseURI: function() {
	        return this._configBaseURI || this._engine.getConfigBaseURI();
	    },
	    
	    getConfigManager: function() { return this._configManager; },
	    getI8N: function() { return this._i8n; },
	    getDialog: function() { return this._dialog; },
	    getElementFactory: function() { return this._elementFactory; },
	    getXMLEventManager: function() { return this._xmlEventManager; },
	    getEventManager: function() { return this._eventManager; },
	    getIdManager: function() { return this._idManager; },
	    getSchemaManager: function() { return this._schemaManager; },
	    getXPath: function() { return this._xpath; },
	    getWidgetRegistry: function() { return this._widgetRegistry; },
	    
	    getHeader: function() {
	        return this.query(".xforms-xform > div.xforms-pseudo-header")[0];
	    },
	
	    getElementById: function(id) { return dojo.byId(id); },
	    
	    getElementByXFormId: function(id) {
	        return dojo.byId(this.id + "-" + id);
	    },
	    
	    getElementsByTagName: function(element, tagName) {
	        return this.isXhtml ?
	                element.getElementsByTagNameNS(XHTML_NS, tagName)
	                : element.getElementsByTagName(tagName);
	    },
	    
	    executeInAction: function(fn) {
	        this.openAction();
            fn(this);
            this.closeAction();
	    },

	    //// FIXME - names

	    createElementByName: function(doc, tagName) {
	        return this.isXhtml ?
	                doc.createElementNS(XHTML_NS, tagName)
	                : doc.createElement(tagName);
	    },

	    createElement : function(type, parent, content, className) {
	        var el = Core.createElementByName(document, type);
	        if (className) { el.className = className; }
	        if (parent) { parent.appendChild(el); }
	        if (content) { el.appendChild(document.createTextNode(content)); }
	        return el;
	    },

	    //// END FIXME

	    // FIXME - Don't use document; use component uri
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

	    // Utility

	    setValue: function(node, value) {
	        assert(node);
	        if (node.nodeType == NodeType.ATTRIBUTE) {
	            node.nodeValue = value;
	        } else if (Core.isIE && node.innerHTML) {
	            node.innerHTML = value;
	        } else if (node.firstChild) {
	            node.firstChild.nodeValue = value;
	        } else {
	            node.appendChild(node.ownerDocument.createTextNode(value));
	        }
	    },

	    // From var xforms

	    init: function() {
	        this.rootNode = this._engine.getRootNode();
	        var xform = this;
	        this.setValue(this.getElementById("statusPanel"),
	                this._i8n.get("status"));
	        
	        var b = dojo.query(".xforms-xform", this._engine.getRootNode())[0];
	        this.body = b;
	        var Event = this.getEventManager();
	        Event.attach(b, "click", function(evt) {
	            var target = Event.getTarget(evt);
	            var parent = target;
	            
	            while (parent.nodeType == NodeType.ELEMENT) {
	                if (Core.hasClass(parent, "xforms-repeat-item")) {
	                    xform.selectItem(parent);
	                }
	                parent = parent.parentNode;
	            }
	            
	            parent = target;
	            while (parent.nodeType == NodeType.ELEMENT) {
	                var xf = parent.xfElement;
	                
	                if (xf) {
	                    if(typeof parent.node != "undefined" && parent.node != null && xf.focus && !Core.getBoolMeta(parent.node, "readonly")) {
	                        var name = target.nodeName.toLowerCase();
	                        xf.focus(name == "input" || name == "textarea");
	                    }
	                    if(xf.click) {
	                        xf.click(target);
	                        break;
	                    }
	                }
	                
	                parent = parent.parentNode;
	            }
	        });

	        this.openAction();
	        this._xmlEventManager.dispatchList(this.models, "xforms-model-construct");
	        this._xmlEventManager.dispatchList(this.models, "xforms-ready");
	        this.refresh();
	        this.closeAction();
	        this.ready = true;
	        this._dialog.hide("statusPanel", false);
	    },

	    close: function() {
	        if (this._isClosing || this._isClosed) return;
	        
	        this._isClosing = true;
	        if (this._onClose) {
	            this._onClose();
	        }
	        if (this.body) {
	            this.openAction();
	            this._xmlEventManager.dispatchList(this.models, "xforms-model-destruct");
	            this.closeAction();
	            this._idManager.clear();
			    this.defaultModel = null;
			    this.changes = [];
			    this.models = [];
			    this.body = null;
			    this.cont = 0;
			    this.dispose(this._engine.getRootNode());
			    this._eventManager._flush();
			    /*
			    var Event = this.getEventManager();
			    if (Event._cache)
				for (var i = Event._cache.length - 1; i >= 0; i--) {
				  var item = Event._cache[i];
			      Event.detach(item[0], item[1], item[2], item[3]);
				}
			    */
			    this.ready = false;
			    this.building = false;
			    this.posibleBlur = false;
	        }
	        
	        this._isClosed = true;
	        this._isClosing = false;
	    },

	    openAction: function() {
	        if (this.cont++ == 0) {
	            DebugConsole.clear();
	        }
	    },

	    closeAction: function() {
	        if (this.cont == 1) {
	            this.closeChanges();
	        }

	        this.cont--;
	    },

	    closeChanges: function() {
	        var changes = this.changes;
	        
	        for (var i = 0, len = changes.length; i < len; i++) {
	            var change = changes[i];
	            
	            if (change.instances) {//Model
	                if (change.rebuilded) {
	                    this.dispatch(change, "xforms-rebuild");
	                } else {
	                    this.dispatch(change, "xforms-recalculate");
	                }
	            } else { // Repeat or tree
	            }
	        }

	        if (changes.length > 0) {
	            this.refresh();
	            
	            if (this.changes.length > 0) {
	                this.closeChanges();
	            }
	        }
	    },
	    
	    error: function(element, event, message, causeMessage) {
	        var Dialog = this._dialog;
	        Dialog.hide("statusPanel", false);
	        
	        this.setValue(this.getElementById("statusPanel"), message);
	        Dialog.show("statusPanel", null, false);

	        if (element != null) {
	            this.dispatch(element, event);
	        }
	        
	        if (causeMessage) {
	            message += " : " + causeMessage;
	        }
	        
	        DebugConsole.write("Error: " + message);
	        throw event;        
	    },

	    refresh: function() {
	        this.building = true;
	        this.build(this.body, (this.defaultModel.getInstanceDocument() ? this.defaultModel.getInstanceDocument().documentElement : null), true);
	        
	        if (this.newChanges.length > 0) {
	            this.changes = this.newChanges;
	            this.newChanges = [];
	        } else {
	            this.changes.length = 0;
	        }

	        for (var i = 0, len = this.models.length; i < len; i++) {
	            var model = this.models[i];
	            
	            if (model.newNodesChanged.length > 0 || model.newRebuilded) {
	                model.nodesChanged = model.newNodesChanged;
	                model.newNodesChanged = [];
	                model.rebuilded = model.newRebuilded;
	                model.newRebuilded = false;
	            } else {
	                model.nodesChanged.length = 0;
	                model.rebuilded = false;
	            }
	        }

	        this.building = false;
	        
	        // Throw any gathered binding-errors.
	        //
	        if (this.bindErrMsgs.length) {
	            this.error(this.defaultModel, "xforms-binding-exception",	"Binding Errors: \n" + this.bindErrMsgs.join("\n  "));
	            this.bindErrMsgs = [];
	        }
	    },

	    build: function(element, ctx, selected) {
	        if (element.nodeType != NodeType.ELEMENT
	                || element.id == "console" || element.hasXFElement == false) { return; }
	        var xf = element.xfElement;
	        var hasXFElement = !!xf;

	        //if (!ctx) { alert("xforms.build " + element.id + " no ctx"); }
	        
	        if (xf) {
	            xf.build(ctx);

	            if (xf.isRepeat) {
	                xf.refresh(selected);
	            }
	        }

	        ctx = element.node || ctx;
	        var childs = element.childNodes;
	        var sel = element.selected;

	        if (typeof sel != "undefined") {
	            selected = sel;
	        }

	        if (!xf || !xf.isRepeat || xf.nodes.length > 0) {
	            for (var i = 0; i < childs.length && this.building; i++) {
	                hasXFElement = (childs[i].nodeType == NodeType.ELEMENT && !childs[i].getAttribute("cloned") ? this.build(childs[i], ctx, selected) : false) || hasXFElement;
	            }
	        } 

	        if(this.building) {
	            if (xf && xf.changed) {
	                xf.refresh(selected);
	                xf.changed = false;
	            }

	            if (element.hasXFElement == null) {
	                element.hasXFElement = hasXFElement;
	            }
	        }

	        return hasXFElement;
	    },

	    addChange: function(element) {
	        var list = this.building? this.newChanges : this.changes;
	        
	        if (!inArray(element, list)) {
	            list.push(element);
	        }
	    },

	    dispose: function(element) {
	        if (element.nodeType != NodeType.ELEMENT
	                || element.id == "console") {
	            return;
	        }
	        
	        element.listeners = null;
	        element.node = null;
	        var xf = element.xfElement;
	        
	        if (xf) {
	            xf.dispose();
	        }

	        var childs = element.childNodes;
	        
	        for (var i = 0; i < childs.length; i++) {
	            this.dispose(childs[i]);
	        }
	    },

	    blur: function(direct) {
	        if ((direct || this.posibleBlur) && this.focus) {
	            if(this.focus.element) {
	                this.openAction();
	                this.dispatch(this.focus, "DOMFocusOut");
	                Core.setClass(this.focus.element, "xforms-focus", false);
	                this.focus.blur();
				    this.closeAction();
	            }

	            this.posibleBlur = false;
	            this.focus = null;
	        }
	    },

	// From XFRepeat

	    initClone: function(element) {
	        var id = element.id;

	        if (id) {
	            this.getIdManager().cloneId(element);
	            var oldid = element.getAttribute("oldid");
	            var original = this.getElementById(oldid);
	            var xf = original.xfElement;
	            
	            if (xf) {
	                xf.clone(element.id);
	            }
	            
	            var listeners = original.listeners;
	            
	            if (listeners && !Core.isIE) {
	                for (var i = 0, len = listeners.length; i < len; i++) {
	                    listeners[i].clone(element);
	                }
	            }
	        }
	        
	        var next = element.firstChild;
	        
	        while (next) {
	            var child = next;
	            next = next.nextSibling;
	            
	            if (child.id && child.getAttribute("cloned")) {
	                element.removeChild(child);
	            } else {
	                this.initClone(child);
	            }
	        }
	    },
	    
	    selectItem: function(element) {
	        var par = element.parentNode;
	        
	        if (par) {
	            var repeat = par.xfElement? par : par.parentNode;
	            var childs = par.childNodes;
	            assert(repeat.xfElement, element.nodeName +  " - " + repeat.nodeName);
	            
	            for (var i = 0, len = childs.length; i < len; i++) {
	                if (childs[i] == element) {
	                    repeat.xfElement.setIndex(i + 1);
	                    break;
	                }
	            }
	        }
	    },
	
	    // From "core"
	    run: function(action, element, evt, synch, propagate) {
	        var Dialog = this._dialog;
	        if (synch) {
	            Dialog.show("statusPanel", null, false);
	            
	            var fn = dojo.hitch(this, function() { 
	                this.openAction();
	                action.execute(this._idManager.find(element), null, evt);
	                Dialog.hide("statusPanel", false);
	                if (!propagate) {
	                    evt.stopPropagation();
	                }
	                this.closeAction();
	            });
			
	            setTimeout(fn, 1 );
	        } else {
	            this.openAction();
	            action.execute(this._idManager.find(element), null, evt);
	            if (!propagate) {
	                evt.stopPropagation();
	            }
	            this.closeAction();
	        }
	    }
	});
})();

dojo.provide("xsltforms.XForm");