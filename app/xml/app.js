/**
 * XML App - XML Processing Utilities
 * 
 * Provides XML parsing, validation and transformation
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { parse, HTMLElement } from "node-html-parser";

export const appConfig = {
  name: "xml",
  version: "1.0.0",
  description: "XML parsing and processing utilities",
  author: "wizardo",
  license: "MIT"
};

export function init(): void {
  console.log("📦 Initializing XML app...");
}

export function parseXML(xmlString: string): object {
  try {
    const root = parse(xmlString);
    return {
      success: true,
      data: htmlToObject(root)
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

function htmlToObject(node: HTMLElement): object {
  const obj: any = {
    tag: node.tagName,
    text: node.text?.trim() || "",
    attributes: { ...node.attributes }
  };
  
  if (node.childNodes?.length > 0) {
    obj.children = node.childNodes
      .filter((n: any) => n.tagName)
      .map((n: any) => htmlToObject(n));
  }
  
  return obj;
}

export function validateXML(xmlString: string, schema?: string): object {
  try {
    parse(xmlString);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

export function xmlToJson(xmlString: string): object {
  try {
    const root = parse(xmlString);
    return xmlToJsonObject(root);
  } catch (error) {
    return { error: (error as Error).message };
  }
}

function xmlToJsonObject(node: any): any {
  if (!node.tagName) return node.text?.trim();
  
  const obj: any = {};
  if (node.attributes) {
    Object.assign(obj, node.attributes);
  }
  
  const children = node.childNodes?.filter((n: any) => n.tagName) || [];
  if (children.length === 0) {
    return node.text?.trim() || null;
  }
  
  for (const child of children) {
    const childObj = xmlToJsonObject(child);
    if (obj[child.tagName]) {
      if (!Array.isArray(obj[child.tagName])) {
        obj[child.tagName] = [obj[child.tagName]];
      }
      obj[child.tagName].push(childObj);
    } else {
      obj[child.tagName] = childObj;
    }
  }
  
  return obj;
}

export function formatXML(xmlString: string, indent: number = 2): string {
  let formatted = "";
  let indentLevel = 0;
  
  const tokens = xmlString
    .replace(/>\s*</g, ">\n<")
    .split("\n");
  
  for (const token of tokens) {
    if (token.match(/^<\/\w/)) {
      indentLevel--;
    }
    
    formatted += " ".repeat(indentLevel * indent) + token.trim() + "\n";
    
    if (token.match(/^<\w[^>]*[^/]>/) && !token.match(/^<\w[^>]*\/>/)) {
      indentLevel++;
    }
  }
  
  return formatted.trim();
}

export default {
  config: appConfig,
  init,
  parseXML,
  validateXML,
  xmlToJson,
  formatXML
};