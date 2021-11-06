const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');
const { response } = require('express');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if(!user){
    return response.status(400).json({error: 'Username does not exist!'});
  }

  request.user = user;

  return next();
}

const retrieveTodoInfo = (request, response, next) => {
  const { user } = request;
  const { todos } = user;
  const { id } = request.params;

  const todo = todos.find(todo => todo.id === id);
  if(!todo) {
    return response.status(404).json({error: `Todo ${id} does not exist!` });
  }

  const todoIndex =  todos.indexOf(todo);

  request.todos = todos;
  request.todo = todo;
  request.todoIndex = todoIndex;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  let user = users.find(user => user.username === username);

  if(user){
    return response.status(400).json({error: 'Username already exists!'});
  }

  user = {
    id: uuidv4(), 
    name: name, 
    username: username, 
    todos: []
  }


  users.push(user);

  return response.status(201).send(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.send(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const { id, todos } = user;

  const todo = {
    id,
    title,
    done: false, 
    deadline: new Date(deadline), 
    created_at: new Date()
  }

  todos.push(todo);

  return response.status(201).send(todo);
  
});

app.put('/todos/:id', checksExistsUserAccount, retrieveTodoInfo, (request, response) => {
  const { title, deadline } = request.body;
  const { todos, todo, todoIndex } = request;
  todo.title = title;
  todo.deadline = new Date(deadline);

  todos.splice(todoIndex, 1, todo);

  return response.send(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, retrieveTodoInfo, (request, response) => {
  const { todo } = request;
  todo.done = true;

  return response.send(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, retrieveTodoInfo, (request, response) => {
  const { todos, todoIndex } = request;
  todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = app;