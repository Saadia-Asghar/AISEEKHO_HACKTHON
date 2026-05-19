import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { background-color: #131315; height: 100%; margin: 0; }
              html[data-theme="light"], html[data-theme="light"] body, html[data-theme="light"] #root { background-color: #f8f9fb; }
              body { overflow: auto; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
