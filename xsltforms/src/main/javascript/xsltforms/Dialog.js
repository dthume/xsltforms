dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

(function() {
	dojo.declare(
			"xsltforms.Dialog",
			xsltforms.XFAbstractObject,
			{
				init : false,
				initzindex : 50,
				zindex: 0,

				constructor: function(args) {
				this.openPosition = {};
				this.dialogs = [];
				this.selectstack = [];
			},

			dialogDiv : function(id) {
				var div = null;
				if (typeof id != "string") {
					var divid = id.getAttribute("id");
					if (divid != null && divid != "") {
						div = this.xform.getIdManager().find(divid);
					} else {
						div = id;
					}
				} else {
					div = this.xform.getIdManager().find(id);
				}
				if (!div) {
					DebugConsole.write("Unknown dialog("+id+")!");
				}
				return div;
			},

			show : function(div, parent, modal) {
				if (!(div = this.dialogDiv(div))) {
					return;
				}

				// Don't reopen the top-dialog.
				if (this.dialogs[this.dialogs.length - 1] === div) {
					return;
				}

				// Maintain dialogs-array ordered.
				this.dialogs = removeArrayItem(this.dialogs, div);
				this.dialogs.push(div);

				if (modal) {
					var surround = this.xform.getElementById('xforms-dialog-surround');
					surround.style.display = "block";
					surround.style.zIndex = (this.zindex + this.initzindex)*2;
					this.zindex++;
					var size = Core.getWindowSize();
					surround.style.height = size.height+"px";
					surround.style.width = size.width+"px";
					surround.style.top = size.scrollY+"px";
					surround.style.left = size.scrollX+"px";
					var surroundresize = function () {
						var surround = this.xform.getElementById('xforms-dialog-surround');
						var size = Core.getWindowSize();
						surround.style.height = size.height+"px";
						surround.style.width = size.width+"px";
						surround.style.top = size.scrollY+"px";
						surround.style.left = size.scrollX+"px";
					};
					window.onscroll = surroundresize;
					window.onresize = surroundresize;
				}

				div.style.display = "block";
				div.style.zIndex = (this.zindex + this.initzindex)*2-1;
				this.showSelects(div, false, modal);

				if (parent) {
					var absPos = Core.getAbsolutePos(parent);
					Core.setPos(div, absPos.x, (absPos.y + parent.offsetHeight));
				} else {
					var size = Core.getWindowSize();
					var h = size.scrollY + (size.height - div.offsetHeight) / 2;
					Core.setPos(div, (size.width - div.offsetWidth) / 2, h > 0 ? h : 100);
				}
			},

			hide : function(div, modal) {
				if (!(div = this.dialogDiv(div))) {
					return;
				}

				var oldlen = this.dialogs.length;
				this.dialogs = removeArrayItem(this.dialogs, div);
				if (this.dialogs.length == oldlen) {
					return;
				}

				this.showSelects(div, true, modal);
				div.style.display = "none";

				if (modal) {
					if (!this.dialogs.length) {
						this.zindex = 0;
						this.xform.getElementById('xforms-dialog-surround').style.display = "none";
						window.onscroll = null;
						window.onresize = null;
					} else {
						this.zindex--;
						this.xform.getElementById('xforms-dialog-surround').style.zIndex = (this.zindex + this.initzindex)*2-2;

						// Ensure new top-dialog over modal-surround.
						if (this.dialogs.length) {
							this.dialogs[this.dialogs.length - 1].style.zIndex = (this.zindex + this.initzindex)*2-1;
						}
					}
				}
			},

			knownSelect : function(s) {
				if (Core.isIE6) {
					for (var i = 0, len = this.zindex; i < len; i++) {
						for (var j = 0, len1 = this.selectstack[i].length; j < len1; j++) {
							if (this.selectstack[i][j].select == s) {
								return true;
							}
						}
					}
				}
				return false;
			},

			showSelects : function(div, value, modal) {
				if (Core.isIE6) {
					var selects = Core.getElementsByTagName(document, "select");
					var pos = Core.getAbsolutePos(div);
					var w = div.offsetWidth;
					var h = div.offsetHeight;
					var dis = [];
					for (var i = 0, len = selects.length; i < len; i++) {
						var s = selects[i];
						var p = s.parentNode;

						while (p && p != div) {
							p = p.parentNode;
						}

						if (p != div) {
							var ps = Core.getAbsolutePos(s);
							var ws = s.offsetWidth;
							var hs = s.offsetHeight;
							var under = ps.x + ws > pos.x && ps.x < pos.x + w && ps.y + hs > pos.y && ps.y < pos.y + h;
							if (modal) {
								if (value) {
									dis = this.selectstack[this.zindex];
									for (var j = 0, len1 = dis.length; j < len1; j++) {
										if (dis[j].select == s) {
											s.disabled = dis[j].disabled;
											s.style.visibility = dis[j].visibility;
											break;
										}
									}
								} else {
									var d = {"select": s, "disabled": s.disabled, "visibility": s.style.visibility};
									dis[dis.length] = d;
									if (under) {
										s.style.visibility = "hidden";
									} else {
										s.disabled = true;
									}
								}
							} else {
								if (under) {
									s.style.visibility = value? "" : "hidden";
								}
							}
						}
					}
					if (modal && !value) {
						this.selectstack[this.zindex - 1] = dis;
					}
				}
			}
			});
})();

dojo.provide("xsltforms.Dialog");
