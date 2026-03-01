# Template App

A template app for wizardo - use this as a starting point for creating new apps.

## Overview

This is a template application for wizardo, a simple and fast file storage service. Use this as a starting point when creating new apps for the wizardo platform.

## App Structure

```
template/
├── appinfo.xml      # App metadata
├── app.js           # Main app module
├── index.js         # Entry point
├── README.md        # This file
└── routers/
    ├── index.js     # Main router
    └── health.js    # Health check router
```

## App Metadata

The `appinfo.xml` file contains the app's metadata:

- **name**: Display name
- **appname**: Internal app identifier
- **version**: App version
- **description**: Brief description
- **author**: App author
- **license**: License type (MIT)
- **categories**: App categories
- **dependencies**: Required dependencies (core, webdav, mime)
- **permissions**: App permissions

## Routers

Routers handle HTTP requests to your app. Each router must export:

- `path`: URL path (e.g., "/template")
- `method`: HTTP method (get, post, put, delete, use)
- `priority`: Load priority (higher loads first)
- `handler`: Request handler function

### Example Router

```javascript
import { Request, Response, NextFunction } from "express";

export const path = "/myendpoint";
export const method = "get";
export const priority = 10;

export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({ message: "Hello from my app!" });
  } catch (error) {
    next(error);
  }
}
```

## Creating a New App

1. Copy this template folder
2. Rename the folder to your app name
3. Update `appinfo.xml` with your app's details
4. Add your routers in the `routers/` folder
5. Implement your app logic in `app.js`

## Dependencies

- com.wizardo.core (1.0.0+)
- com.wizardo.webdav (1.0.0+)
- com.wizardo.mime (1.0.0+)

## License

MIT

## Author

wizardo maillist <~lunalov2/wizardo@lists.sr.ht>