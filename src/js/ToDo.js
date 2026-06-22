export class Subtask{
    description;
    isDone;

    constructor( {description, isDone = false} ){
        this.description = description;
        this.isDone = isDone;
    }
}

export class ToDo{
    static MIN_PRIORITY_BOUND = 10;
    title;
    description;
    dueDate;
    #priority;
    #checklist = [];
    #isDone;

    constructor( {title, description, dueDate, priority, isDone = false, checklist} ){
        this.title = title;
        this.description = description;
        this.dueDate = (dueDate instanceof Date) ? dueDate : new Date(dueDate);
        this.priority = priority;

        if(checklist)
            for(let item of checklist)
                this.#checklist.push(new Subtask(item));

        this.#isDone = isDone;
    }

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
        if(this.checklist.length == 0)
            return 'N/A';
        let numChecked = this.checklist.reduce((count, current) => { if (current.isDone) return count++; }, 0);
        let percentageDone = (numChecked / this.checklist.length) * 100;
        return percentageDone;
    }

    get priority(){return this.#priority;}
    set priority(givenPriority){
        if( givenPriority > 0 && 
            givenPriority <= ToDo.MIN_PRIORITY_BOUND && 
            Number.isInteger(givenPriority)){
                this.#priority = givenPriority;
            }
    }

    get checklist(){return this.#checklist.slice();}
    addSubtask(newTaskDescription){
        this.#checklist.push(new Subtask({description: newTaskDescription}));
    }
    deleteSubtask(index){this.#checklist.splice(index, 1);}
    
    get isDone(){return this.#isDone;}
    set isDone(givenIsDone){
        if(this.progress !== 'N/A' && this.progress !== 100)
            throw new Error("Cannot set task as done while checklist remains incompleted.");
        this.#isDone = givenIsDone;
    }

    toJSON(){
        return {
            title: this.title,
            description: this.description,
            dueDate: this.dueDate.toJSON(),
            priority: this.priority,
            isDone: this.isDone,
            checklist: this.checklist,
        }
    }
}
