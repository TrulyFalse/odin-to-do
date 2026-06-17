export default class Project{
    name;
    #toDoList = [];

    constructor(name, toDoList){
        this.name = name;
        if(toDoList) this.#toDoList = toDoList;
    }

    get toDoList(){return this.#toDoList;}
    addToDo(ToDo){this.#toDoList.push(ToDo);}
    removeToDo(index){this.#toDoList.splice(index, 1);}
}