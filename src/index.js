const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = []; //To emulate the database

// Middleware
function verifyAccountExistenceByCPF(request, response, next){
    const { cpf } = request.headers;
    
    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({error: "Customer not found"});
    }

    // Inserting information into request so it's possible to retrive inside the route
    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
      if (operation.type === "credit") {
        return acc + operation.amount;
      } else {
        return acc - operation.amount;
      }
    }, 0);

    return balance
}

/**
 * -- BODY MODEL FOR ACCOUNT --
 * cpf - string
 * name - string
 * id - uuid: universally unique identifier
 * statement []
 */
app.post("/account", (request, response) =>{
    const { cpf, name } = request.body;

    const customerExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if(customerExists){
        return response.status(400).json({ error: "CPF already in use"});
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    return response.status(201).send();
});

app.get("/statement", verifyAccountExistenceByCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer.statement);
});

app.post("/deposit", verifyAccountExistenceByCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementTrasaction = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementTrasaction);

    return response.status(201).send();
});

app.post("/withdraw", verifyAccountExistenceByCPF, (request, response) => {
    const { costumer } = request;
    const { amount } = request.body;
  
    const balance = getBalance(costumer.statements);
  
    if (balance < amount) {
      return response.status(400).json({ error: "Insufficient funds!" });
    }
  
    const statementOperation = {
      amount,
      created_at: new Date(),
      type: "debit",
    };
  
    costumer.statements.push(statementOperation);
  
    return response.status(201).send();
  });

app.get("/statement/date", verifyAccountExistenceByCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormart = new Date(date + " 00:00"); // Regardless of time

    const statement = customer.statement.filter(
        (statement) =>
        statement.created_at.toDateString() === new Date(dateFormart).toDateString());
    
    return response.json(statement);
});

app.listen(3333);
