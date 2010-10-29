dojo.provide("xsltforms.elements.dojo.DojoWidgetFactory");

dojo.require("xsltforms.WidgetFactory");

dojo.provide("dojo.date.stamp");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.SimpleTextarea");
dojo.require("dijit.form.TextBox");

(function() {
    var DojoWidget = dojo.declare(
            "xsltforms.elements.dojo.DojoWidget",
            xsltforms.Widget,
    {
        constructor: function(args) {
            dojo.safeMixin(this, args);
        },
        getInputControl: function() {
            return this.input;
        },
        getValue: function() {
            return this.input.get("value");
        },
        setValue: function(value) {
            this.input.set("value", value);
        },
        click: function(target) {},
        changeReadonly: function() {
            this.input.set("readOnly", (!!this.control.readonly));            
        },
        dispose: function() {
            this.input.destroyRecursive();
            this.input = null;
            this.control = null;
            this.type = null;
            this.xform = null;
        }
    });
    
    var DojoCheckbox = dojo.declare(
            "xsltforms.elements.dojo.DojoCheckbox",
            DojoWidget,
    {
        getValue: function() {
            return this.input.get("checked") ? "true" : "false";
        },
        setValue: function(value) {
            this.input.set("checked", "true" == value);
        }
    });
    
    function newDojoWidget(clazz, context, args, extraConstructorArgs) {
        var merged = dojo.mixin({
            xform: args.xform,
            control: args.control,
            type: context.schemaType
        }, extraConstructorArgs);
        
        if (!merged.focusControl) {
            merged.focusControl = merged.input.focusNode;
        }
        
        return new clazz(merged);
    }
    
    function newDojoInput(clazz, context, args, extraConstructorArgs) {
        var input = new clazz(dojo.mixin({
            "class": "xforms-value"
        }, extraConstructorArgs || {}));
        
        input.placeAt(args.parent, "only");
        
        return input;
    }
    
    function initFocus(widget, context, args) {
        var Event = args.xform.getEventManager();
        
        widget.input.connect("onblur", args.events.blur);
        // For some reason we don't get proper focus events from Dojo;
        // we get focus events when the widget is clicked, but not when
        // it's tabbed into via the keyboard, so we instead subscribe
        // directly onto the focusNode of the widget using traditional
        // Event registration methods
        Event.attach(widget.input.focusNode, "focus", args.events.focus);
    }
    
    function checkbox() {
        return function(context) {
            return function(args) {
                var input = newDojoInput(dijit.form.CheckBox, context, args);
                
                var widget = newDojoWidget(DojoCheckbox, context, args, {
                    input: input
                });
                
                initFocus(widget, context, args);
                
                if (args.inputMode) {
                    input.connect("onkeyup", args.events.keyUpInputMode);
                }
                if (args.incremental) {
                    input.connect("onkeyup", args.events.keyUpIncrementalActivate);
                } else {
                    input.connect("onkeyup", args.events.keyUpActivate);
                }
                
                return widget;
            };
        };
    }
    
    function simpleTextarea() {
        return function(context) {
            return function(args) {
                var Event = args.xform.getEventManager();
                
                var input =
                    newDojoInput(dijit.form.SimpleTextarea, context, args);
                
                var widget = newDojoWidget(DojoWidget, context, args, {
                    input: input
                });
                
                initFocus(widget, context, args);

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
    
    var DojoDateWidget= dojo.declare(
            "xsltforms.elements.dojo.DojoDateWidget",
            DojoWidget,
    {
        getValue: function() {
            var I8N = this.xform.getI8N();
            var date = I8N.formatDate(this.input.get("value"));
            return date;
        },
        setValue: function(val) {
            var I8N = this.xform.getI8N();
            this.input.set("value", I8N.parseDate(val));
        }
    });
    
    function dateField() {
        return function(context) {
            return function(args) {
                var input = newDojoInput(dijit.form.DateTextBox, context, args);
                
                var widget = newDojoWidget(DojoDateWidget, context, args, {
                    input: input
                });
                
                initFocus(widget, context, args);
                
                return widget;
            };
        };
    }
    
    function textbox(type) {
        return function(context) {
            return function(args) {
                var Event = args.xform.getEventManager();
                
                var input = newDojoInput(dijit.form.TextBox, context, args, {
                    type: type
                });
                
                var widget = newDojoWidget(DojoWidget, context, args, {
                    input: input
                });
                
                initFocus(widget, context, args);

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

    function numberTextbox(type, fractional) {
        return function(context) {
            return function(args) {
                var Event = args.xform.getEventManager();
                
                var input = newDojoInput(dijit.form.NumberTextBox, context, args, {
                    type: type,
                    fractional: fractional
                });
                
                var widget = newDojoWidget(DojoWidget, context, args, {
                    input: input,
                    focusControl: input
                });
                
                initFocus(widget, context, args);

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

    xsltforms.GLOBAL_WIDGET_REGISTRY.mergeClassRegistryDefinition({
        "input" : { // controlType
            "#default" : { // class
                "#default" : textbox("text")
            },
            "boolean" : {
                "#default" : checkbox()
            },
            "date" : {
                "#default" : dateField()
            },
            "number" : {
                "#default" : numberTextbox("decimal", false)
            }
        },
        "secret" : {
            "#default" : {
                "#default" : textbox("password")
            }
        },
        "textarea" : {
            "#default" : {
                "#default" : simpleTextarea()
            }
        }
    });
})();