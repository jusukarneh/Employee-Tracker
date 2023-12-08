// Import required libraries and modules
const inquirer = require("inquirer");
const mysql = require("mysql2");
const { printTable } = require("console-table-printer");
require("dotenv").config(); // Load environment variables from .env file

// Create a MySQL database connection
const db = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
});

// Connect to the database and start the main menu when connected
db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        return;
    }
    console.log("Connected to the database!");
    mainMenu(); // Call the main menu function when the database connection is established
});

// Define the main menu function
function mainMenu() {
    // Prompt the user with a list of options
    inquirer.prompt({
        type: "list",
        message: "What would you like to do?",
        name: "selection",
        choices: [
            "View all departments",
            "View all roles",
            "View all employees",
            "Add a department",
            "Add a role",
            "Add an employee",
            "Update an employee role",
        ],


    }).then(answer => {
        // Based on the user's selection, call corresponding functions
        if (answer.selection === "View all departments") {
            viewDepartments();
        } else if (answer.selection === "View all roles") {
            viewRoles();
        } else if (answer.selection === "View all employees") {
            viewEmployees();
        } else if (answer.selection === "Add a department") {
            addDepartment();
        } else if (answer.selection === "Add a role") {
            addRole();
        } else if (answer.selection === "Add an employee") {
            addEmployee();
        } else if (answer.selection === "Update an employee role") {
            updateEmployeeRole();
        }
    })
}

// Function to view all departments
function viewDepartments() {
    // Execute a SQL query to retrieve department data and print it as a table
    db.query(`SELECT * FROM department;`, (err, data) => {
        // Use print table to display information cleanly
        printTable(data);
        // Return to the main menu once done displaying the information for the user
        mainMenu();
    })
}

// Function to view all roles
function viewRoles() {
    // Display roles as specified in the SQL query
    db.query(`SELECT role.id, title, salary, name as department FROM role LEFT JOIN department ON department.id = role.department_id;`, (err, data) => {
        printTable(data);
        mainMenu();
    })
}

// Function to view all employees
function viewEmployees() {
    // Display employees as specified in the SQL query
    db.query(`SELECT employee.id, employee.first_name, employee.last_name, title, name as department, salary, CONCAT(managers.first_name, ' ', managers.last_name) as manager FROM employee 
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON department.id = role.department_id
    LEFT JOIN employee AS managers ON employee.manager_id = managers.id;`, (err, data) => {
        printTable(data);
        mainMenu();
    })
}

// function to add employees
function addEmployee() {
    db.query("SELECT id as value,title as name from role", (err, roleData) => {
        db.query("SELECT id as value,CONCAT(first_name,'',last_name)as name FROM employee WHERE MANAGER_id is null", (err, managerData) => {
            inquirer.prompt([
                {
                    type:"input",
                    message:"what is the first name?",
                    name:"first_name",
                    

                },
                {
                    type:"input",
                    message:"what is the last name?",
                    name:"last_name",

                    

                },
                {
                    type:"list",
                    message:"Choose the following title:",
                    name:"role_id",
                    choices:roleData
                },
                {
                    type:"list",
                    message:"Choose the following manager:",
                    name:"manager_id",
                    choices: managerData
                },

            ]).then(answer=>{
                db.query("INSERT INTO employee (first_name,last_name,role_id,manager_id) VALUE(?,?,?,?)",[answer.first_name, answer.last_name,answer.role_id,answer.manager_id],err=>{
                    viewEmployees()
                })
            })
            
        })
    })

    
}
// Function to update an employee
function updateEmployeeRole(){
    db.query("SELECT id as value,title as name from role", (err, roleData) => {
        db.query("SELECT id as value,CONCAT(first_name,'',last_name)as name FROM employee ", (err, employeeData) => {
            inquirer.prompt([
                
                {
                    type:"list",
                    message:"Choose the following title:",
                    name:"role_id",
                    choices:roleData
                },
                {
                    type:"list",
                    message:"Choose the following employee:",
                    name:"employee_id",
                    choices: employeeData
                },

            ]).then(answer=>{
                db.query("UPDATE employee SET role_id = ? WHERE id= ? ",[answer.role_id,answer.employee_id],err=>{
                    viewEmployees()
                })
            })
            
        })
    }) 
}
// Function to add a department
function addDepartment() {
    // Get user input for the department name
    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the department?",
            name: "name"
        }
    ]).then(answer => {
        // Insert the new department into the database
        db.query(`INSERT INTO department (name) VALUES(?)`, [answer.name], err => {
            console.log("Department added successfully!");
            viewDepartments();
        })
    })
}

// Function to add a role
function addRole() {
    // Use a query to get data from the department table to use as options for the user to choose from
    db.query(`SELECT id as value, name FROM department `, (err, departmentData) => {
        inquirer.prompt([
            {
                type: "input",
                message: "What is the name of the role?",
                name: "title"
            },
            {
                type: "input",
                message: "What is the salary of the role?",
                name: "salary"
            },
            {
                type: "list",
                message: "Which department does the role belong to?",
                name: "department_id",
                // Use dynamic data with departmentData gathered from the query above
                choices: departmentData
            }
        ]).then(answer => {
            // Use a query to add to the role table with values from the user's input
            db.query(`INSERT INTO role (title, salary, department_id) VALUES(?,?,?)`, [answer.title, answer.salary, answer.department_id], err => {
                console.log("Role added successfully!");
                viewRoles();
            })
        })
    })
}

