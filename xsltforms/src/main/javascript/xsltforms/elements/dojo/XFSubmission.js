dojo.provide("xsltforms.elements.dojo.XFSubmission");

dojo.require("xsltforms.elements.dojo.XFCoreElement");

dojo.require("xsltforms.io");

(function() {

	var SOAP_ = "application/soap+xml";

	var toXhrContent_ = function(node) {
	    var content = { };
	    var val = "";
	    var hasChildren = false;
	    for(var ii = 0, len = node.childNodes.length; len > ii; ii++) {
            var child = node.childNodes[ii];

            switch (child.nodeType) {
            case NodeType.ELEMENT :
                hasChildren = true;
                dojo.mixin(content, toXhrContent_(child));
                break;
            case NodeType.TEXT :
                val += child.nodeValue;
                break;
            }
        }
	    
	    if (!hasChildren && val.length > 0) {
            content[node.nodeName] = encodeURIComponent(val);
        }
	    
	    return content;
	};
	
	var toUrl_ = function(node, separator) {
		var url = "";
		var val = "";
		var hasChilds = false;

		for(var i = 0, len = node.childNodes.length; i < len; i++) {
			var child = node.childNodes[i];

			switch (child.nodeType) {
			case NodeType.ELEMENT :
				hasChilds = true;
				url += this.toUrl_(child, separator);
				break;
			case NodeType.TEXT :
				val += child.nodeValue;
				break;
			}
		}

		if (!hasChilds && val.length > 0) {
			url += node.nodeName + '=' + encodeURIComponent(val) + separator;
		}

		return url;
	};

	dojo.declare("xsltforms.elements.dojo.XFSubmission",
			xsltforms.elements.dojo.XFCoreElement,
	{
		constructor: function(args) {
			this.init(args.id, args.model, "xforms-submission");
			this.model = args.model;
			if (this.model.defaultSubmission == null) {
				this.model.defaultSubmission = this;
			}
			this.action = args.action;
			this.method = args.method;
			this.replace = args.replace;
			this.version = args.version;
			this.indent = args.indent;
			this.validate = args.validate;
			this.synchr = args.synchr;
			this.show = args.show;
			this.serialization = args.serialization;
			
			if (args.mediatype != null) {
				var lines = args.mediatype.split(";");
				this.mediatype = lines[0];

				for (var i = 1, len = lines.length; i < len; i++) {
				    var vals = lines[i].split("=");

				    switch (vals[0]) {
				    case "action" : this.soapAction = vals[1]; break;
				    case "charset" : this.charset = vals[1]; break;
				    }
				}
			}

			this.encoding = args.encoding;
			this.omitXmlDeclaration = args.omitXmlDeclaration;
			this.cdataSectionElements = args.cdataSectionElements;
			this.instance = args.instance;
			this.separator = args.separator == "&amp;"? "&" : args.separator;
			this.includenamespaceprefixes = args.includenamespaceprefixes;
			this.headers = [];

			if (args.ref || args.bind) {
				this.binding = new this.xform.Binding({
					isvalue: false,
					xpath: args.ref,
					model: args.model.element,
					bind: args.bind
				});
				
				this.eval_ = function() {
					return this.binding.evaluate()[0];
				};
			} else {
				this.eval_ = function() {
					return this.model.getInstanceDocument();
				};
			}
		},

		header: function(nodeset, combine, name, values) {
			this.headers.push({
				nodeset: nodeset,
				combine: combine,
				name: name,
				values: values
			});
			return this;
		},

		submit: function() {
			this.xform.openAction();
			var node = this.eval_();
			var action = "error";
			if(this.action.evaluate) {
				action = stringValue(this.action.evaluate());
			} else {
				action = this.action;
			}
			var method = "post";
			if(this.method.evaluate) {
				method = stringValue(this.method.evaluate());
			} else {
				method = this.method;
			}
			var evcontext = {"method": method, "resource-uri": action};

			var submissionHandler =
			    this.xform.getSubmissionRegistry().createSubmission({
			        resource: action,
			        method: method,
			        replace: this.replace,
			        synchr: this.synchr,
	                instance: this.instance
			    });
			
			if (!!submissionHandler) {
	            console.log("custom submission!");
			    submissionHandler({
			        node: node,
			        submission: this,
			        xml: Core.saveXML(node)
			    });
			    this.xform.closeAction();
			    return;
			} else {
			    console.log("No custom submission handler found");
			}
			
			if (node) {
				if (this.validate && !validate_(node)) {
					evcontext["error-type"] = "validation-error";
					this.issueSubmitException_(evcontext, null, null);
					this.xform.closeAction();
					return;
				}

				if ((method == "get" || method == "delete") && this.serialization != "none") {
					var tourl = toUrl_(node, this.separator);
					action += (action.indexOf('?') == -1? '?' : this.separator)
					+ tourl.substr(0, tourl.length - this.separator.length);
				}
			}

			if (action.substr(0,7) == "file://") {
				alert('XSLTForms Submission\n---------------------------\n\n'+action+'\n\nfile:// is not supported for security reasons.\n\nContents copied instead in clipboard if possible\nand displayed by the browser.');
				var ser = Core.saveXML(node);
				if (window.clipboardData) {
					window.clipboardData.setData('Text', ser);
				}
				w = window.open("about:blank","_blank");
				w.document.write(ser);
				w.document.close();
				this.xform.closeAction();
				return;
			}

			var synchr = this.synchr;
			var instance = this.instance;

			if(method == "xml-urlencoded-post") {
			    // FIXME: refactor to use xform-psuedo-head
				var outForm = document.getElementById("xsltforms_form");
				if(outForm) {
					outForm.firstChild.value = Core.saveXML(node);
				} else {
					outForm = Core.createElementByName(document, "form");
					outForm.setAttribute("method", "post");
					outForm.setAttribute("action", action);
					outForm.setAttribute("id", "xsltforms_form");
					var txt = Core.createElementByName(document, "input");
					txt.setAttribute("type", "hidden");
					txt.setAttribute("name", "postdata");
					txt.setAttribute("value", Core.saveXML(node));
					outForm.appendChild(txt);
					var body = Core.getElementsByTagName(document, "body")[0];
					body.insertBefore(outForm, body.firstChild);
				}
				outForm.submit(); 	
				this.xform.closeAction();
			} else {
					// TODO: Validate binding target is not empty
					if (!node && (method != "get" || method != "delete")) {
						evcontext["error-type"] = "no-data";
						this.issueSubmitException_(evcontext, null, null);
						return;
					}

					subm = this;
					try {
						var func = dojo.hitch(this, function(data, ioArgs) {
							try {
								if (ioArgs.xhr.status != 200 && ioArgs.xhr.status != 0) {
									evcontext["error-type"] = "resource-error";
									subm.issueSubmitException_(evcontext, ioArgs.xhr, null);
									this.xform.closeAction();
									return;
								}

								if (subm.replace == "instance") {
									var inst = instance == null? (node ? node.ownerDocument.instance : subm.model.getInstance()) : subm.xform.getElementById(instance).xfElement;
									inst.setDoc(data, false, true);
									this.xform.addChange(subm.model);
									this.xform.dispatch(subm.model, "xforms-rebuild");
									this.xform.refresh();
								}

								this.xform.dispatch(subm, "xforms-submit-done");
								this.xform.closeAction();

								if (subm.replace == "all") {
									var resp = data;
									var piindex = resp.indexOf("<?xml-stylesheet", 0);
									while ( piindex != -1) {
										var xslhref = resp.substr(piindex, resp.substr(piindex).indexOf("?>")).replace(/^.*href=\"([^\"]*)\".*$/, "$1");
										resp = Core.transformText(resp, xslhref, false);
										piindex = resp.indexOf("<?xml-stylesheet", 0);
									}
									if( subm.show == "new" ) {
										w = window.open("/up/xsltforms/blank.html","_blank");
										w.document.write(resp);
										w.document.close();
									} else {
										this.xform.getDialog().hide("statusPanel", false);
										this.xform.close();
										this.xform.setContent(resp);
									}
								}
							} catch(e) {
								DebugConsole.write(e || e.message);
								evcontext["error-type"] = "parse-error";
								subm.issueSubmitException_(evcontext, data, e);
								this.xform.closeAction();
							}

						});

						var media = this.mediatype;
						var mt = (media || "application/xml") +
						    (this.charset? ";charset=" + this.charset : "");

						DebugConsole.write("Submit " + this.method + " - " + mt + " - "
								+ action + " - " + synchr);
						var xhrHeaders = {};
						var len = this.headers.length;
						if (len != 0) {
							var headers = [];
							for (var i = 0, len = this.headers.length; i < len; i++) {
								var nodes = [];
								if (this.headers[i].nodeset) {
									nodes = this.headers[i].nodeset.evaluate();
								} else {
									nodes = [subm.model.getInstanceDocument().documentElement];
								}
								var hname;
								for (var n = 0, lenn = nodes.length; n < lenn; n++) {
									if (this.headers[i].name.evaluate) {
										hname = stringValue(this.headers[i].name.evaluate(nodes[n]));
									} else {
										hname = this.headers[i].name;
									}
									if (hname != "") {
										var hvalue = "";
										var j;
										for (j = 0, len2 = this.headers[i].values.length; j < len2; j++) {
											var hv = this.headers[i].values[j];
											var hv2;
											if (hv.evaluate) {
												hv2 = stringValue(hv.evaluate(nodes[n]));
											} else {
												hv2 = hv;
											}
											hvalue += hv2;
											if (j < len2 - 1) {
												hvalue += ",";
											}
										}
										var len3 = headers.length;
										for (j = 0; j < len3; j++) {
											if (headers[j].name == hname) {
												switch (this.headers[i].combine) {
												case "prepend":
													headers[j].value = hvalue + "," + headers[j].value;
													break;
												case "replace":
													headers[j].value = hvalue;
													break;
												default:
													headers[j].value += "," + hvalue;
												break;
												}
												break;
											}
										}
										if (j == len3) {
											headers.push({name: hname, value: hvalue});
										}
									}
								}
							}
							for (var i = 0, len = headers.length; i < len; i++) {
							    xhrHeaders[headers[i].name] = headers[i].value;
							}
						}
						
						var xhrRequest = xsltforms.io.xhr.forMethod(method);
						var xhrArgs = {
						        url: action,
						        handleAs: "text",
						        sync: synchr,
						        headers: xhrHeaders,
						        failOk: false,
						        handle: func
						};
						
						if (method == "get" || method == "delete") {
							if (media == SOAP_) {
							    xhrHeaders["Accept", mt];
							}
						} else if (method == "urlencoded-post") {
						    dojo.mixin(xhrArgs, {
						        content: toXhrContent_(node) 
						    });
						} else if (method == "form-data-post") {
						    // FIXME: need to use dojo.io.iframe to do proper
						    // multipart
						    xhrHeaders["Content-Type"] = "multipart/form-data";
                            dojo.mixin(xhrArgs, {
                                content: toXhrContent_(node) 
                            });
                        } else {
							xhrHeaders["Content-Type"] = mt;

							if (media == SOAP_) {
								xhrHeaders["SOAPAction"] = this.soapAction;
							}
							var xmlData = Core.saveXML(node);
							dojo.mixin(xhrArgs, method == "post" ?
							        { postData: xmlData} : { putData: xmlData});
						}

						xhrRequest(xhrArgs);
					} catch(e) {
						DebugConsole.write(e.message || e);
						evcontext["error-type"] = "resource-error";
						subm.issueSubmitException_(evcontext, xhrRequest, e);
						this.xform.closeAction();
					}
			}
		},

		issueSubmitException_: function(evcontext, req, ex) {
			if (ex) {
				evcontext["message"] = ex.message || ex;
				evcontext["stack-trace"] = ex.stack;
			}
			if (req) {
				evcontext["response-status-code"] = req.status;
				evcontext["response-reason-phrase"] = req.statusText;
				var rheads = req.getAllResponseHeaders();
				if (rheads) {
					// TODO: Parse headers into nodes.
					evcontext["response-headers"] = rheads;
				}
				// TODO: Should it use the 'req.responseXML' function if parsing succeeded?
				evcontext["response-body"] = req.responseText;
			}
			this.xform.dispatch(this, "xforms-submit-error", null, null, null, null, evcontext);
		}
	});
	
})();
