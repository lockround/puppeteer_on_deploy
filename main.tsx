import { Application,  puppeteer, Router } from "./deps.ts";
import { cheerio } from "https://deno.land/x/denocheerio/mod.ts";


const BROWSERLESS_TOKEN = Deno.env.get("BROWSERLESS_TOKEN");
if (BROWSERLESS_TOKEN === undefined) {
  throw new TypeError("Missing BROWSERLESS_TOKEN environment variable.");
}

const router = new Router();

router.get("/", (ctx) => {
  const rawUrl = ctx.request.url.searchParams.get("url");
  let url: URL | null = null;
  if (rawUrl !== null) {
    try {
      url = new URL(rawUrl ?? "");
    } catch {
      ctx.response.body = "Invalid URL";
      ctx.response.status = 400;
      return;
    }
  }
  
  ctx.response.body = `<!DOCTYPE html>Hello World`;
  ctx.response.type = "text/html; charset=utf-8";
});

router.get("/tiktok", async (ctx) => {
  const rawUrl = ctx.request.url.searchParams.get("url");
  let url: URL;
  try {
    url = new URL(rawUrl ?? "");
  } catch {
    ctx.response.body = "Invalid URL";
    ctx.response.status = 400;
    return;
  }
  if (url.host == "screenshot.deno.dev") {
    ctx.response.body = "Nope!";
    ctx.response.status = 400;
    return;
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`,
  });
  try {
    const page = await browser.newPage();
    await page.goto('https://www.tiktok.com/@eyeinspired/video/7252706573519310122')
  await page.waitForTimeout(5000)
  await page.click('[data-e2e=modal-close-inner-button]')
  const data = await page.evaluate(() => document.querySelector('*').outerHTML);
let comments = {}
  let $ = cheerio.load(data);
  $('[data-e2e=comment-username-1]').map((i,el) => {
    let username = $(el).text()
    comments[i] = {username}
  })
  $('[data-e2e=comment-level-1]').map((i,el) => {
    let comment = $(el).text()
    comments[i] = {...comments[i], comment}
  })
  
    const res = comments//await page.screenshot() as Uint8Array;
    ctx.response.body = res;
    ctx.response.type = "text";
  } finally {
    await browser.close();
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("error", (err) => console.error(err.message));

export default app;
