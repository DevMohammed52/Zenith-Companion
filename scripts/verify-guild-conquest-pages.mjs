import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const GUILD_MODAL_ID = 2;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function waitForText(page, text) {
  await page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ state: "visible", timeout: 15000 });
}

async function expectNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(
    overflow.scrollWidth <= overflow.width + 2 && overflow.bodyScrollWidth <= overflow.width + 2,
    `${label} has horizontal overflow: ${JSON.stringify(overflow)}`,
  );
}

async function openPage(browser, path, viewport, label) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await expectNoHorizontalOverflow(page, label);
  return { page, consoleErrors };
}

async function verifyGuildPage(browser) {
  const database = await readJson("public/guild-database.json");
  const detail = await readJson(`public/guild-details/${GUILD_MODAL_ID}.json`);

  assert(database.guilds.length >= 1000, `Expected a large guild registry, got ${database.guilds.length}`);
  assert(database.meta.totals.members >= 10000, `Expected member totals, got ${database.meta.totals.members}`);
  assert(detail.members.length >= 20, `Expected full member details for guild ${GUILD_MODAL_ID}`);
  assert(
    detail.member_summary.leaders.some((member) => member.position === "LEADER") &&
      detail.member_summary.leaders.some((member) => member.position === "DEPUTY") &&
      detail.member_summary.leaders.some((member) => member.position === "OFFICER"),
    "Guild detail fixture must include leader, deputy, and officer roles for hierarchy verification",
  );

  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 950 },
    mobile: { width: 390, height: 844 },
  })) {
    const { page, consoleErrors } = await openPage(browser, "/guilds", viewport, `guilds ${name}`);

    await waitForText(page, "Guild Database");
    await waitForText(page, "Guilds indexed");
    await waitForText(page, "Member rows");
    await waitForText(page, "France");

    const nativeSelects = await page.locator("select").count();
    assert(nativeSelects === 0, `Guild page has ${nativeSelects} native select controls`);

    const initialRows = await page.locator("tbody tr").count();
    assert(initialRows > 0 && initialRows <= 90, `Guild page should render an initial row window, got ${initialRows}`);

    const sortButton = page.getByRole("button", { name: /Sort:/ });
    await sortButton.click();
    await page.getByRole("listbox", { name: "Sort guilds" }).waitFor({ state: "visible" });
    await page.getByRole("option", { name: "Members" }).click();
    await expectNoHorizontalOverflow(page, `guilds ${name} after sort`);

    await page.getByPlaceholder("Search guild, tag, leader, top member, or ID").fill("END");
    await waitForText(page, "#2 - END");

    const activeButton = page.getByRole("button", { name: "Active", exact: true });
    await activeButton.click();
    await waitForText(page, "END");

    await page.goto(`${BASE_URL}/guilds?guild=${GUILD_MODAL_ID}`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Guild Database");
    await waitForText(page, "END");

    const modal = page.getByRole("dialog", { name: "END" });
    await modal.waitFor({ state: "visible", timeout: 15000 });
    const modalBox = await modal.boundingBox();
    assert(modalBox, "Guild inspection modal did not produce a bounding box");
    assert(Math.abs(modalBox.x + modalBox.width / 2 - viewport.width / 2) < Math.max(120, viewport.width * 0.18), "Guild modal is not centered enough");

    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    assert(bodyOverflow === "hidden", "Guild modal should lock body scrolling");

    const backdropStyle = await page.locator('div[class*="modalBackdrop"]').evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        zIndex: style.zIndex,
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        background: style.backgroundColor,
      };
    });
    assert(Number(backdropStyle.zIndex) >= 1000, `Guild modal backdrop z-index is too low: ${backdropStyle.zIndex}`);
    assert(backdropStyle.backdropFilter.includes("blur"), "Guild modal backdrop should blur the page behind it");

    await waitForText(page, "Guild Bio");
    await waitForText(page, "Join Requirement");
    await waitForText(page, "All Members");

    const leaderText = await modal.locator("text=Leader").first().textContent();
    const deputyText = await modal.locator("text=Deputy").first().textContent();
    const officerText = await modal.locator("text=Officer").first().textContent();
    assert(leaderText && deputyText && officerText, "Guild leadership hierarchy is missing leader, deputy, or officer");

    const leaderOrder = await modal.evaluate((root) => {
      const text = root.textContent || "";
      return {
        leader: text.indexOf("Leader"),
        deputy: text.indexOf("Deputy"),
        officer: text.indexOf("Officer"),
      };
    });
    assert(
      leaderOrder.leader > -1 && leaderOrder.deputy > leaderOrder.leader && leaderOrder.officer > leaderOrder.deputy,
      `Leadership hierarchy is not Leader -> Deputy -> Officer: ${JSON.stringify(leaderOrder)}`,
    );

    const memberLinks = await modal.locator('a[href^="https://web.idle-mmo.com/@"]').count();
    assert(memberLinks >= detail.members.length, `Expected member profile links for all members, got ${memberLinks}`);

    await page.keyboard.press("Escape");
    await modal.waitFor({ state: "hidden", timeout: 5000 });
    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    assert(restoredOverflow !== "hidden", "Guild modal did not restore body scrolling after close");

    assert(consoleErrors.length === 0, `Guild page ${name} console errors:\n${consoleErrors.join("\n")}`);
    await page.close();
  }
}

async function verifyConquestPage(browser) {
  const data = await readJson("public/conquest-data.json");
  assert(data.zones.length === 10, `Expected 10 conquest zones, got ${data.zones.length}`);
  assert(data.top_contributors.length > 0, "Expected global conquest contributors");

  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 950 },
    mobile: { width: 390, height: 844 },
  })) {
    const { page, consoleErrors } = await openPage(browser, "/conquest", viewport, `conquest ${name}`);

    await waitForText(page, "Conquest");
    await waitForText(page, "Active Now");
    await waitForText(page, "Closest Zone");
    await waitForText(page, "Most Rewarding");
    await waitForText(page, "Strong Holds");

    const bodyText = await page.locator("main").innerText();
    for (const forbidden of ["Snapshot Diagnosis", "Conquest Command", "fetch request", "API request", "endpoint"]) {
      assert(!bodyText.toLowerCase().includes(forbidden.toLowerCase()), `Conquest page leaked technical wording: ${forbidden}`);
    }

    const nativeSelects = await page.locator("select").count();
    assert(nativeSelects === 0, `Conquest page has ${nativeSelects} native select controls`);

    const zoneCards = await page.locator("article").filter({ has: page.locator("button") }).count();
    assert(zoneCards >= data.zones.length, `Expected visible zone cards, got ${zoneCards}`);

    await page.getByRole("button", { name: "Active Assaults" }).click();
    await waitForText(page, "Zone Details");
    await expectNoHorizontalOverflow(page, `conquest ${name} active filter`);

    await page.getByRole("button", { name: "Contested" }).click();
    await waitForText(page, "Zone Details");

    await page.getByRole("button", { name: "Dominated" }).click();
    await waitForText(page, "Zone Details");

    await page.getByRole("button", { name: "All Zones" }).click();
    await waitForText(page, "Zone Details");

    const mapLinks = await page.locator('a[href^="/map?location="]').count();
    assert(mapLinks >= data.zones.length, `Expected map links for conquest zones, got ${mapLinks}`);

    await page.getByRole("tab", { name: "Guilds" }).click();
    const guildLinks = await page.locator('a[href^="/guilds?guild="], a[href^="/guilds?search="]').count();
    assert(guildLinks > 0, "Conquest page should link guild rows to the guild database");

    await page.getByRole("tab", { name: "Contributors" }).click();
    await waitForText(page, "XP/kill");
    const profileLinks = await page.locator('a[href^="https://web.idle-mmo.com/@"]').count();
    assert(profileLinks > 0, "Conquest contributor rows should link player profiles");

    await page.getByRole("tab", { name: "Assaults" }).click();
    await page.locator("#conquest-panel-assaults").waitFor({ state: "visible", timeout: 5000 });

    const firstGuildHref = await page.locator('a[href^="/guilds?guild="], a[href^="/guilds?search="]').first().getAttribute("href");
    assert(firstGuildHref, "Could not find conquest guild deep link");
    await page.goto(`${BASE_URL}${firstGuildHref}`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Guild Database");

    assert(consoleErrors.length === 0, `Conquest page ${name} console errors:\n${consoleErrors.join("\n")}`);
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  try {
    await verifyGuildPage(browser);
    await verifyConquestPage(browser);
  } finally {
    await browser.close();
  }
  console.log("Guild and conquest page verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
