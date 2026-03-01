/**
 * XML App Router
 * 
 * Handles /xml API endpoints
 * 
 * Copyright (C) 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 */

import { Request, Response, NextFunction } from "express";
import { parseXML, validateXML, xmlToJson, formatXML } from "../app.js";

export const path = "/xml";
export const method = "use";
export const priority = 10;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const basePath = "/xml";
    
    if (req.path === "/parse" && req.method === "POST") {
      const { xml } = req.body;
      if (!xml) {
        res.status(400).json({ error: "XML content required" });
        return;
      }
      res.json(parseXML(xml));
      return;
    }
    
    if (req.path === "/validate" && req.method === "POST") {
      const { xml, schema } = req.body;
      if (!xml) {
        res.status(400).json({ error: "XML content required" });
        return;
      }
      res.json(validateXML(xml, schema));
      return;
    }
    
    if (req.path === "/to-json" && req.method === "POST") {
      const { xml } = req.body;
      if (!xml) {
        res.status(400).json({ error: "XML content required" });
        return;
      }
      res.json(xmlToJson(xml));
      return;
    }
    
    if (req.path === "/format" && req.method === "POST") {
      const { xml, indent } = req.body;
      if (!xml) {
        res.status(400).json({ error: "XML content required" });
        return;
      }
      res.json({ formatted: formatXML(xml, indent || 2) });
      return;
    }
    
    res.json({
      app: "xml",
      version: "1.0.0",
      endpoints: [
        { path: "/xml/parse", method: "POST", description: "Parse XML" },
        { path: "/xml/validate", method: "POST", description: "Validate XML" },
        { path: "/xml/to-json", method: "POST", description: "Convert XML to JSON" },
        { path: "/xml/format", method: "POST", description: "Format/beautify XML" }
      ]
    });
  } catch (error) {
    next(error);
  }
}