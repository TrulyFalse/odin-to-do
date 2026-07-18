import { allocateID, releaseID } from "./IDAllocator.js";

export class Subtask{
    description;
    isDone;
    #id;

    constructor( {id, description, isDone = false} ){
        this.description = description;
        this.isDone = isDone;
        this.#id = id ?? allocateID();
    }
    get id() {return this.#id;}
}

export class ToDo{
    static MIN_PRIORITY_BOUND = 10;
    #id;
    title;
    description;
    #dueDate;
    #priority;
    #checklist = [];
    #isDone;
    #dateCreated;

    constructor( {id, title, description, dueDate, priority, isDone = false, checklist, dateCreated} ){
        this.#id = id ?? allocateID();
        this.title = title;
        this.description = description;
        this.dueDate = (dueDate instanceof Date) ? dueDate : new Date(dueDate);
        this.#priority = +priority;

        if(checklist)
            for(let item of checklist)
                this.#checklist.push(new Subtask(item));

        this.#isDone = isDone;
        this.#dateCreated = dateCreated ?? new Date();
    }

    get id(){return this.#id;}

    isExpired(){return Date.now() > this.dueDate;}
    get timeLeft() {
        const MILLISECONDS_IN_A_DAY = 1000 * 60 * 60 * 24;

        let timeLeftInMilliseconds = this.dueDate - Date.now();
        let daysLeft = timeLeftInMilliseconds / MILLISECONDS_IN_A_DAY;
        let hoursLeft = (daysLeft % 1) * 24;
        let minsLeft = (hoursLeft % 1) * 60;

        // we now have no use for the decimal portions
        let timeLeft = {
            days : Math.floor(daysLeft),
            hours : Math.floor(hoursLeft),
            mins : Math.floor(minsLeft),
        }
        
        return timeLeft;
        // in view write a string as such: `${timeLeft.days ? timeLeft.days + " day " : ""} ${timeLeft.hours ? timeLeft.hours + " hour " : ""} ${timeLeft.mins} min`
    }
    
    get progress(){
        if(this.checklist.length === 0)
            return null;
        // let numChecked = this.checklist.reduce((count, current) => { if (current.isDone) return count++; }, 0);
        let numChecked = this.checklist.filter((subtask) => subtask.isDone).length;
        let totalSubtasks = this.checklist.length;
        let isAllComplete = numChecked === totalSubtasks;
        return {numChecked, totalSubtasks, isAllComplete};
    }
    get progressPercentage(){
        return (this.progress.numChecked / this.progress.totalSubtasks) * 100;
    }

    get dueDate(){return this.#dueDate;}
    set dueDate(givenDueDate){this.#dueDate = (givenDueDate instanceof Date) ? givenDueDate : new Date(givenDueDate);}

    get priority(){return this.#priority;}
    set priority(givenPriority){
        givenPriority = +givenPriority;
        if( givenPriority > 0 && 
            givenPriority <= ToDo.MIN_PRIORITY_BOUND && 
            Number.isInteger(givenPriority)){
                this.#priority = givenPriority;
            }
    }

    get checklist(){return this.#checklist.slice();}
    editChecklist(givenChecklist){
        let deletedSubtasks = this.#checklist.filter((existingSubtask) => !givenChecklist.find((givenSubtask) => givenSubtask.id === existingSubtask.id));
        deletedSubtasks.forEach((subtask) => {releaseID(subtask.id);});

        let newChecklist = [];
        for(let subtask of givenChecklist){
            if(subtask.id) {
                let referredSubtask = this.#checklist.find((item) => item.id === +subtask.id);
                referredSubtask.description = subtask.description;
                newChecklist.push(referredSubtask);
            } else {
                let newSubtask = new Subtask({description: subtask.description});
                newChecklist.push(newSubtask);
            }     
        }
        this.#checklist = newChecklist;
    }

    delete(){
        releaseID(this.#id);
    }
    
    get isDone(){
        if(this.progress !== null && !this.progress.isAllComplete) this.#isDone = false;
        return this.#isDone;
    }
    set isDone(givenIsDone){
        if(this.progress !== null && this.progress.numChecked < this.progress.totalSubtasks)
            throw new Error("Cannot set task as done while checklist remains incompleted.");
        this.#isDone = givenIsDone;
    }

    get dateCreated() {return this.#dateCreated;}
    
    toJSON(){
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            dueDate: this.dueDate.toJSON(),
            priority: this.priority,
            isDone: this.isDone,
            checklist: this.checklist,
            dateCreated: this.dateCreated.toString(),
        }
    }
}