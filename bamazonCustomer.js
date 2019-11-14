const inquirer = require("inquirer");
const chalk = require("chalk");
const mysql = require("mysql");
require("dotenv").config();
const mysqlPassword = process.env.mysql_password;

