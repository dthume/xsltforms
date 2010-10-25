dojo.provide("xsltforms.XFormEngine");

dojo.require("xsltforms.XForm");

(function() {
    
    dojo.declare("xsltforms.XFormSession", null, {
        constructor: function(args) {
            this._xforms = {};
            this._parentEngine = args.parent;
            if (!!args.configBaseURI) {
                this._configBaseURI = args.configBaseURI;
            }
            this._pane = args.pane;
        },
        
        getConfigBaseURI: function() {
            return this._configBaseURI || this._parentEngine.getConfigBaseURI();
        },
        
        createXForm: function(args) {
            var id = args.id;
            var onClose = dojo.hitch(this, function() {
                if (!this._isClosing) {
                    this.destroyXForm(id);
                    this.removeXForm(id);
                }
            });
            
            var xform = this._parentEngine.createXForm(dojo.mixin({
                engine: this,
                onClose: onClose
            }, args));
            this._xforms[id] = xform;
            return xform;
        },
        
        getXForm: function(id) {
            return this._xforms[id];
        },

        removeXForm: function(id) {
            var old = this._parentEngine.removeXForm(id);
            delete this._xforms[id];
            return old;
        },

        destroyXForm: function(id) {
            this._parentEngine.destroyXForm(id);
        },

        destroy: function() {
            if (this._isClosed || this._isClosing) return;

            this._isClosing = true;

            for (ii in this._xforms) {
                this.destroyXForm(ii);
                this.removeXForm(ii);
            }
            delete this._xforms;

            this._parentEngine = null;
            this._pane = null;
            
            this._isClosed = true;
            this._isClosing = false;
        },
        
        setLocation: function(href) {
            this._pane.attr("href", href);
        },
        setContent: function(content) {
            this._pane.attr("content", content);
        },
        getRootNode: function() {
            return this._pane.domNode;
        },
        query: function(query) {
            return dojo.query(query, this.getRootNode());
        },

        // DEV only

        logMessage: function(msg) {
            console.log(msg);
        }
    });
    
    dojo.declare("xsltforms.XFormEngine", null, {
        constructor: function(args) {
            this.xforms = { };
            this._isClosing = false;
            this._isClosed = false;
        },
        
        getRootNode: function() {
            return window.document.documentElement;
        },
        
        getConfigBaseURI: function() {
            return "/up/xslf/"; // FIXME
        },
        
        setLocation: function(href) {
            window.location = href;
        },
        
        setContent: function(content) {
            if(document.write) {
                document.write(content);
                document.close();
            } else {
                if (content.indexOf("<?", 0) === 0) {
                    content = content.substr(content.indexOf("?>")+2);
                }
                document.documentElement.innerHTML = content;
            }
        },
        
        query: function(query) {
            return dojo.query(query);
        },
        
        createSession: function(args) {
            var parent = this;
            var merged = {
                parent: parent
            };
            dojo.mixin(merged, args);
            return new xsltforms.XFormSession(merged);
        },
        
        createXForm: function(args) {
            var id = args.id;
            var oldForm = this.xforms[id];
            if (oldForm) oldForm.destroy();

            var onClose = dojo.hitch(this, function() {
                if (!this._isClosing) {
                    this.destroyXForm(id);
                    this.removeXForm(id);
                }
            });
            
            var merged = {
                    engine: this,
                    onClose: onClose
            };
            dojo.mixin(merged, args);
            
            this.xforms[id] = new xsltforms.XForm(merged);
            return this.xforms[id];
        },

        getXForm: function(id) {
            return this.xforms[id];
        },

        removeXForm: function(id) {
            var old = this.xforms[id];
            if (old) this.xforms[id] = null;
            return old;
        },

        destroyXForm: function(id) {
            var xform = this.xforms[id];
            if (xform && xform.destroy) xform.destroy();
        },

        destroy: function() {
            if (this._isClosed || this._isClosing) return;

            this._isClosing = true;

            for (ii in this.xforms) {
                this.destroyXForm(ii);
                this.removeXForm(ii);
            }
            delete this.xforms;

            this._isClosed = true;
            this._isClosing = false;
        },

        // DEV only

        logMessage: function(msg) {
            console.log(msg);
        }
    });
    
    xsltforms.ENGINE = new xsltforms.XFormEngine({});
})();
