dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.XFAbstractObject");

(function() {
    var depsId = 0;
    
    dojo.declare(
	"xsltforms.elements.dojo.XFElement",
	xsltforms.XFAbstractObject,
	{
	    init: function(id) {
		this.element = this.xform.getElementById(id);
		this.element.xfElement = this;
		this.depsElements = [];
		this.depsNodesBuild = [];
		this.depsNodesRefresh = [];
		this.depsIdB = depsId++;
		this.depsIdR = depsId++;
	    },
	    dispose: function() {
		if(this.element) {
		    this.element.xfElement = null;
		    this.element = null;
		}
		this.depsElements = null;
		if (this.depsNodesBuild) {
		    for (var i = 0, len = this.depsNodesBuild.length; i < len; i++) {
			Core.setFalseBoolMeta(this.depsNodesBuild[i], "depfor_"+this.depsIdB);
		    }
		}
		this.depsNodesBuild = null;
		if (this.depsNodesRefresh) {
		    for (var i = 0, len = this.depsNodesRefresh.length; i < len; i++) {
			Core.setFalseBoolMeta(this.depsNodesRefresh[i], "depfor_"+this.depsIdR);
		    }
		}
		this.depsNodesRefresh = null;
	    },
	    build: function(ctx) {
		if (this.hasBinding) {
		    var deps = this.depsElements;
		    var depsN = this.depsNodesBuild;
		    var depsR = this.depsNodesRefresh;
		    var build = !this.xform.ready || (deps.length === 0) || ctx != this.ctx;
		    var refresh = false;
		    var changes = this.xform.changes;

		    for (var i0 = 0, len0 = depsN.length; !build && i0 < len0; i0++) {
			build = depsN[i0].nodeName == "";
		    }
		    for (var i = 0, len = deps.length; !build && i < len; i++) {
			var el = deps[i];

			for (var j = 0, len1 = changes.length; !build && j < len1; j++) {
			    if (el == changes[j]) {
				if (el.instances) { //model
				    if (el.rebuilded || el.newRebuilded) {
					build = true;
				    } else {
					for (var k = 0, len2 = depsN.length; !build && k < len2; k++) {
					    build = inArray(depsN[k], el.nodesChanged);
					}

					if (!build) {
					    for (var n = 0, len3 = depsR.length; n < len3; n++) {
						refresh = inArray(depsR[n], el.nodesChanged);
					    }
					}
				    }
				} else {
				    build = true;
				}
			    }
			}
		    }

		    this.changed = build || refresh;

		    if (build) {
			for (var i = 0, len = depsN.length; i < len; i++) {
			    Core.setFalseBoolMeta(depsN[i], "depfor_"+this.depsIdB);
			}
			depsN.length = 0;
			for (var i = 0, len = depsR.length; i < len; i++) {
			    Core.setFalseBoolMeta(depsR[i], "depfor_"+this.depsIdR);
			}
			depsR.length = 0;
			deps.length = 0;
			this.ctx = ctx;
			this.build_(ctx);
		    }
		} else {
		    this.element.node = ctx;
		}
	    },
	    evaluateBinding: function(binding, ctx) {
		var nodes = null;
		var errmsg = null;
		
		if (binding) {
		    nodes = binding.evaluate(ctx, this.depsNodesBuild, this.depsIdB, this.depsElements);
		    if (nodes != null) {
			return nodes;
		    }
		    
		    // A 'null' binding means bind-ID was not found.
		    errmsg = "non-existent bind-ID("+ binding.bind + ") on element(" + this.element.id + ")!";
		} else {
		    errmsg = "no binding defined for element("+ this.element.id + ")!";
		}
		
		assert(errmsg);
		
		if (this.xform.building && DebugMode) {
		    //
		    // Do not fail here, to keep on searching for more errors.
		    
			this.xform.bindErrMsgs.push(errmsg);
		    this.xform.dispatch(this.element, "xforms-binding-exception");
		    nodes = [];
		} else {
			this.xform.error(this.element, "xforms-binding-exception", errmsg);
		}

		return nodes;
	    }
	});

})();

dojo.provide("xsltforms.elements.dojo.XFElement");