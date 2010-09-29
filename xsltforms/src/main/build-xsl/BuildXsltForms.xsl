<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:cm="http://www.agencexml.com/cm"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    
    version="2.0">
    
    <xsl:template name="cm:generate-file-header">
        <xsl:param name="component" select="." />
        <xsl:sequence select="
            concat('/*&#xA;', $component/cm:licence, '&#xA;*/&#xA;')" />
    </xsl:template>
    
	<xsl:template match="cm:component">
        <xsl:call-template name="cm:generate-file-header" />
        <xsl:apply-templates mode="cm:process-source" select="." />
    </xsl:template>
    
    <xsl:template match="@* | node()" mode="cm:process-source">
        <xsl:copy>
            <xsl:apply-templates mode="#current" select="@* | node()" />
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="cm:component" mode="cm:process-source">
        <xsl:apply-templates mode="#current" select="cm:source" />
    </xsl:template>
    
    <xsl:template match="cm:wiki" mode="cm:process-source"></xsl:template>
    
    <xsl:template match="cm:source" mode="cm:process-source">
        <xsl:apply-templates mode="#current" select="node()" />
    </xsl:template>
    
    <xsl:template name="cm:generate-import-header">
        <xsl:param name="import" as="element()" />
    </xsl:template>
    
    <xsl:template match="cm:import-components" mode="cm:process-source">
        <xsl:call-template name="cm:generate-import-header">
            <xsl:with-param name="import" select="." as="element()" />
        </xsl:call-template>
        <xsl:variable name="docURI" select="resolve-uri(@path, base-uri(.))" />
        <xsl:if test="doc-available($docURI)">
            <xsl:apply-templates mode="#current" select="
                doc($docURI)/cm:component" />
        </xsl:if>
    </xsl:template>
    	
</xsl:stylesheet>