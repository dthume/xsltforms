dojo.require("xsltforms");

(function() {

	var browserSpecificMethods = dojo.isIE ? {
		attach : function(target, name, handler, phase) {
			var func = function(evt) {
				handler.call(window.event.srcElement, evt);
			};
			target.attachEvent("on" + name, func);
			this._add(target, name, func, phase);
		},

		detach : function(target, name, handler, phase) {
			target.detachEvent("on" + name, handler);
		},

		getTarget : function() {
			return window.event.srcElement;
		},

		dispatch : function(target, name) {
			target.fireEvent("on" + name, document.createEventObject());
		}
	} : {
		attach : function(target, name, handler, phase) {
			if (target == window && !window.addEventListener) {
				target = document;
			}
			target.addEventListener(name, handler, phase);
			this._add(target, name, handler, phase);
		},

		detach : function(target, name, handler, phase) {
			if (target == window && !window.addEventListener) {
				target = document;
			}

			target.removeEventListener(name, handler, phase);
		},

		getTarget : function(ev) {
			return ev.target;
		},

		dispatch : function(target, name) {
			var event = document.createEvent("Event");
			event.initEvent(name, true, true);
			target.dispatchEvent(event);
		}
	};

	dojo.declare("xsltforms.EventManager", null, {
		_cache : null,
		onunload : null,

		constructor : function() {
			dojo.safeMixin(this, browserSpecificMethods);
		},

		_add : function() {
			if (!this._cache) {
				this._cache = [];
			}
			this._cache.push(arguments);
		},

		_flush : function() {
			if (this._cache) {
				for ( var i = this._cache.length - 1; i >= 0; i--) {
					var item = this._cache[i];
					this.detach(item[0], item[1], item[2], item[3]);
				}
			}

			if (this.onunload) {
				this.onunload();
			}
		}
	});
})();

dojo.provide("xsltforms.EventManager");
