dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

(function() {

    var XFORM_EVENTS = [
	["xforms-model-construct",      true, false, function(event) { this.construct(); }],
	["xforms-model-construct-done", true, false],
	["xforms-ready",                true, false],
	["xforms-model-destruct",       true, false],
	["xforms-rebuild",              true, true, function(event) { this.rebuild(); }],
	["xforms-recalculate",          true, true, function(event) { this.recalculate(); }],
	["xforms-revalidate",           true, true, function(event) { this.revalidate(); }],
	["xforms-reset",                true, true, function(event) { this.reset(); }],
	["xforms-submit",               true, true, function(event) { this.submit(); }],
	["xforms-refresh",              true, true, function(event) { this.refresh(); }],
	["xforms-focus",                true, true, function(event) { this.focus(); } ],
	["DOMActivate",                 true, true],
	["DOMFocusIn",                  true, false],
	["DOMFocusOut",                 true, false],
	["xforms-select",               true, false],
	["xforms-deselect",             true, false],
	["xforms-value-changed",        true, false],
	["xforms-insert",               true, false],
	["xforms-delete",               true, false],
	["xforms-valid",                true, false],
	["xforms-invalid",              true, false],
	["xforms-enabled",              true, false],
	["xforms-disabled",             true, false],
	["xforms-optional",             true, false],
	["xforms-required",             true, false],
	["xforms-readonly",             true, false],
	["xforms-readwrite",            true, false],
	["xforms-in-range",             true, false],
	["xforms-out-of-range",         true, false],
	["xforms-submit-done",          true, false],
	["xforms-submit-error",         true, false],
	["xforms-compute-exception",    true, false],
	["xforms-binding-exception",    true, false],
	["ajx-start",                   true, true, function(evt) { evt.target.xfElement.start(); }],
	["ajx-stop",                    true, true, function(evt) { evt.target.xfElement.stop(); }],
	["ajx-time",                    true, true],
	["xforms-dialog-open",          true, true, function(evt) { Dialog.show(evt.target, null, true); }],
	["xforms-dialog-close",         true, true, function(evt) { Dialog.hide(evt.target, true); }]
    ];


    dojo.declare(
	"xsltforms.XMLEventManager",
	xsltforms.XFAbstractObject,
	{
	    constructor: function(args) {
		    this._registry = [];

		    dojo.forEach(XFORM_EVENTS, function(eventConfig) {
		        this.define.apply(this, eventConfig);
		    }, this);

		    this._contexts = [];
	    },
	    
	    getCurrentContext: function() {
	        return this._contexts[this._contexts.length - 1];
	    },
	    
	    define : function(name, bubbles, cancelable, defaultAction) {
	        this._registry[name] = {
	                bubbles:       bubbles,
	                cancelable:    cancelable,
	                defaultAction: defaultAction? defaultAction : function() { }
	        };
	    },

	    makeEventContext : function(evcontext, type, targetid, bubbles, cancelable) {
	        if (!evcontext) {
	            evcontext = {};
	        }
	        evcontext.type = type;
	        evcontext.targetid = targetid;
	        evcontext.bubbles = bubbles;
	        evcontext.cancelable = cancelable;
		
	        return evcontext;
	    },

	    dispatchList: function(list, name) {
	        for (var id in list) {
	            this.dispatch(list[id], name);
	        }
	    },
	    
	    dispatch: function(target, name, type, bubbles, cancelable, defaultAction, evcontext) {
	        target = target.element || target;
	        assert(target != null && typeof(target.nodeName) != "undefined");
		
	        DebugConsole.write("Dispatching event " + name + " on <" + target.nodeName
				   + (target.className? " class=\"" + target.className + "\"" : "")
				   + (target.id? " id=\"" + target.id + "\"" : "") + "/>");
	        var reg = this._registry[name];

	        if (reg != null) {
	            bubbles = reg.bubbles;
	            cancelable = reg.cancelable;
	            defaultAction = reg.defaultAction;
	        }

	        if (!defaultAction) {
	            defaultAction = function() { };
	        }

	        evcontext = this.makeEventContext(evcontext, name, target.id, bubbles, cancelable);
	        this._contexts.push(evcontext);
	        try {
	            if (target.dispatchEvent) {
	                var event = document.createEvent("Event");
	                event.initEvent(name, bubbles, cancelable);
	                var res = target.dispatchEvent(event);
	                
	                if ((res && !event.stopped) || !cancelable) {
	                    defaultAction.call(target.xfElement, event);
	                }
	            } else {
	                var fauxName = "errorupdate";
	                var canceler = null;
	                // Capture phase.
	                var ancestors = [];
	                
	                for (var a = target.parentNode; a != null; a = a.parentNode) {
	                    ancestors.unshift(a);
	                }

	                for (var i in ancestors) {
	                    var event = document.createEventObject();
	                    event.trueName = name;
	                    event.phase = "capture";
	                    ancestors[i].fireEvent("onerrorupdate", event);
	                    
	                    if (event.stopped) {
	                        return;
	                    }
	                }

	                var event = document.createEventObject();
	                event.trueName = name;
	                event.phase = "capture";
	                event.target = target;
	                target.fireEvent("onerrorupdate" , event);

	                //  Bubble phase.
	                if (!bubbles) {
	                    canceler =
	                        new this.xform.Listener({
	                            observer: target,
	                            name: name,
	                            phase: "default",
	                            handler: function(event) { 
	                                event.cancelBubble = true;
	                            }
	                        });
	                }

	                var event = document.createEventObject();
	                event.trueName = name;
	                event.phase = "default";
	                event.target = target;
			
	                var res = target.fireEvent("onerrorupdate", event);

	                try {
	                    if ((res && !event.stopped) || !cancelable) {
	                        defaultAction.call(target.xfElement, event);
	                    }

	                    if (!bubbles) {
	                        canceler.detach();
	                    }
	                } catch (e) {
	            }
		    }
		} finally {
		    this._contexts.pop();
		}
	    }
	});
})();

dojo.provide("xsltforms.XMLEventManager");
