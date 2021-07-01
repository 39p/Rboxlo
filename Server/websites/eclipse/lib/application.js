var exports = module.exports = {}

const moment = require("moment")
const path = require("path")
const uuid = require("uuid")

const sql = require(path.join(global.rboxlo.root, "sql"))

/**
 * Checks if a given application exists
 * 
 * @param {string} name Application name
 * @returns {boolean} If the application exists
 */
exports.exists = async (name) => {
    // DEBUG
    if (name == "debug") return true
    
    let result = (await sql.run("SELECT 1 FROM `applications` WHERE `name` = ?", name))

    return !(result.length == 0)
}

/**
 * Returns an array of application names
 * 
 * @returns {array} Application names
 */
exports.fetchAll = async () => {
    let result = (await sql.run("SELECT * FROM `applications`"))

    return result
}

/**
 * Creates an application
 * 
 * @param {string} internalName Application internal name
 * @param {string} displayName Application display name
 * @returns {number} id of new application
 */
exports.create = async (internalName, displayName) => {
    let appUUID = uuid.v4()
    let time = moment().unix()

    await sql.run(
        "INSERT INTO `applications` (`uuid`, `created_timestamp`, `internal_name`, `display_name`) VALUES (?, ?, ?, ?)",
        [appUUID, time, internalName, displayName]
    )

    let result = (await sql.run("SELECT `id` FROM `applications` WHERE `uuid` = ?", appUUID))
    return result[0].id
}