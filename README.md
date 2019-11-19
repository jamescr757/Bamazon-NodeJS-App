# Bamazon NodeJS App

### What this app does:
This app resembles a store's server-side data processing. Customer purchases are tracked in a database, so the store's real-time inventory and product sales can be viewed by managers/supervisors. Furthermore, managers can view product inventory, update inventory, and add products. Lastly, supervisors can add new departments and view product sales by department. Below are gifs showing how the app works from the 3 different view points.

------------

&nbsp;

## Initial Database Configuration 

### Products Table 

![Products Table in Datbase](./images/fresh-products-table.png)

### Departments Table 

![Departments Table in Database](./images/fresh-departments-table.png)

---------

&nbsp;
&nbsp;

## General Tasks: 

* ### Customer purchasing multiple items

    ![Customer Shopping](./images/customer-base.gif)

&nbsp;

* ### Customer purchasing more product than current stock level

    ![Customer Purchasing Low Stock](./images/customer-out.gif)

&nbsp;

* ### Manager viewing/updating inventory

    ![Manager Viewing Inventory](./images/manager-low-add.gif)

--------- 

&nbsp;
&nbsp;

## Adding a New Product: 

* ### Manager adding a new product

    ![Manager Add Product](./images/manager-add-product.gif)

&nbsp;

* ### Customer purchasing a product created in the app

    ![Customer Purchasing New Product](./images/customer-new-product.gif)

&nbsp;

* ### Manager updating inventory for a product created in the app

    ![Manager Updating New Product](./images/manager-updating-new-product.gif)

--------- 

&nbsp;
&nbsp;

## Real-Time Product Sales Numbers: 

* ### Manager viewing updated product sales numbers after numerous purchases

    * Simulating numerous customers buying various items

        ![Customer Shopping Spree](./images/customer-shopping-spree.gif)

    * Image of the final receipt to verify numbers in manager's inventory table

        ![Shopping Spree Receipt](./images/shopping-spree-receipt.png)

    * Updated manager's view of store inventory after running `node bamazonManager.js` (Remember that all of the quantity numbers started at 100)

        ![Manager Store Inventory After Shopping Spree](./images/updated-product-sales.png)

&nbsp;

* ### Supervisor viewing product sales by department

    ![Supervisor Viewing Departments](./images/supervisor-base.gif)

    * Image of supervisor's departments table in order to verify the numbers

        ![Supervisor Departments Table](./images/dept-totals.png)

--------- 

&nbsp;
&nbsp;

## Adding a New Department: 

* ### Supervisor adding a new department

    ![Supervisor Add Department](./images/supervisor-new-dept.gif)

&nbsp;

* ### Manager adding a product to the new department 

    ![Manager Add Product to New Department](./images/manager-add-product-new-dept.gif)

&nbsp;

* ### Customer buying the new product followed by supervisor's updated product sales data

    ![Customer Buy Product from New Department](./images/customer-to-supe-flow.gif)

--------- 

&nbsp;
&nbsp;

## Catching Invalid Inputs:

* ### Customer inputting invalid information

    ![Customer Invalid Inputs](./images/customer-invalid.gif)

&nbsp;

* ### Manager inputting invalid information

    ![Manager Invalid Inputs](./images/manager-invalid.gif)

&nbsp;

* ### Supervisor inputting invalid information

    ![Supervisor Invalid Inputs](./images/supervisor-invalid.gif)
