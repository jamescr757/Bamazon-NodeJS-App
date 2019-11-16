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

// global number of departments for user validation
let departmentTotal = 0;

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

function createDepartmentSalesTable(response) {

    const table = new Table({
        head: [chalk.green('Department ID'), chalk.green('Department Name'), chalk.green('Overhead Costs'), chalk.green("Product Sales"), chalk.green('Total Profit')]
      , colWidths: [15, 30, 20, 20, 20]
    });

    departmentTotal = response.length;
    
    // TODO: converting product sales data from products table and displaying it

    // response is an array of objects
    // for each element need to display keys relevant to supervisor
    // department_id, department_name, overhead_costs, product_sales, total_profit
    // total_profit and product_sales not in response object, calculate by subtracting overhead_costs from product_sales
    response.forEach(element => {
        const total_profit = product_sales - element.overhead_costs;
        table.push([element.department_id, element.department_name, element.overhead_costs, product_sales, total_profit]);
    });
    
    return table;
}

// function to select and display from departments
// create new instance of Table to display information
function displayDepartmentSales(nextFunction) {
    connection.query(
        "SELECT * FROM departments",
        (error, response) => {
            if (error) throw error;

            // create new table each time because row values will change
            let table = createDepartmentSalesTable(response);

            console.log(table.toString());
            nextFunction();
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
        // TODO: validate supervisor inputs 
        // if all inputs good, run addNewDepartment function
        addNewDepartment(answer);
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
        
        console.log("\n Department " + chalk.yellow(userInputObj.deptName) + " added to store.\n");

        displayDepartmentSales(supervisorContinue);
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