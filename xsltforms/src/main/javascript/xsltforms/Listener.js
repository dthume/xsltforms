dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

(function() {
    function isEffectiveTarget(event) {
        var notFF2 = !Core.isFF2;
        
        var effectiveTarget = true;
        if(event.currentTarget && event.type == "DOMActivate"
            && event.target.nodeName == "BUTTON" && notFF2) {
            effectiveTarget = false;
        }
        else if (event.eventPhase == 3) {
            if(!event.target.xfElement) {
                if (notFF2) effectiveTarget = false;
            }
            else {
                if(event.target == event.currentTarget && notFF2) {
                    effectiveTarget = false;
                }
                else if(event.target.xfElement.isXFLabel) {
                    effectiveTarget = false;
                }
            }
        }
        return effectiveTarget;
    }

	dojo.declare("xsltforms.Listener", xsltforms.XFAbstractObject, {
		constructor: function(args) {
	        var observer = args.observer;
	        var name = args.name;
	        var phase = args.phase || "default";
	        var handler = args.handler;
	        if (phase != "default" && phase != "capture") {
	            this.xform.error(this.xform.defaultModel,
	                    "xforms-compute-exception", 
	                    "Unknown event-phase(" + phase +") for event(" + 
	                        name + ")"+(observer? " on element(" +
	                                observer.id + ")":"") + "!");
	            return;
	        }
	        this.observer = observer;
		    this.name = name;
		    this.evtName = document.addEventListener? name : "errorupdate";
		    this.phase = phase;
		    this.handler = handler;
		    assert(observer);
		    
		    if (!observer.listeners) {
		        observer.listeners = [];
		    }

		    observer.listeners.push(this);
		    
		    this.callback = function(event) {
		        
		        if (!document.addEventListener) {
		            event = event || window.event;
		            event.target = event.srcElement;
		            event.currentTarget = observer;

		            if (event.trueName && event.trueName != name) {
		                return;
		            }

		            if (!event.phase) {
		                if (phase == "capture") {
		                    return;
		                }
		            } else if (event.phase != phase) {
		                return;
		            }
		            
		            if (phase == "capture") {
		                event.cancelBubble = true;
		            }
		            
		            event.preventDefault = function() {
		                this.returnValue = false;
		            };
		            
		            event.stopPropagation = function() {
		                this.cancelBubble = true;
		                this.stopped      = true;
		            };
		        }
		        
		        if (isEffectiveTarget(event)) {
		            
		            if (event.target != null && event.target.nodeType == 3) {
		                event.target = event.target.parentNode;
		            }

		            handler.call(event.target, event);
		        }

		        if (!document.addEventListener) {
		            try {
		                event.preventDefault = null;
		                event.stopPropagation = null;
		            } catch (e) {};
		        }
		    };
		    
		    this.attach();
	    },

	attach: function() {
		this.xform.getEventManager().attach(this.observer, this.evtName, this.callback, this.phase == "capture");
	},

	detach: function() {
		this.xform.getEventManager().detach(this.observer, this.evtName, this.callback, this.phase == "capture");
	},

	clone: function(element) {
		return new xsltforms.Listener({
				xform: this.xform,
				observer: element,
				name: this.name,
				phase: this.phase,
				handler: this.handler
			});
	}
	});

})();

dojo.provide("xsltforms.Listener");