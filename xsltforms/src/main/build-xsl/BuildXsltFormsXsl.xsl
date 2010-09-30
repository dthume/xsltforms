<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:cm="http://www.agencexml.com/cm"
    xmlns:exe="http://www.agencexml.com/cm/alias/www.w3.org/1999/XSL/Transform"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    
    exclude-result-prefixes="cm"
    version="2.0">
    
    <xsl:import href="BuildXsltForms.xsl"/>
    
    <xsl:namespace-alias result-prefix="xsl" stylesheet-prefix="exe"/>
    
    <xsl:output method="xml" indent="yes" />
    
    <xsl:variable name="topLevelNS" as="element()*">
        <ns name="ajx" uri="http://www.ajaxforms.net/2006/ajx" />
        <ns name="cm" uri="http://www.agencexml.com/cm" />
        <ns name="default" uri="http://www.w3.org/1999/xhtml" />
        <ns name="ev" uri="http://www.w3.org/2001/xml-events" />
        <ns name="exslt" uri="http://exslt.org/common" />
        <ns name="msxsl" uri="urn:schemas-microsoft-com:xslt" />
        <ns name="txs" uri="http://www.agencexml.com/txs" />
        <ns name="xforms" uri="http://www.w3.org/2002/xforms" />
        <ns name="xhtml" uri="http://www.w3.org/1999/xhtml" />
        <ns name="xsi" uri="http://www.w3.org/2001/XMLSchema-instance" />
        <ns name="xsd" uri="http://www.w3.org/2001/XMLSchema" />
    </xsl:variable>
    
    <xsl:attribute-set name="topLevelAttrs">
        <xsl:attribute name="version">1.0</xsl:attribute>
    </xsl:attribute-set>
    
	<xsl:template match="cm:component">
        <xsl:text>&#xA;</xsl:text>
        <xsl:comment select="concat('&#xA;', cm:licence, '&#xA;')" />
        <xsl:text>&#xA;</xsl:text>
        <xsl:element name="xsl:stylesheet" use-attribute-sets="topLevelAttrs">
            <xsl:for-each select="$topLevelNS">
                <xsl:namespace name="{@name}" select="@uri" />    
            </xsl:for-each>
            <exe:output method="html" encoding="iso-8859-1"
                omit-xml-declaration="no" indent="no"
                doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN"
                doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"/>
            <xsl:apply-templates mode="cm:process-source" select="." />
        </xsl:element>
    </xsl:template>
    
    <xsl:template mode="cm:process-source" match="
        cm:source/text()"></xsl:template>
    
    <xsl:template name="cm:generate-import-header">
        <xsl:param name="import" as="element()" />
        <xsl:variable name="docURI" as="xsd:anyURI" select="
            resolve-uri($import/@path, base-uri($import))" />
        <xsl:text>&#xA;</xsl:text>
        <xsl:comment select="concat('&#xA;', $docURI, '&#xA;')" />
        <xsl:text>&#xA;</xsl:text>
    </xsl:template>
    	
</xsl:stylesheet>