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

// global product sales array 
const productSalesArray = [];

// prompt supervisor with list of choices
function supervisorQuestions() {
    inquirer.prompt([
        {
            name: "supervisorAction",
            message: "What action do you want to perform?",
            type: "list",
            choices: ["View Product Sales by Department", "Create New Department", "Exit"]
        }
    ])
    .then(answer => {
        // switch case to go into different actions
        switch (answer.supervisorAction) {
            case "View Product Sales by Department":
                // function to select and display from departments table
                displayDepartmentSales(supervisorContinue);
                break;

            case "Create New Department":
                // function that adds a row to departments table
                addNewDepartmentQuestions();
                break;

            default:
                // supervisor chose to exit the program
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

// grab product_sales data from products table group by department_name
// push into global product sales array
// need to nest a function to keep flow order correct
function grabProductSales(departmentsResponse, nextFunction) {
    connection.query(`
    SELECT department_name, SUM(product_sales) 
    FROM products
    GROUP BY department_name
    `,
    (error, response) => {
        if (error) throw error;

        response.forEach(element => {
            productSalesArray.push(element["SUM(product_sales)"])
        });

        createDepartmentSalesTable(departmentsResponse, nextFunction);
    }
    );
}

function createDepartmentSalesTable(response, nextFunction) {

    const table = new Table({
        head: [chalk.green('Department ID'), chalk.green('Department Name'), chalk.green('Overhead Costs'), chalk.green("Product Sales"), chalk.green('Total Profit')]
      , colWidths: [15, 25, 20, 20, 20]
    });

    // response is an array of objects
    // for each element need to display keys relevant to supervisor
    // department_id, department_name, overhead_costs, product_sales, total_profit
    // total_profit and product_sales not in response object, calculate by subtracting overhead_costs from product_sales
    for (let i = 0; i < response.length; i++) {
        // if product sales is undefined because that department does not have any products
        // happens when the supervisor creates a new dept but has not added any products to it 
        if (!productSalesArray[i]) productSalesArray[i] = 0;
        
        let total_profit = (productSalesArray[i] - response[i].overhead_costs).toFixed(2);

        // if total profit negative alert supervisor by turning number to red
        if (total_profit < 0) total_profit = chalk.redBright(total_profit);

        table.push([response[i].department_id, response[i].department_name, response[i].overhead_costs, productSalesArray[i], total_profit]);
    }
    
    userMessageAndQuestions(table.toString(), nextFunction);
}

// function to select and display from departments
// create new instance of Table to display information
function displayDepartmentSales(nextFunction) {
    connection.query(
        "SELECT * FROM departments",
        (error, response) => {
            if (error) throw error;

            grabProductSales(response, nextFunction);
        }
    );
}

// add new department to store, add new row 
// insert into departments new row after prompting supervisor with questions
// need function with questions with insert fxn nested
function addNewDepartmentQuestions() {
    inquirer.prompt([
        {
            message: "Department name:",
            name: "deptName",
        },
        {
            message: "Overhead cost:",
            name: "overheadCost"
        }
    ])
    .then(answer => {
        // need to validate cost
        // if all inputs good, run addNewDepartment function
        if (!answer.deptName || !answer.overheadCost) {
            userMessageAndQuestions(chalk.yellow("Please input valid information"), addNewDepartmentQuestions);
            
        } else if (!parseInt(answer.overheadCost)) {
            userMessageAndQuestions(chalk.yellow("Please input a number for overhead cost"), addNewDepartmentQuestions);
            
        } else addNewDepartment(answer);

    })
    .catch(error => {
        if (error) {
            console.log(error.message);
        }
    })
}

// add row to table departments 
// nest supervisorContinue at end or show them new inventory table?
function addNewDepartment(userInputObj) {
    connection.query(`
    INSERT INTO departments (department_name, overhead_costs)
    VALUES ("${userInputObj.deptName}", ${userInputObj.overheadCost})
    `,
    function(error, response) {
        if (error) console.log(error);
        
        userMessageAndQuestions("Department " + chalk.yellow(userInputObj.deptName) + " added to store.", supervisorContinue)
    })
}

// function that allows supervisor to stay or exit program
// prompt with a confirm, if yes, run supervisorQuestions()
// else, terminate connection and process
function supervisorContinue() {
    inquirer.prompt([
        {
            name: "stayOn",
            message: "Do you want to continue supervising inventory?",
            type: "confirm"
        }
    ])
    .then(answer => {
        if (answer.stayOn) {
            supervisorQuestions();
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
    supervisorQuestions();
});