dojo.provide("xsltforms.WidgetFactory");

dojo.require("xsltforms.elements.dojo.Calendar");

dojo.require("dijit.form.SimpleTextarea");

(function() {
    var exampleContext = {
        "controlType": "input",
        "schemaType": {
            nsuri: "http://some/namespace/uri",
            name: "tName",
            "class": "number"
        },
        "appearance": "full",
        "inputMode": "predictive"
    };
    
    var Calendar = xsltforms.elements.dojo.Calendar;
    
    function newDefaultSchemaType(clase) {
        return { 
            nsuri: "#default",
            name: "#default",
            "class": clase,
            getMaxLength: function() { },
            getDisplayLength: function() { }
        };
    }
    
    var Widget = dojo.declare("xsltforms.Widget", null,
    {
        constructor: function(args) {
            dojo.safeMixin(this, args);
        },
        getInputControl: function() {
            return this.input;
        },
        getFocusControl: function() {
            return this.focusControl;
        },
        getValue: function() {
            var input = this.input;
            
            var value;
            
            if ("checkbox" === input.type) {
                value = input.checked ? "true" : "false";
            } else {
                value = input.value;
            }
            
            return value;
        },
        setValue: function(value) {
            var input = this.input;
            
            if ("checkbox" === input.type) {
                input.checked = value == "true";
            } else if (input.value != value) {
                input.value = value || "";
            }
        },
        click: function(target) {
            if (target == this.aidButton) {
                this.xform.executeInAction(function(xform) {
                    xform.dispatch(this, "ajx-aid");
                });
            } else if (target == this.input && this.type["class"] == "boolean"){
                var control = this.control;
                var input = this.input;
                this.xform.executeInAction(function(xform) {
                    control.valueChanged(target.checked? "true" : "false");
                    xform.dispatch(input, "DOMActivate");
                });
            } else if (target == this.calendarButton) {
                Calendar.show(this);
            }
        },
        changeReadonly: function() {
            var readonly = this.control.readonly;
            if (this.input) {
                this.input.readOnly = readonly;

                if (this.calendarButton) {
                    this.calendarButton.style.display = readonly? "none" : "";
                }
            }
        },
        dispose: function() {
            this.calendar = null;
            this.calendarButton = null;
            this.control = null;
            this.focusControl = null;
            this.input = null;
            this.type = null;
            this.xform = null;
        }
    });
    
    function initFocus(xform, widget, input, events, principal) {
        if (principal) {
            widget.focusControl = input;
        }
        var Event = xform.getEventManager();
        Event.attach(input, "focus", events.focus);
        Event.attach(input, "blur", events.blur);
    }
    
    function createInput(name, content, clase, widgetFactory, postProcessor) {
        return function(context) {
            return function(args) {
                var input =
                    widgetFactory(args.xform, name, args, content, clase);
                
                var widget = new Widget({
                        input: input,
                        xform: args.xform,
                        control: args.control,
                        type: context.schemaType
                });
                
                if (!!postProcessor) postProcessor(widget, context, args);
                
                initFocus(args.xform, widget, input, args.events, true);
                
                return widget;
            };
        };
    }
    
    function createFormInput(xform, name, args, content, clase) {
        var input;
        if ("textarea" == name) {
            input = xform.createElement("textarea", args.parent, content, clase);
        } else {
            input = xform.createElement("input", args.parent, content, clase); 
            input.type = name;
        }
        return input;
    }
    
    function simpleInput(name, content, clase, postProc) {
        return createInput(name, content, clase, createFormInput, postProc);
    }
    
    function toggleAttribute(input, attrName, value) {
        if (!!value) {
            input[attrName] = value
        } else {
            input.removeAttribute(attrName);
        }
    }
    
    function initEvents(widget, context, args, canActivate) {
        var input = widget.getInputControl();
        var Event = args.xform.getEventManager();
        
        if (args.inputMode) {
            Event.attach(input, "keyup", args.events.keyUpInputMode);
        }
        if (canActivate) {
            if (args.incremental) {
                Event.attach(input, "keyup", args.events.keyUpIncrementalActivate);
            } else {
                Event.attach(input, "keyup", args.events.keyUpActivate);
            }
        } else {
            if (args.incremental) {
                Event.attach(input, "keyup", args.events.keyUpIncremental);
            }
        }
    }
    
    function constrainedInput(name, context, clase, postProcessor) {
        var newPostProcessor = function(widget, ctxt, args) {
            var type = ctxt.schemaType;
            var input = widget.getInputControl();
            
            initEvents(widget, ctxt, args, true);
            
            toggleAttribute(input, "maxLength", type.getMaxLength());
            toggleAttribute(input, "size", type.getDisplayLength());
            
            if (!!postProcessor) postProcessor(widget, ctxt, args);
        };
        
        return simpleInput(name, context, clase, newPostProcessor);
    }
    
    function dateInput(name, context, clase, postProcessor) {
        var newPostProcessor = function(widget, ctxt, args) {
            var xform = widget.xform;
            widget.calendarButton =
                xform.createElement("button", args.parent, "...", "aid-button");
            initFocus(xform, widget, widget.calendarButton, args.events, false);
        };
        
        return simpleInput(name, context, "xforms-value", newPostProcessor);
    }
    
    function textarea(name, content, clase, postProc) {
        var newPP = function(widget, ctxt, args) {
            initEvents(widget, ctxt, args, true);
            postProc(widget, ctxt, args);
        };
        return createInput(name, content, clase, createFormInput, newPP);
    }
/*    
    function simpleTextarea() {
        return function(context) {
            return function(args) {
                var Event = args.xform.getEventManager();
                
                var input = new dijit.form.SimpleTextarea({
                    "class": "xforms-value"
                }, args.parent);
                
                var widget = new Widget({
                    input: input,
                    xform: args.xform,
                    control: args.control,
                    type: context.schemaType,
                    click: function() { },
                    getValue: function() { return this.input.attr("value"); },
                    setValue: function(val) { this.input.attr("value", val); },
                    changeReadonly: function() {
                        this.input.attr("readOnly", (!!this.control.readonly));
                    },
                    dispose: function() { this.input.destroyRecursive(); }
                });
                
                input.connect("onblur", args.events.blur);
                Event.attach(input.focusNode, "focus", args.events.focus);
                
                if (args.inputMode) {
                    input.connect("onkeyup", args.events.keyUpInputMode);
                }
                if (args.incremental) {
                    input.connect("onkeyup", args.events.keyUpInputMode);
                }
                
                return widget;
            };
        };
    }
*/    
    var _DEFAULT_HEIRARCHY = {
        "input" : { // controlType
            "#default" : { // class
                "#default" : constrainedInput("input", null, "xforms-value")
            },
            "boolean" : {
                "#default": simpleInput("checkbox", null, null)
            },
            "date" : {
                "#default": dateInput("input")
            },
            "datetime" : {
                "#default": dateInput("input")
            },
            "number" : {
                "#default": constrainedInput("input", null, null, function(w) {
                    w.getInputControl().style.textAlign = "right";
                })
            }
        },
        "secret" : { // controlType
            "#default" : { // class
                "#default" : constrainedInput("password", null, "xforms-value")
            }
        },
        
        "textarea" : { // controlType
            "#default" : { // class
                "#default" : simpleInput("textarea", null, "xforms-value")
//                "#default" : simpleTextarea()
            }
        }
    };
    
    var _DEFAULT = "#default";
    
    function createPath(context) {
        var clase = context.schemaType["class"] || "#default";
        
        return [context.controlType, clase, context.appearance];
    }
    
    dojo.declare("xsltforms.SimpleWidgetRegistry", null,
    {
        isXFWidgetRegistry: true,
        
        constructor: function() {
            this._defs = { };
            this.mergeClassRegistryDefinition(_DEFAULT_HEIRARCHY);
        },
        
        lookupWidget: function(context) {
            var path = createPath(context);
            var current = this._defs;
            
            dojo.forEach(path, function(component) {
                current = current.hasOwnProperty(component) ?
                          current[component]
                        : current[_DEFAULT];
                if (!current) {
                    throw new Error("Failed to lookup widget for context: " +
                            context);
                }
            });
            
            return current(context);
        },
        
        registerWidget: function(context, widget) {
            var path = createPath(context);
            var current = this._defs;
            
            for (var ii = 0, len = (path.length - 1); ii < len; ii++) {
                var component = path[ii];
                if (!current.hasOwnProperty(component)) {
                    current[component] = {};
                }
                current = current[component];
            };
            current[path.pop()] = widget;
        },
        
        mergeClassRegistryDefinition: function(def) {
            for (var controlType in def) {
                var controlRegistry = def[controlType];
                for (var clase  in controlRegistry) {
                    var classRegistry = controlRegistry[clase];
                    for (var appearance in classRegistry) {
                        var factory = classRegistry[appearance];
                        this.registerWidget({
                            "controlType": controlType,
                            "schemaType": newDefaultSchemaType(clase),
                            "appearance": appearance
                        }, factory);
                    }
                }
            }
        },
        
        getDefaultWidget: function() {
            return {
                getInputControl: function() {},
                getValue: function() {},
                setValue: function(value) {},
                click: function(target) {},
                changeReadonly: function() {},
                dispose: function() {}
            };
        }

    });
    
    function addContextDefaults(context) {
        return dojo.mixin({
            "schemaType": newDefaultSchemaType("#default"),
            "appearance": _DEFAULT,
            "inputMode": _DEFAULT
        }, context);
    }
    
    dojo.declare("xsltforms.DefaultingWidgetRegistry", null,
    {
        isXFWidgetRegistry: true,
        
        constructor: function(args) {
            this._delegate = args.delegate;
            this.getDefaultWidget =
                dojo.hitch(this._delegate, this._delegate.getDefaultWidget);
        },
        
        lookupWidget: function(context) {
            return this._delegate.lookupWidget(addContextDefaults(context));
        },
        
        registerWidget: function(context, widget) {
            var defaulted = addContextDefaults(context);
            return this._delegate.registerWidget(defaulted, widget);
        },
        mergeClassRegistryDefinition: function(def) {
            this._delegate.mergeClassRegistryDefinition(def);
        }
    });
    
    xsltforms.GLOBAL_WIDGET_REGISTRY = new xsltforms.DefaultingWidgetRegistry({
        delegate: new xsltforms.SimpleWidgetRegistry()
    });
})();