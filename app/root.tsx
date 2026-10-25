/**
 * Root Document for Storeanalysis
 * Storeanalysis - Pranshu Singh Baghel
 */

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <link rel="icon" type="image/png" href="/storeanalysis-logo.png" />
        <link rel="apple-touch-icon" href="/storeanalysis-logo.png" />
        <link rel="shortcut icon" href="/storeanalysis-logo.png" />
        <title>Storeanalysis — Store Intelligence & Analytics</title>
        <Meta />
        <Links />
      </head>
      <body style={{ margin: 0, fontFamily: "Inter, sans-serif" }}>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
