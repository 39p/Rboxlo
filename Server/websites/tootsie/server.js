const bp = require("body-parser")
const cookieSession = require("cookie-session")
const cookieParser = require("cookie-parser")
const express = require("express")
const exphbs = require("express-handlebars")
const layouts = require("handlebars-layouts")
const path = require("path")
const rateLimit = require("express-rate-limit")

const util = require(path.join(global.rboxlo.root, "util"))
const manifest = require(path.join(global.rboxlo.root, "websites", "manifest.json"))

let app = express()
let subdomain = (manifest.tootsie.domain != "INDEX") ? `${manifest.tootsie.domain}.` : ""

// Expose some non-sensitive variables to the view engine
app.locals.rboxlo = {
    name: util.titlecase(global.rboxlo.env.NAME),
    version: util.getVersion(),
    domain: `${global.rboxlo.env.SERVER_HTTPS ? "https://" : "http://"}${subdomain}${global.rboxlo.env.SERVER_DOMAIN}`,
    dsr: (global.rboxlo.env.PRODUCTION ? ".min" : ""), // "Debug Static Resource"
    captcha: {
        enabled: global.rboxlo.env.GOOGLE_RECAPTCHA_ENABLED,
        siteKey: global.rboxlo.env.GOOGLE_RECAPTCHA_SITE_KEY
    }
}

// Set up view engine
let hbs = exphbs.create()

hbs.handlebars.registerHelper(layouts(hbs.handlebars))
hbs.handlebars.registerPartial("partials/layout", "{{prefix}}")

app.engine("handlebars", hbs.engine)
app.set("view engine", "handlebars")
app.set("views", path.join(__dirname, "views"))

// Sessions
app.use(cookieSession({
    name: `${global.rboxlo.env.NAME}_session`,
    keys: [global.rboxlo.env.SERVER_SESSION_SECRET],
    maxAge: (6 * 60 * 60 * 1000) // 6 hours
}))

// Parse requests
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(cookieParser({ secret: global.rboxlo.env.SERVER_COOKIE_SECRET }))

// Use our Rboxlo middleware
app.use(require(path.join(__dirname, "middleware")).obj)

// CSRF protection
app.use((err, req, res, next) => {
    if (err.code !== "EBADCSRFTOKEN") return next(err)

    return res.sendStatus(403)
    // provide no further context
})

// Rate limiting
// NOTE: If you have CloudFlare limits are done automatically
app.use(rateLimit({
    windowMs: (10 * 60 * 1000), // 10 minutes
    max: 100 // 100 requests per 10 minutes
}))

// Routes
app.use(require(path.join(__dirname, "routes")))

// Static resources (CSS, JavaScript, images, etc.)
app.use(express.static(path.join(__dirname, "public")))

module.exports.app = app