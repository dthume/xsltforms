dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFCoreElement");

(function() {

    dojo.declare(
            "xsltforms.elements.dojo.XFModel",
            xsltforms.elements.dojo.XFCoreElement,
	{
	    constructor: function(args) {
            var id = args.id;
            this.init(id, null, "xforms-model");
            this.instances = {};
            this.binds = [];
            this.nodesChanged = [];
            this.newNodesChanged = [];
            this.schemas = [];
            this.defaultInstance = null;
            this.defaultSubmission = null;
            this.xform.models.push(this);
            this.xform.defaultModel = this.xform.defaultModel || this;
            if (this.xform.getElementById(id)) {
                var el = this.xform.getElementById(id);
                el.getInstanceDocument = function(modid) {
                   return this.xfElement.getInstanceDocument(modid);
                };
                el.rebuild = function() {
                    return this.xfElement.rebuild();
                };
                el.recalculate = function() {
                    return this.xfElement.recalculate();
                };
                el.revalidate = function() {
                    return this.xfElement.revalidate();
                };
                el.refresh = function() {
                    return this.xfElement.refresh();
                };
                el.reset = function() {
                   return this.xfElement.reset();
                };
            }

            if (args.schemas) {
                var schemas = args.schemas.split(" ");
                for (var i = 0, len = schemas.length; i < len; i++) {
                    var founded = false;
                    var Schema = this.xform.getSchemaManager();
                    for (var sid in Schema.all) {
                        var schema = Schema.all[sid];
                            
                        if (schema.name == schemas[i]) {
                           this.schemas.push(schema);
                           founded = true;
                           break;
                        }
                    }
			
                    if (!founded) {
                       this.xform.error(this, "xforms-link-exception", "Schema " + schemas[i] + " not found");
                    }
                }
           }
        },

	    addInstance: function(instance) {
		this.instances[instance.element.id] = instance;
		this.defaultInstance = this.defaultInstance || instance;
	    },

	    addBind: function(bind) {
		this.binds.push(bind);
	    },

	    dispose: function() {
		this.instances = null;
		this.binds = null;
		this.defaultInstance = null;
		this.inherited(arguments);
	    },

	    getInstance: function(id) {
		return id? this.instances[id] : this.defaultInstance;
	    },

	    getInstanceDocument: function(id) {
		var instance = this.getInstance(id);
		return instance? instance.doc : null;
	    },

	    findInstance: function(node) {
		var doc = node.ownerDocument;
		for (var id in this.instances) {
		    var inst = this.instances[id];
		    if (doc == inst.doc) {
			return inst;
		    }
		}
		return null;
	    },

	    construct: function() {
		if (!this.xform.ready) {
		    forEach(this.instances, "construct");
		}
		this.xform.dispatch(this, "xforms-rebuild");
		this.xform.dispatch(this, "xforms-model-construct-done");
	    },

	    reset: function() {
		forEach(this.instances, "reset");
		this.setRebuilded(true);
		this.xform.addChange(this);
	    },

	    rebuild: function() {
		if (this.xform.ready) {
		    this.setRebuilded(true);
		}
		forEach(this.binds, "refresh");
		this.xform.dispatch(this, "xforms-recalculate");
	    },

	    recalculate: function() { 
		forEach(this.binds, "recalculate");
		this.xform.dispatch(this, "xforms-revalidate");
	    },

	    revalidate: function() {
		forEach(this.instances, "revalidate");
		if (this.xform.ready) {
		    this.xform.dispatch(this, "xforms-refresh");
		}
	    },

	    refresh: function() {
		// Nada?
	    },

	    addChange: function(node) {
		var list = this.xform.building? this.newNodesChanged : this.nodesChanged;

		if (!inArray(node, list)) {
		    list.push(node);
		    this.xform.addChange(this);
		}
	    },

	    setRebuilded: function(value) {
		if (this.xform.building) {
		    this.newRebuilded = value;
		} else {
		    this.rebuilded = value;		
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFModel");