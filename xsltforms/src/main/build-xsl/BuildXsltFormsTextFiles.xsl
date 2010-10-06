<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:cm="http://www.agencexml.com/cm"
    xmlns:js="http://www.agencexml.com/cm/js"
    version="2.0">
    
    <xsl:import href="BuildXsltForms.xsl"/>
    
    <xsl:template mode="cm:process-source" match="js:*" ></xsl:template>
    
    <xsl:output method="text" />
    
</xsl:stylesheet>