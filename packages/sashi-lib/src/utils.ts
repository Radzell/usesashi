import {version} from "../package.json"

export const createSashiHtml = (baseUrl: string) => /* HTML */ `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Sashi App</title>
    </head>
    <body>
      <div id="root"></div>
      <script>
        window.__INITIAL_STATE__ = {
          apiUrl: "${baseUrl}",
          basename: "${baseUrl}/bot",
        };
      </script>
      <link
        rel="stylesheet"
        href="https://unpkg.com/@sashimo/ui@${version}/dist/styles.css"
      />
      <script
        type="module"
        src="https://unpkg.com/@sashimo/client@${version}/dist/main.mjs"
      ></script>
    </body>
  </html>`