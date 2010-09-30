Selenium.prototype.getXFormFieldLabel = function(locator) {
   var field = this.page().findElement(locator);
   var label = dojo.query(".label", field);
   if (1 != label.length) {
       throw new Error("Expected 1 label, found: " + label.length);
   }
   return label[0];
};