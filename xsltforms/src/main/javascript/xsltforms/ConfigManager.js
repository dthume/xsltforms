dojo.provide("xsltforms.ConfigManager");

dojo.require("xsltforms.XFAbstractObject");

(function() {
    dojo.declare("xsltforms.ConfigManager", xsltforms.XFAbstractObject,
    {
        loadProperties: function(name) {
            var xform = this.xform;
            var XMLEvents = xform.getXMLEventManager();
            /*
            if (!this.ROOT) {
                var scripts = this.xform.getElementsByTagName(document, "script");
                for (var i = 0, len = scripts.length; i < len; i++) {
                    var src = scripts[i].src;
                    if (src.indexOf(Core.fileName) != -1) {
                        this.ROOT = src.replace(Core.fileName, "");
                        break;
                    }
                }
            }
            */
            var uri = this.xform.getConfigBaseURI() + name;
            var req = Core.openRequest("GET", uri, false);
            if (req.overrideMimeType) {
                req.overrideMimeType("application/xml");
            }
            try {        
                req.send(null);
            } catch(e) {
                alert("File not found: " + uri);
            }

            if (200 == req.status) {
                Core.loadNode(this.config, Core.selectSingleNode('//properties', req.responseXML));
                this.config = xform.getElementByXFormId("xf-instance-config").xfElement.doc.documentElement;
                Core.setMeta(this.config, "instance", "xf-instance-config");
                Core.setMeta(this.config, "model", "xf-model-config");
            }
        }
    });
})();
