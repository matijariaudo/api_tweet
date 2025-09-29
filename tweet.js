
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());


const USERNAME = "@btcnews_es";
const EMAIL = process.env.TWUSERNAME;
const PASSWORD = process.env.PASSWORD;
console.log(USERNAME,PASSWORD,EMAIL)
const SESSION_FILE = "./session.json"   ;



export async function tweet(TWEET_TEXT) {
    const browser = await puppeteer.launch({
    headless: "new",
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
        "--window-size=1280,800"
    ]
    });
    const page = await browser.newPage();
    if (fs.existsSync(SESSION_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
        await page.setCookie(...cookies);
    }

    // Ir a la home
    await page.goto("https://x.com/home", { waitUntil: "networkidle2" });
        // Esperar un poco y sacar screenshot
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: "images/step0_home.png", fullPage: true });

    // Verificar si apareció la pantalla de error
    const retryBtn = await page.$('text/Retry');
    if (retryBtn) {
    console.log("⚠️ Página falló, reintentando con F5....");
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: "images/step01_home.png", fullPage: true });
    }

    // Verificar si pide login (no hay sesión válida)
    console.log("Chequeando sesión...");
    let loginNeeded = false;
    try {
        await page.screenshot({ path: "images/step1_home.png", fullPage: true });
        await page.waitForSelector('input[autocomplete="username"]', {
        timeout: 60000, // espera máx 5s
        visible: true
        });
        loginNeeded = true;  // apareció → necesita login
    } catch (e) {
        await page.screenshot({ path: "images/step2_home.png", fullPage: true });
        loginNeeded = false; // no apareció → ya logueado
    }
    console.log(loginNeeded)
    if (loginNeeded) {
        console.log("🔑 No hay sesión, iniciando login-->",USERNAME);
        // Ir al login
        //await page.goto("https://x.com/login", { waitUntil: "networkidle2" });
        // Usuario
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: "images/step3_home.png", fullPage: true });
        console.log("captura3")
        await page.waitForSelector('input[autocomplete="username"]', { visible: true });
        await page.type('input[autocomplete="username"]', USERNAME, { delay: 50 });
        console.log("Se ingreso usuario ",USERNAME)
        await page.keyboard.press("Enter");
        try {
            // espera a que aparezca el input de email/teléfono/usuario
            await new Promise(resolve => setTimeout(resolve, 5000));
            await page.screenshot({ path: "images/step4_home.png", fullPage: true });
            console.log("captura4")
            await page.waitForSelector('input[data-testid="ocfEnterTextTextInput"]', { visible: true ,timeout: 60000});
            await page.type('input[data-testid="ocfEnterTextTextInput"]', EMAIL, { delay: 50 });
            await page.keyboard.press("Enter");
        } catch (e) {
            console.error("No apareció el input de verificación extra:", e);
        }
        // Password
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: "images/step5_home.png", fullPage: true });
        console.log("captura5")
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


 