const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false, // Set to true for debugging queries
});

module.exports = sequelize;
