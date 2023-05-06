#! /usr/bin/env node

const path = require('node:path');
const fs = require('node:fs');
const readline = require('node:readline');

const FILEPATH = path.join(__dirname, './data/store.json');
const DEFAULT_STORE = { todos: [] };

const addTodo = function (description) {
    const rawStore = fs.readFileSync(FILEPATH, { encoding: 'utf-8' });
    const store = rawStore ? JSON.parse(rawStore) : { ...DEFAULT_STORE };

    const newTodo = {
        id: store.todos.length ? store.todos[store.todos.length - 1].id + 1 : 1,
        desc: description,
        complete: false,
        created: new Date().toISOString(),
    };

    store.todos.push(newTodo);

    fs.truncateSync(FILEPATH, 0);
    fs.writeFileSync(FILEPATH, JSON.stringify(store));

    return true;
}

const getTodos = function () {
    const rawStore = fs.readFileSync(FILEPATH, { encoding: 'utf-8' });
    const { todos } = rawStore ? JSON.parse(rawStore) : { ...DEFAULT_STORE };

    let printString = '';
    let iteration = 0;
    while (iteration < todos.length) {
        const { id, created, complete, desc } = todos[iteration];
        printString += `
        ref: ${id}
        added: ${new Date(created).toDateString()}
        completed: ${complete ? 'Yes' : 'No'}
        ${desc}
        `;
        iteration++;
    }
    return printString;
}

const completeTodo = function (ref) {
    const rawStore = fs.readFileSync(FILEPATH, { encoding: 'utf-8' });
    const store = rawStore ? JSON.parse(rawStore) : { ...DEFAULT_STORE };

    const { todos } = store;
    let iteration = 0;
    while (iteration < todos.length) {
        const item = todos[iteration];
        if (item.id === ref) {
            item.complete = true;
            break;
        }
        iteration++;
    }

    fs.truncateSync(FILEPATH, 0);
    fs.writeFileSync(FILEPATH, JSON.stringify(store));

    return true;
}

const searchArgs = function (args, search) {
    const argString = args.join(' ');
    const result = new RegExp(`(--${search}(\s|=)?(?=(?<${search}>.+)))`, 'ig').exec(argString);
    return result.groups[search] || undefined;
}

const printUsage = function () {
    const text = (`
    usage:
        todo <command>

        commands:

        new:            create a new todo item
        get:            retrieve all todo items
        complete:       mark todo item as complete
            --ref:           reference number of todo item to mark as complete

        help:           show the help screen
    `);
    console.log(text);
}

const args = process.argv;

if (args.length < 3) {
    console.log('Invalid number of arguments received');
    printUsage();
} else {
    try {
        switch (args[2]) {
            case 'new':
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                rl.question('Enter task description\n', function (answer) {
                    if (answer) {
                        addTodo(answer);
                        console.log('Task added');
                    }
                    rl.close();
                });
                break;
            case 'get':
                console.log(getTodos());
                break;
            case 'complete':
                const ref = searchArgs(args.slice(3), 'ref');
                const numRef = parseInt(ref);
                if (!isNaN(numRef)) {
                    completeTodo(numRef);
                    console.log('Task marked as complete');
                } else {
                    throw new Error('Invalid command');
                }
                break;
            case 'help':
                printUsage();
                break;
            default:
                throw new Error('Invalid command');
        }
    } catch (error) {
        console.log(`Error - ${error.message}`);
        printUsage();
    }
}