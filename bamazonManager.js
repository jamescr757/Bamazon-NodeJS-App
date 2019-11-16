const mysql = require("mysql");
const inquirer = require("inquirer");
const chalk = require("chalk");
require("dotenv").config();
const mysqlPassword = process.env.mysql_password;

// table-cli plug-in
const Table = require('cli-table');

// connect to database bamazon
// create a connection 
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3306,
    password: mysqlPassword,
    database: "bamazon"
});

// prompt manager with list of choices
function managerQuestions() {
    inquirer.prompt([
        {
            name: "managerAction",
            message: "Hello Manager. What would you like to do?",
            type: "list",
            choices: ["View products for sale", "View low inventory", "Add to inventory", "Add new product"]
        }
    ])
    .then(answer => {
        // switch case to go into different actions
        switch (answer.managerAction) {
            case "View products for sale":
                // function to select and display from products
                displayInventory();
                break;

            case "View low inventory":
                // function to select based on quantity
                displayLowInventory();
                break;

            case "Add to inventory":
                // function that updates values in products
                break;

            case "Add new product":
                // function that inserts row into products
                break;

            default:
                break;
        }
    })
}

function createInventoryTable(response, fullInventoryBool) {

    const table = new Table({
        head: [chalk.green('Item ID'), chalk.green('Product Name'), chalk.green('Department Name'), chalk.green("Price"), chalk.green('Quantity')]
      , colWidths: [10, 30, 20, 10, 10]
    });

    // response is an array of objects
    // for each element need to display keys relevant to manager
    // item_id, product_name, department_name, price, and stock_quantity
    // warn the manager if stock low by turning quantity number to red if lower than 5
    if (fullInventoryBool) {
        response.forEach(element => {
            if (element.stock_quantity <= 5) {
                table.push([element.item_id, chalk.redBright(element.product_name), element.department_name, element.price, chalk.redBright(element.stock_quantity)]);
            } else {
                table.push([element.item_id, element.product_name, element.department_name, element.price, element.stock_quantity]);
            }
        });
    } else {
        response.forEach(element => {
            table.push([element.item_id, element.product_name, element.department_name, element.price, element.stock_quantity]);
        });
    }

    return table;
}

// function to select and display from products
// create new instance of Table to display information
function displayInventory() {
    connection.query(
        "SELECT * FROM products",
        (error, response) => {
            if (error) throw error;

            // create new table each time because row values will change
            let table = createInventoryTable(response, true);

            console.log(table.toString());
            process.exit();
            connection.end();
        }
    );
}

// select from products where stock_quantity is between 0 and 5 
// create new instance of Table 
// display same table columns as displayInventory 
function displayLowInventory() {
    connection.query(
        "SELECT * FROM products WHERE stock_quantity BETWEEN 0 AND 5",
        (error, response) => {
            if (error) throw error;

            if (response.length === 0) console.log(chalk.green("\nNo low inventory!\n"));
            else {
                // create new table every time because values change
                let table = createInventoryTable(response, false);
    
                console.log(table.toString());
            }

            process.exit();
            connection.end();
        }
    );
}

connection.connect(error => {
    if (error) throw error;

    managerQuestions();
});