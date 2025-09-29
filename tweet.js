import puppeteer from "puppeteer";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


const USERNAME = process.env.TWUSERNAME;
const PASSWORD = process.env.PASSWORD;
console.log(USERNAME,PASSWORD)
const SESSION_FILE = "./session.json";
const VISIBLE= process.env.VISIBLE === "true"

export async function tweet(TWEET_TEXT) {
    const browser = await puppeteer.launch({
    headless: VISIBLE ? false : "new", // o true → no abre ventana
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
    ]
    });
    const page = await browser.newPage();

    // Intentar cargar cookies previas
    if (fs.existsSync(SESSION_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
        await page.setCookie(...cookies);
    }

    // Ir a la home
    await page.goto("https://x.com/home", { waitUntil: "networkidle2" });

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


 