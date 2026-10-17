import { defineMiddleware } from "astro:middleware";

// function available with `manual` routing
import { redirectToDefaultLocale, pathHasLocale } from "astro:i18n";

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (!pathHasLocale(ctx.url.pathname)) {
    const redirectResponse = redirectToDefaultLocale(ctx, 302);
    if (!redirectResponse) {
      return new Response("Redirect failed", { status: 500 });
    }
    return redirectResponse;
  }
  return next();
});
