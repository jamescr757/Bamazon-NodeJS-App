const inquirer = require("inquirer");
const chalk = require("chalk");
const mysql = require("mysql");
require("dotenv").config();
const mysqlPassword = process.env.mysql_password;

// table-cli plug-in
const Table = require('cli-table');
 
// instantiate
const table = new Table({
    head: [chalk.green('Item ID'), chalk.green('Product Name'), chalk.green('Department'), chalk.green('Price'), chalk.green('Quantity')]
  , colWidths: [10, 30, 20, 10, 10]
});


// connect to database bamazon
// create a connection 
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3306,
    password: mysqlPassword,
    database: "bamazon"
});

connection.connect(error => {
    if (error) throw error;

    renderTable();
    connection.end();
});

// render all products when run app
// need to select all from Table 
// format, style, and display the info 
function renderTable() {
    connection.query(
        "SELECT * FROM products",
        (error, response) => {
            if (error) throw error;

            // response is an array of objects
            // for each element need to display all keys
            // item_id, product_name, department_name, price, and stock_quantity
            response.forEach(element => {
                table.push([element.item_id, element.product_name, element.department_name, element.price, element.stock_quantity]);
                // console.log(`${element.item_id} ${element.product_name} ${element.department_name} ${element.price} ${element.stock_quantity}`);
            });
            // console.log(response);
            console.log(table.toString());
        }
    )
}



