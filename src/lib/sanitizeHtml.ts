/**
 * HTML Sanitization Utility
 *
 * Purpose: Prevent XSS attacks by sanitizing user-provided HTML
 * Used for: Voucher terms and conditions
 *
 * This uses a simple whitelist approach for allowed tags and attributes.
 * For production, consider using a library like DOMPurify or sanitize-html.
 */

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
}

const DEFAULT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "div",
  "blockquote",
  "code",
  "pre",
];

const DEFAULT_ALLOWED_ATTRIBUTES: { [key: string]: string[] } = {
  a: ["href", "title", "target", "rel"],
  span: ["class"],
  div: ["class"],
  code: ["class"],
  pre: ["class"],
};

/**
 * Basic HTML sanitizer using regex patterns
 * This is a simple implementation - for production use DOMPurify
 */
export function sanitizeHtml(
  html: string,
  options: SanitizeOptions = {}
): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  const allowedTags = options.allowedTags || DEFAULT_ALLOWED_TAGS;
  const allowedAttrs = options.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES;

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  // Remove style tags and their content
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ""
  );

  // Remove iframe tags
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ""
  );

  // Remove object and embed tags
  sanitized = sanitized.replace(
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    ""
  );
  sanitized = sanitized.replace(/<embed\b[^<]*>/gi, "");

  // Remove link tags (can load external CSS with XSS)
  sanitized = sanitized.replace(/<link\b[^<]*>/gi, "");

  // Remove meta tags
  sanitized = sanitized.replace(/<meta\b[^<]*>/gi, "");

  // Remove base tags
  sanitized = sanitized.replace(/<base\b[^<]*>/gi, "");

  // Remove form tags
  sanitized = sanitized.replace(
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    ""
  );

  // Clean up attributes - remove all except whitelisted ones
  allowedTags.forEach((tag) => {
    const allowedAttributesForTag = allowedAttrs[tag] || [];

    // Find all instances of this tag
    const tagRegex = new RegExp(`<${tag}\\s+([^>]*)>`, "gi");
    sanitized = sanitized.replace(tagRegex, (match, attrs) => {
      if (!allowedAttributesForTag.length) {
        return `<${tag}>`;
      }

      // Extract and filter attributes
      const cleanAttrs = allowedAttributesForTag
        .map((attr) => {
          const attrRegex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i");
          const attrMatch = attrs.match(attrRegex);
          return attrMatch ? `${attr}="${attrMatch[1]}"` : null;
        })
        .filter(Boolean)
        .join(" ");

      return cleanAttrs ? `<${tag} ${cleanAttrs}>` : `<${tag}>`;
    });
  });

  // Remove any tags not in the whitelist
  const allowedTagsPattern = allowedTags.join("|");
  const disallowedTagsRegex = new RegExp(
    `<(?!\\/?(${allowedTagsPattern})\\b)[^>]+>`,
    "gi"
  );
  sanitized = sanitized.replace(disallowedTagsRegex, "");

  return sanitized.trim();
}

/**
 * Escape HTML to prevent XSS when displaying user content as text
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const htmlEscapeMap: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  return html.replace(/<[^>]*>/g, "").trim();
}
