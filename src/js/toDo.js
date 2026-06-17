export class Subtask{
    description;
    isDone;

    constructor(description, isDone = false){
        this.description = description;
        this.isDone = isDone;
    }
}

export class ToDo{
    title;
    description;
    dueDate;
    priority;
    #checklist = [];
    #isDone;

    constructor(title, description, dueDate, priority, checklist, isDone){
        this.title = title;
        this.description = description;
        this.dueDate = (dueDate instanceof Date) ? dueDate : new Date(dueDate);
        this.priority = priority;
        if(checklist) this.#checklist = checklist;
        this.#isDone = isDone;
    }

    isExpired(){return Date.now() > this.dueDate;}
    
    get progress(){
        if(this.checklist.length == 0)
            return 'N/A';
        let numChecked = this.checklist.reduce((count, current) => { if (current.isDone) return count++; }, 0);
        let percentageDone = (numChecked / this.checklist.length) * 100;
        return percentageDone;
    }


    get checklist(){return this.#checklist;}
    addSubtask(newTaskDescription){this.#checklist.push(new Subtask(newTaskDescription));}
    deleteSubtask(index){this.#checklist.splice(index, 1);}
    
    get isDone(){return this.#isDone;}
    set isDone(givenIsDone){
        if(this.progress !== 'N/A' && this.progress !== 100)
            throw new Error("Cannot set task as done while checklist remains incompleted.");
        this.#isDone = givenIsDone;
    }
}
