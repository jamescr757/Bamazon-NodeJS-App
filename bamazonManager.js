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

// global department names array 
const departmentNamesArray = [];

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
                // grab department names from departments table first
                grabDepartmentNames(addNewProductQuestions);
                break;

            default:
                // manager chose to exit the program
                connection.end();
                process.exit();
                break;
        }
    })
}

// function that alerts the user and asks them questions again 
function userMessageAndQuestions(message, nextFunction) {
    console.log(`\n${(message)}\n`);
    nextFunction();
}

function createInventoryTable(response, fullInventoryBool) {

    const table = new Table({
        head: [chalk.green('Item ID'), chalk.green('Product Name'), chalk.green('Department Name'), chalk.green("Price"), chalk.green('Quantity'), chalk.green('Product Sales')]
      , colWidths: [10, 40, 20, 10, 10, 15]
    });

    itemTotal = response.length;

    // response is an array of objects
    // for each element need to display keys relevant to manager
    // item_id, product_name, department_name, price, and stock_quantity
    // warn the manager if stock low by turning quantity number to red if lower than 5
    if (fullInventoryBool) {
        response.forEach(element => {
            if (element.stock_quantity <= 5) {
                table.push([element.item_id, chalk.redBright(element.product_name), element.department_name, element.price, chalk.redBright(element.stock_quantity), element.product_sales]);
            } else {
                table.push([element.item_id, element.product_name, element.department_name, element.price, element.stock_quantity, element.product_sales]);
            }
        });
    } else {
        response.forEach(element => {
            table.push([element.item_id, element.product_name, element.department_name, element.price, element.stock_quantity, element.product_sales]);
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

            userMessageAndQuestions(table.toString(), nextFunction);
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

            if (response.length === 0) userMessageAndQuestions(chalk.green("No low inventory!"), managerContinue);
            else {
                // create new table every time because values change
                let table = createInventoryTable(response, false);
    
                userMessageAndQuestions(table.toString(), managerContinue);
            }
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
        function(error) {
            if (error) console.log(error);
            
            userMessageAndQuestions("Item " + chalk.yellow("#" + itemId) + " quantity changed to " + chalk.yellow(quantity), managerContinue);
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
            const newStock = currentStock + amountToAdd;
            
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
            userMessageAndQuestions(chalk.yellow("Please input a number"), updateStockQuestions);
            
        } else if (answer.userId > itemTotal) {
            userMessageAndQuestions(chalk.yellow("Please input valid item number"), updateStockQuestions);
            
        } else {
            grabCurrentQuantity(answer.userId, parseInt(answer.userAdd));
        }

        
    })
    .catch(error => {
        console.log(error);
    })
}

// grab department_names data from departments table 
// push into department names array
// need to nest a function to keep flow order correct
function grabDepartmentNames(nextFunction) {
    connection.query(`
    SELECT department_name 
    FROM departments
    `,
    (error, response) => {
        if (error) throw error;

        response.forEach(element => {
            departmentNamesArray.push(element.department_name);
        });

        nextFunction();
    }
    );
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
            choices: departmentNamesArray,
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
        // if all inputs good, run addNewProduct function
        if (!answer.productName || !answer.deptName || !answer.userPrice || !answer.userQuantity) {
            userMessageAndQuestions(chalk.yellow("Please input valid information"), addNewProductQuestions);
            
        } else if (!parseFloat(answer.userPrice) || !parseInt(answer.userQuantity)) {
            userMessageAndQuestions(chalk.yellow("Please input a number"), addNewProductQuestions);
            
        } else addNewProduct(answer);

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

        // display new inventory table seems unnecessary if message displayed to manager 
        userMessageAndQuestions("Item " + chalk.yellow(userInputObj.productName) + " added to inventory.", managerContinue);
    })
}

// function that allows manager to stay or exit program
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