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

    request.customer = customer;

    return next();
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

app.listen(3333);
