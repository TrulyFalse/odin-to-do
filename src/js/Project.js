import {ToDo} from "./ToDo.js";

export default class Project{
    name;
    #toDoList = [];

    constructor( {name, toDoList} ){
        this.name = name;

        if(toDoList) 
            for (let todo of toDoList)
                this.#toDoList.push(new ToDo(todo));
    }

    get toDoList(){return this.#toDoList.slice();}
    addToDo(ToDo){this.#toDoList.push(ToDo);}
    removeToDo(index){this.#toDoList.splice(index, 1);}

    toJSON(){
        return{
            name: this.name,
            toDoList: this.toDoList,
        }
    }
}

console.log(JSON.stringify(new Project({
    name: 'test', 
    toDoList: [
        {
            title:'some todo', 
            description: 'blah lorem ipsum', 
            dueDate: new Date(2026, 10, 15), 
            priority: 2
        }
    ] 
})));