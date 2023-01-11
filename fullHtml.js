const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

const links = [
  "confirmation",
  "contact-us-success",
  "forgot-password",
  "moderation-success",
  "new-password-code",
  "new-offer-success",
  "profile-edit-request",
  "profile-edit-success",
  "your-offer-accepted",
  "register-success",
  "sign-documents"
]

async function writeEmailPageToFile(linkName, data) {
  fs.writeFile(`emails/${linkName}.hbs`, data, function (err) {
    if (err) {
      return console.error(err);
    }
  });
}

async function cleanHtml(htmlSource) {
  const $ = cheerio.load(htmlSource)
  return $.html($('.email'))
}

async function main() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    links.forEach(async (link) => {
      const page = await browser.newPage();
      await page.goto(`http://localhost:5173/email/${link}`, {
        waitUntil: "networkidle0",
      });

      const inlinerPage = await browser.newPage();
      await inlinerPage.goto("https://htmlemail.io/inline/");
      await inlinerPage.waitForSelector(".inliner__input");

      const source = await page.evaluate(
        () => document.querySelector("*").outerHTML
      );


      let inlinedSource = await inlinerPage.evaluate(async (source) => {
        return new Promise((resolve, reject) => {
          const input = document.querySelector(".inliner__input>textarea");
          input.focus();
          input.value = source;
          input.dispatchEvent(new Event("input"));
          const output = document.querySelector(".inliner__output>textarea");
          setTimeout(() => {
            resolve(output.value);
          }, 500);
        });
        // pass data to evaluate
      }, source);
      inlinedSource = await cleanHtml(inlinedSource)

      writeEmailPageToFile(link, inlinedSource);
    });
    //
    // await browser.close();
  } catch (err) {
    console.error(err);
  }
}
main();
