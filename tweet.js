import puppeteer from "puppeteer";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


const USERNAME = process.env.TWUSERNAME;
const PASSWORD = process.env.PASSWORD;
console.log(USERNAME,PASSWORD)
const SESSION_FILE = "./session.json";
const VISIBLE= process.env.VISIBLE === "true"
const isHeadlessNew = !VISIBLE; // si VISIBLE=false -> usamos "new" (headless)

/* args comunes */
const baseArgs = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--disable-gpu",
  "--no-zygote",
  "--single-process",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-features=site-per-process,TranslateUI",
  "--mute-audio",
  "--hide-scrollbars",
  "--disable-infobars",
  "--disable-popup-blocking",
  "--window-size=1280,800"
];

const headlessExtra = [
  // ayudan a evitar detection en algunos casos
  "--disable-blink-features=AutomationControlled",
  "--disable-features=IsolateOrigins,site-per-process",
  "--enable-automation=false"
];

const launchArgs = isHeadlessNew ? baseArgs.concat(headlessExtra) : baseArgs;

export async function tweet(TWEET_TEXT) {
    const browser = await puppeteer.launch({
    headless: isHeadlessNew ? "new" : false,
    args: launchArgs,
    defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();

    // Intentar cargar cookies previas
    if (fs.existsSync(SESSION_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
        await page.setCookie(...cookies);
    }

    // Ir a la home
    await page.goto("https://x.com/home", { waitUntil: "networkidle2" });
        // Esperar un poco y sacar screenshot
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: "step_home.png", fullPage: true });

    // Verificar si apareció la pantalla de error
    const retryBtn = await page.$('text/Retry');
    if (retryBtn) {
    console.log("⚠️ Página falló, reintentando con F5...");
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: "step_home_retry.png", fullPage: true });
    }

    // Verificar si pide login (no hay sesión válida)
    console.log("Chequeando sesión...");
    let loginNeeded = false;
    try {
        await page.screenshot({ path: "step1_home.png", fullPage: true });
        await page.waitForSelector('input[autocomplete="username"]', {
        timeout: 60000, // espera máx 5s
        visible: true
        });
        loginNeeded = true;  // apareció → necesita login
    } catch (e) {
        await page.screenshot({ path: "step2_home.png", fullPage: true });
        loginNeeded = false; // no apareció → ya logueado
    }
    console.log(loginNeeded)

    if (loginNeeded) {
        console.log("🔑 No hay sesión, iniciando login-->",USERNAME);

        // Ir al login
        await page.goto("https://x.com/login", { waitUntil: "networkidle2" });

        // Usuario
        await page.waitForSelector('input[autocomplete="username"]', { visible: true });
        await page.type('input[autocomplete="username"]', USERNAME, { delay: 50 });
        console.log("Se ingreso usuario ",USERNAME)
        await page.keyboard.press("Enter");
        
        // Password
        await page.waitForSelector('input[autocomplete="current-password"]', { visible: true });
        await page.type('input[autocomplete="current-password"]', PASSWORD, { delay: 50 });
        await page.keyboard.press("Enter");

        await page.waitForNavigation({ waitUntil: "networkidle2" });
    } else {
        console.log("👌 Sesión activa, no se requiere login.");
    }

    // siempre después de twittear o al final
    const cookies = await page.cookies();
    fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
    console.log("💾 Cookies actualizadas");

    // Escribir tweet
    await page.waitForSelector('div[data-testid="tweetTextarea_0"]', { visible: true });
    await page.click('div[data-testid="tweetTextarea_0"]');
    await page.keyboard.type(TWEET_TEXT, { delay: 50 });

    // Publicar
    await page.waitForSelector('button[data-testid="tweetButtonInline"]:not([disabled])', { visible: true });
    await page.click('button[data-testid="tweetButtonInline"]:not([disabled])');

    // Esperar 3 segundos antes de cerrar
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("✅ Tweet publicado!");
    await browser.close();
    return {
        success: true,
        text: TWEET_TEXT,
        timestamp: new Date().toISOString()
    };
}


 