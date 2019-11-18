const inquirer = require("inquirer");
const chalk = require("chalk");
const mysql = require("mysql");
require("dotenv").config();
const mysqlPassword = process.env.mysql_password;

// table-cli plug-in
const Table = require('cli-table');
const table = new Table({
    head: [chalk.green('Item ID'), chalk.green('Product Name'), chalk.green('Price')]
  , colWidths: [10, 30, 10]
});


// global number of items for user validation
let itemTotal = 0;

// global user purchase array
const userPurchases = [];
const userTotals = [];

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

    renderTableAndQuestions();
});

// render all products when run app
// need to select all from Table 
// format, style, and display the info 
function renderTableAndQuestions() {
    connection.query(
        "SELECT * FROM products",
        (error, response) => {
            if (error) throw error;

            itemTotal = response.length;

            // response is an array of objects
            // for each element need to display keys relevant to customer
            // item_id, product_name, and price
            response.forEach(element => {
                table.push([element.item_id, element.product_name, element.price]);
            });

            userMessageAndQuestions(table.toString(), customerPurchaseQuestions);
        }
    )
}

// function that alerts the user and asks them questions again 
function userMessageAndQuestions(message, nextFunction) {
    console.log(`\n${(message)}\n`);
    nextFunction();
}

// ask customer two questions at load 
// what product they would like to buy - need to input a number 
// how much they would like to buy - need to input a number 
function customerPurchaseQuestions() {
    inquirer.prompt([
        {
            name: "userId",
            message: "What product would you like to buy? (please input item ID #)",
        }, 

        {
            name: "userQuantity",
            message: "How much would you like to buy? (please input a number)"
        }
    ])
    .then(answer => {
        // need to validate user input
        // if input NaN for either question need to ask them again
        // if id number greater than total number of items in store, ask again
        if (!parseInt(answer.userId) || !parseInt(answer.userQuantity)) {
            userMessageAndQuestions(chalk.yellowBright("Please input a number"), customerPurchaseQuestions);
        } else if (answer.userId > itemTotal) {
            userMessageAndQuestions(chalk.yellowBright("Please input valid item number"), customerPurchaseQuestions);
        } else {
            // check database quantity to see if user can purchase desired amount
            checkDatabaseQuantity(answer.userId, answer.userQuantity);
        }
        
    })
    .catch(error => {
        console.log(error);
    })
}

// grab info from database column by product id 
// if not enough quantity, alert the customer and prompt them again
// else, update the database and show the customer total cost of purchase
// check price info and multiply by userQuantity - display
function checkDatabaseQuantity(itemId, userAmount) {
    connection.query(
        "SELECT * FROM products WHERE ?",
        {
            item_id: itemId
        },
        function(error, response) {
            if (error) throw error;

            // if database quantity is 0 or less than user purchase, alert and ask question
            // else, let purchase go through and update database
            if (response[0].stock_quantity === 0) {
                userMessageAndQuestions(chalk.yellowBright(`Sorry, ${response[0].product_name} is out of stock.`), keepShoppingQuestion);

            } else if (userAmount > response[0].stock_quantity) {
                userMessageAndQuestions(`Sorry, we only have ${chalk.yellowBright(response[0].stock_quantity)} units in stock. Please purchase less of ${chalk.yellowBright(response[0].product_name)}.`, customerPurchaseQuestions);

            } else {
                // push user purchase object into userPurchases array for receipt later
                userPurchases.push({
                    productName: response[0].product_name,
                    price: response[0].price,
                    amount: userAmount,
                });

                userTotals.push(userAmount * response[0].price);

                userMessageAndQuestions("Thanks for purchasing " + chalk.yellowBright(userAmount) + " " + response[0].product_name + "!", keepShoppingQuestion);

                updateDatabase(response[0], userAmount);
            }
        }
    );
}

// update database if user purchase goes through
// need current database quantity and user amount 
function updateDatabase(databaseInfoObj, userAmount) {
    
    const newQuantity = databaseInfoObj.stock_quantity - userAmount;

    const addToProductSales = parseFloat((databaseInfoObj.price * userAmount).toFixed(2));
    const newProductSales = databaseInfoObj.product_sales + addToProductSales;

    connection.query(`
        UPDATE products 
        SET stock_quantity = ?, product_sales = ? 
        WHERE item_id = ?
        `,
        [
            newQuantity,
            newProductSales,
            databaseInfoObj.item_id   
        ],
        function(error) {
            if (error) console.log(error);
        }
    );
}

// ask user if they want to keep shopping
// if not, terminate connection and process and show receipt 
// otherwise, loop to starter questions
function keepShoppingQuestion() {

    inquirer.prompt([{
        name: "keepShopping",
        message: "Do you want to continue shopping?",
        type: "confirm"
    }])
    .then(answer => {
        if (answer.keepShopping) {
            userMessageAndQuestions(table.toString(), customerPurchaseQuestions);
        
        } else {
            console.log(chalk.cyan("\n\nThanks for shopping with us! Here's your receipt...\n\n"));

            setTimeout(showUserReceipt, 0.75 * 1000);
        }
    })
    .catch(error => {
        if (error) {
            console.log(error);
        }
    })
}

// display receipt to user with the info in userPurchases array
// display product name, how many purchased, subtotal price
// and then at end, show subtotal, tax and total 
// and then thank them 
function showUserReceipt() {

    // empty table to keep info aligned
    const receiptTable = new Table({
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
        , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
        , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
        , 'right': '' , 'right-mid': '' , 'middle': '' },
        colWidths: [25, 15, 15]
    });
    
    // push item info into receipt table
    userPurchases.forEach(element => {
        receiptTable.push([element.productName, `${element.amount} @ $${element.price}`, `$${(element.amount * element.price).toFixed(2)}`]);
    });

    // space out receipt
    receiptTable.push(["", "", ""]); receiptTable.push(["", "", ""]);
    
    // totals part of receipt
    const subTotal = userTotals.reduce((a, b) => a + b);
    receiptTable.push(["", "Sub-total", `$${subTotal.toFixed(2)}`]);
    receiptTable.push(["", "TAX", `$${(subTotal * 0.0825).toFixed(2)}`]);
    receiptTable.push(["", "", "-------"]);
    receiptTable.push(["", "Total", `$${(subTotal * 1.0825).toFixed(2)}`]);

    console.log(receiptTable.toString());
    console.log(""); console.log(""); console.log("");

    connection.end();
    process.exit();
}