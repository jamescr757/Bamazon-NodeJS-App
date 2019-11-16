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

// global number of items for user validation
let itemTotal = 0;

// prompt manager with list of choices
function managerQuestions() {
    inquirer.prompt([
        {
            name: "managerAction",
            message: "What action do you want to perform?",
            type: "list",
            choices: ["View products for sale", "View low inventory", "Add to inventory", "Add new product", "Exit"]
        }
    ])
    .then(answer => {
        // switch case to go into different actions
        switch (answer.managerAction) {
            case "View products for sale":
                // function to select and display from products
                displayInventory(managerContinue);
                break;

            case "View low inventory":
                // function to select based on quantity
                displayLowInventory();
                break;

            case "Add to inventory":
                // function that updates values in products
                displayInventory(updateStockQuestions)
                break;

            case "Add new product":
                // function that inserts row into products
                addNewProductQuestions();
                break;

            default:
                // manager chose to exit the program
                connection.end();
                process.exit();
                break;
        }
    })
}

function createInventoryTable(response, fullInventoryBool) {

    const table = new Table({
        head: [chalk.green('Item ID'), chalk.green('Product Name'), chalk.green('Department Name'), chalk.green("Price"), chalk.green('Quantity')]
      , colWidths: [10, 30, 20, 10, 10]
    });

    itemTotal = response.length;

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
function displayInventory(nextFunction) {
    connection.query(
        "SELECT * FROM products",
        (error, response) => {
            if (error) throw error;

            // create new table each time because row values will change
            let table = createInventoryTable(response, true);

            console.log(table.toString());
            nextFunction();
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
            managerContinue();
        }
    );
}

// function to update stock quantity in products
function updateStock(itemId, quantity) {
    connection.query(
        "UPDATE products SET stock_quantity = ? WHERE item_id = ?",
        [
            quantity,
            itemId   
        ],
        function(error, response) {
            if (error) console.log(error);
            
            console.log("\n Item " + chalk.yellow("#" + itemId) + " quantity changed to " + chalk.yellow(quantity) + "\n");
            
            managerContinue();
        }
    );
}

// grab current stock quantity from products
// need item id as an argument
function grabCurrentQuantity(itemId, amountToAdd) {
    connection.query(
        "SELECT stock_quantity FROM products WHERE item_id = ?",
        [
            itemId   
        ],
        function(error, response) {
            if (error) console.log(error);
            
            const currentStock = response[0].stock_quantity;
            const newStock = currentStock + parseInt(amountToAdd);
            
            updateStock(itemId, newStock);
        }
    );
}

function updateStockQuestions() {
    inquirer.prompt([
        {
            name: "userId",
            message: "Add units to which item (please input item ID #)",
        }, 

        {
            name: "userAdd",
            message: "Number to add"
        }
    ])
    .then(answer => {
        // need to validate user input
        // if input NaN for either question need to ask them again
        // if id number greater than total number of items in store, ask again
        if (!parseInt(answer.userId) || !parseInt(answer.userAdd)) {
            console.log(chalk.yellow("\nPlease input a number\n"));
            updateStockQuestions();
        } else if (answer.userId > itemTotal) {
            console.log(chalk.yellow("\nPlease input valid item number\n"));
            updateStockQuestions();
        } else {
            grabCurrentQuantity(answer.userId, answer.userAdd);
        }

        
    })
    .catch(error => {
        console.log(error);
    })
}

// add new product to store, add new row 
// insert into products new row after prompting manager with questions
// need function with questions with insert fxn nested
function addNewProductQuestions() {
    inquirer.prompt([
        {
            message: "Product name:",
            name: "productName",
        },
        {
            message: "Product department:",
            type: "list",
            choices: ["Office Supplies", "Apparel", "Electronics", "Movies", "Games"],
            name: "deptName"
        },
        {
            message: "Product price:",
            name: "userPrice"
        },
        {
            message: "Product quantity:",
            name: "userQuantity",
        }
    ])
    .then(answer => {
        // need to validate price and quantity
        // TODO: validate manager inputs 
        // if all inputs good, run addNewProduct function
        addNewProduct(answer);
    })
    .catch(error => {
        if (error) {
            console.log(error.message);
        }
    })
}

// add row to table products 
// nest managerContinue at end or show them new inventory table?
function addNewProduct(userInputObj) {
    connection.query(`
    INSERT INTO products (product_name, department_name, price, stock_quantity)
    VALUES ("${userInputObj.productName}", "${userInputObj.deptName}", ${userInputObj.userPrice}, ${userInputObj.userQuantity})
    `,
    function(error, response) {
        if (error) console.log(error);
        
        console.log("\n Item " + chalk.yellow(userInputObj.productName) + " added to inventory.\n");

        displayInventory(managerContinue);
    })
}

// function that allows manager to stay continue or exit program
// prompt with a confirm, if yes, run managerQuestions()
// else, terminate connection and process
function managerContinue() {
    inquirer.prompt([
        {
            name: "stayOn",
            message: "Do you want to continue managing inventory?",
            type: "confirm"
        }
    ])
    .then(answer => {
        if (answer.stayOn) {
            managerQuestions();
        } else {
            connection.end();
            process.exit();
        }
    }).catch(error => {
        if (error) {
            console.log(error.message);
        }
    });
}

connection.connect(error => {
    if (error) throw error;
    managerQuestions();
});