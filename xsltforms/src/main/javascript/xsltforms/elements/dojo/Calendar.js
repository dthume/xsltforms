dojo.provide("xsltforms.elements.dojo.Calendar");

dojo.require("xsltforms");

(function() {
    
    var Calendar = dojo.declare("xsltforms.elements.dojo.Calendar", null,
    {
        constructor: function(xform) {
            this.xform = xform;
            var Event = this.xform.getEventManager();
            var I8N = this.xform.getI8N();
            
            var calendar = this;
            var body = Core.isXhtml ?
                    document.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", "body")[0]
                  : document.getElementsByTagName("body")[0];
            
            this.element = Core.createElement("table", body, null, "calendar");

            var tHead = Core.createElement("thead", this.element);
            var trTitle = Core.createElement("tr", tHead);
            var title = Core.createElement("td", trTitle, null, "title");
            title.colSpan = 7;

            this.selectMonth = Core.createElement("select", title);
            Event.attach(this.selectMonth, "change", function() {
                calendar.refresh();
            });

            for (var i = 0; i < 12; i++) {
                var o = Core.createElement("option", this.selectMonth, I8N.get("calendar.month" + i));
                o.setAttribute("value", i);
            }

            this.inputYear = Core.createElement("input", title);
            this.inputYear.readOnly = true;
            Event.attach(this.inputYear, "mouseup", function() {
                calendar.yearList.show();
            });
            Event.attach(this.inputYear, "change", function() {
                calendar.refresh();
            });
            
            var close = Core.createElement("button", title, "X");
            close.setAttribute("title", "Close");
            
            Event.attach(close, "click", function() {
                calendar.close();
            });
            
            var trDays = Core.createElement("tr", tHead, null, "names");
            var ini = parseInt(I8N.get("calendar.initDay"), 10);
            
            for (var j = 0; j < 7; j++) {
                var ind = (j + ini) % 7;
                this.createElement(trDays, "name", I8N.get("calendar.day" + ind));
            }

            this.tBody = Core.createElement("tbody", this.element);

            var handler = function(event) {
                var value = Event.getTarget(event).childNodes[0].nodeValue;
                var cal = calendar;
                
                if (value != "") {
                    cal.day = value;
                    var date = new Date();
                    date.setYear(cal.inputYear.value);
                    date.setMonth(cal.selectMonth.value);
                    date.setDate(cal.day);
                    
                    if (cal.isTimestamp) {
                        date.setSeconds(cal.inputSec.value);
                        date.setMinutes(cal.inputMin.value);
                        date.setHours(cal.inputHour.value);
                        cal.input.value = I8N.format(date, null, true);
                    } else {
                        cal.input.value = I8N.formatDate(date);
                    }
                    
                    cal.close();
                    Event.dispatch(cal.input, "keyup");
                    cal.input.focus();
                }
            };

            for (var dtr = 0; dtr < 6; dtr++) {
                var trLine = Core.createElement("tr", this.tBody);
                
                for (var day = 0; day < 7; day++) {
                    this.createElement(trLine, "day", " ", 1, handler);
                }
            }
    
            var tFoot = Core.createElement("tfoot", this.element);
            var trFoot = Core.createElement("tr", tFoot);
            var tdFoot = Core.createElement("td", trFoot);
            tdFoot.colSpan = 7;
            
            this.inputHour = Core.createElement("input", tdFoot);
            this.inputHour.readOnly = true;
            Event.attach(this.inputHour, "mouseup", function() {
                calendar.hourList.show();
            } );
    
            tdFoot.appendChild(document.createTextNode(":"));
            this.inputMin = Core.createElement("input", tdFoot);
            this.inputMin.readOnly = true;
            Event.attach(this.inputMin, "mouseup", function() {
                calendar.minList.show();
            });

            tdFoot.appendChild(document.createTextNode(":"));
            this.inputSec = Core.createElement("input", tdFoot);
            this.inputSec.readOnly = true;
            Event.attach(this.inputSec, "mouseup", function() {
                if (calendar.type >= Calendar.SECONDS) {
                    calendar.secList.show();
                }
            });
            this.yearList = new NumberList(title, "calendarList", this.inputYear, 1900, 2050, null, xform);
            this.hourList = new NumberList(tdFoot, "calendarList", this.inputHour, 0, 23, 2, xform);
            this.minList = new NumberList(tdFoot, "calendarList", this.inputMin, 0, 59, 2, xform);
            this.secList = new NumberList(tdFoot, "calendarList", this.inputSec, 0, 59, 2, xform);
        },
        close: function() {
            this.yearList.close();
            this.xform.getDialog().hide(this.element, false);
        },
        today: function() {
            this.refreshControls(new Date());
        },
        refreshControls: function(date) {
            this.day = date.getDate();
            this.selectMonth.value = date.getMonth();
            this.inputYear.value = date.getYear() < 1000? 1900 + date.getYear() : date.getYear();

            if (this.isTimestamp) {
                this.inputHour.value = zeros(date.getHours(), 2);
                this.inputMin.value = this.type >= Calendar.MINUTES? zeros(date.getMinutes(), 2) : "00";
                this.inputSec.value = this.type >= Calendar.SECONDS? zeros(date.getSeconds(), 2) : "00";
            }
        
            this.refresh();
        },
        refresh: function() {
            var I8N = this.xform.getI8N();
            
            var firstDay = this.getFirstDay();
            var daysOfMonth = this.getDaysOfMonth();
            var ini = parseInt(I8N.get("calendar.initDay"), 10);
            var cont = 0;
            var day = 1;
            var currentMonthYear = this.selectMonth.value == this.currentMonth
                && this.inputYear.value == this.currentYear;
            
            for (var i = 0; i < 6; i++) {
                var trLine = this.tBody.childNodes[i];

                for (var j = 0; j < 7; j++, cont++) {
                    var cell = trLine.childNodes[j];
                    var dayInMonth = (cont >= firstDay && cont < firstDay + daysOfMonth);
                    Core.setClass(cell, "hover", false);
                    Core.setClass(cell, "today", currentMonthYear && day == this.currentDay);
                    Core.setClass(cell, "selected", dayInMonth && day == this.day);
                    Core.setClass(cell, "weekend", (j+ini)%7 > 4);

                    cell.firstChild.nodeValue = dayInMonth ? day++ : "";
                }
            }
        },
        getFirstDay: function() {
            var I8N = this.xform.getI8N();
            
            var date = new Date();
            date.setDate(1);
            date.setMonth(this.selectMonth.value);
            date.setYear(this.inputYear.value);
            var ini = parseInt(I8N.get("calendar.initDay"), 10);
            var d = date.getDay();
            return (d + (6 - ini)) % 7;
        },
        getDaysOfMonth: function() {
            var year = this.inputYear.value;
            var month = this.selectMonth.value;

            if (month == 1 && ((0 === (year % 4)) && (   (0 !== (year % 100))
                    || (0 === (year % 400))))) {
                return 29;
            }

            return Calendar.daysOfMonth[this.selectMonth.value];
        },
        getDaysOfMonth: function() {
            var year = this.inputYear.value;
            var month = this.selectMonth.value;

            if (month == 1 && ((0 === (year % 4)) && (   (0 !== (year % 100))
                    || (0 === (year % 400))))) {
                return 29;
            }

            return Calendar.daysOfMonth[this.selectMonth.value];
        },
        createElement: function(parent, className, text, colspan, handler) {
            var Event = this.xform.getEventManager();
            var element = Core.createElement("td", parent, text, className);
            
            if (colspan > 1) {
                element.colSpan = colspan;
            }
            
            if (handler) {
                Event.attach(element, "click", handler);
                Core.initHover(Event, element);
            }

            return element;
        }
    });

    Calendar.daysOfMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    Calendar.ONLY_DATE = 0;
    Calendar.HOURS = 1;
    Calendar.MINUTES = 2;
    Calendar.SECONDS = 3;
    
    Calendar.show = function(widget) {
        var Dialog = widget.xform.getDialog();
        var I8N = widget.xform.getI8N();
        
        var input = widget.input;
        var type = widget.type["class"] == "datetime" ?
                Calendar.SECONDS : Calendar.ONLY_DATE;
        var cal = widget.calendar;
        
        if (!cal) {
            cal = new Calendar(widget.xform);
            widget.calendar = cal;
        }

        cal.input = input;
        cal.type = type;
        cal.isTimestamp = type != Calendar.ONLY_DATE;
        Core.setClass(cal.element, "date", !cal.isTimestamp);
        var date;
        
        try {
            date = cal.isTimestamp? I8N.parse(input.value) : I8N.parseDate(input.value);
        } catch (e) { date = new Date(); }
        
        if (date != null) {
            cal.refreshControls(date);
        } else {
            cal.today();
        }
    
        Dialog.show(cal.element, input, false);
    };

})();