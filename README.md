# 🐦 Auto-Tweeter con Puppeteer & Express

Este proyecto permite **publicar tweets automáticamente** en X (antes Twitter) usando [Puppeteer](https://pptr.dev/) para controlar el navegador y [Express](https://expressjs.com/) como API backend.  

## ✨ Características
- 📌 Endpoint HTTP sencillo para enviar tweets (`/tweet?text=...`)
- 💾 Manejo de sesión con cookies guardadas en `session.json`
- 🔐 Uso de `.env` para credenciales seguras
- ⚡ Respuesta inmediata (el tweet se procesa en segundo plano)

---

## ⚙️ Requisitos
- Node.js >= 18
- npm o yarn

---

## 🚀 Instalación

Clonar el repositorio:

```bash
git clone https://github.com/tuusuario/auto-tweeter.git
cd auto-tweeter
```

Instalar dependencias:

```bash
npm install
```

---

## 🔑 Configuración

Crear un archivo **`.env`** en la raíz del proyecto con las siguientes variables:

```env
USERNAME=@tu_usuario
PASSWORD=tu_password_seguro
```

⚠️ **Importante**: nunca subas `.env` ni `session.json` al repositorio. Ambos están en `.gitignore`.

---

## ▶️ Uso

Levantar el servidor Express:

```bash
node server.js
```

Por defecto corre en:  
👉 [http://localhost:3000](http://localhost:3000)

Enviar un tweet:

```bash
curl "http://localhost:3000/tweet?text=Hola%20mundo%20🚀"
```

Respuesta inmediata:

```json
{
  "queued": true,
  "message": "Hola mundo 🚀"
}
```

El bot abrirá Puppeteer, iniciará sesión si hace falta y publicará el tweet en tu cuenta.

---

## 📂 Archivos importantes
- `tweet.js` → lógica de login + publicación de tweets
- `server.js` → servidor Express con endpoint `/tweet`
- `.env` → credenciales de usuario (⚠️ privado)
- `session.json` → cookies de sesión guardadas

---

## 🛡️ Notas de seguridad
- Usar una cuenta secundaria para pruebas, ya que Puppeteer simula login y puede activar verificaciones.
- Mantener las credenciales fuera del repositorio (`.env`).
- Podés regenerar sesión borrando `session.json`.

---

## 📜 Licencia
MIT © 2025 — Creado con ❤️ por [TuNombre](https://github.com/tuusuario)
