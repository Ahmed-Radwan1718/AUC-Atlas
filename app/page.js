import fs from "node:fs";
import path from "node:path";

function readLegacyFile(relativePath) {
  return fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );
}

function extractRequiredContent(source, pattern, label) {
  const match = source.match(pattern);

  if (!match) {
    throw new Error(
      `Could not extract ${label} from the legacy homepage.`
    );
  }

  return match[1];
}

function makeInlineScriptSafe(source) {
  return source.replace(/<\/script/gi, "<\\/script");
}

function getLegacyHeaderScript() {
  const source = readLegacyFile("site-header.js");

  const legacyFooterLoader = `  if (!isAdminPage && !document.querySelector('script[src="site-footer.js"]')) {
    const footerScript = document.createElement("script");
    footerScript.src = "site-footer.js";
    footerScript.defer = true;
    document.head.appendChild(footerScript);
  }
`;

  if (!source.includes(legacyFooterLoader)) {
    throw new Error(
      "The footer-loader block in site-header.js could not be confirmed."
    );
  }

  return source.replace(legacyFooterLoader, "");
}

export default function HomePage() {
  const legacyHtml = readLegacyFile("index.html");

  const legacyStyles = extractRequiredContent(
    legacyHtml,
    /<style>([\s\S]*?)<\/style>/i,
    "the homepage styles"
  );

  const legacyBody = extractRequiredContent(
    legacyHtml,
    /<body>([\s\S]*?)<\/body>/i,
    "the homepage body"
  );

  const inlineHomepageScripts = Array.from(
    legacyHtml.matchAll(
      /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
    ),
    (match) => match[1]
  );

  const legacyBodyWithoutScripts = legacyBody.replace(
    /<script\b[\s\S]*?<\/script>/gi,
    ""
  );

  const scripts = [
    getLegacyHeaderScript(),
    readLegacyFile("data/courses.js"),
    readLegacyFile("data/professor-data.js"),
    readLegacyFile("home-search.js"),
    ...inlineHomepageScripts,
    readLegacyFile("site-footer.js")
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: legacyStyles
        }}
      />

      <div
        id="legacy-homepage-root"
        style={{ display: "contents" }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: legacyBodyWithoutScripts
        }}
      />

      {scripts.map((script, index) => (
        <script
          key={index}
          dangerouslySetInnerHTML={{
            __html: makeInlineScriptSafe(script)
          }}
        />
      ))}
    </>
  );
}
