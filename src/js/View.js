import LocalDB from "./LocalDB.js";
import Project from "./Project.js";
import {ToDo} from "./ToDo.js";

import PEN_ICON_PATH from "../img/pen-icon.png";
import TICK_ICON_PATH from "../img/tick.svg";

// index.html based constants (so yes, this module has strong coupling with index.html)
const addBtn = document.querySelector('#main-create-todo-btn');
const createTodoBtn = document.querySelector('#create-todo-form button[type="submit"]');
const todoForm = document.querySelector('#create-todo-form');
const addSubtaskBtn = document.querySelector('#add-subtask-btn');
const cardContainer = document.querySelector('main div.card-container');

//console.log(LocalDB.projects);


const sorter = {
    // ENUM values
    ENUM: {
        // sorted by
        TITLE: "title",
        DUE_DATE: "dueDate",
        PRIORITY: "priority",
        PROGRESS: "progressPercentage",
        DONE: "isDone",
        DATE_CREATED: "dateCreated",
        // order
        ASCENDING: "asc",
        DESCENDING: "desc",
    },

    // settings that will hold said ENUM
    sortedBy: undefined,
    order: undefined,

    sort(list){
        let unsortableToDos = [];
        let sortedList = 
        list
        .filter((toDo) => {
            let isSortable = toDo[this.sortedBy] && !isNaN(toDo[this.sortedBy]);
            if(!isSortable) unsortableToDos.push(toDo);
            return isSortable;
        })
        .sort((toDoA, toDoB) => {
            let toDoASortValue = toDoA[this.sortedBy];
            let toDoBSortValue = toDoB[this.sortedBy];
            if(this.order === this.ENUM.ASCENDING){
                if(toDoASortValue < toDoBSortValue) return -1;
                else if(toDoASortValue > toDoBSortValue) return 1;
                else return 0;
            } else {
                if(toDoASortValue < toDoBSortValue) return 1;
                else if(toDoASortValue > toDoBSortValue) return -1;
                else return 0;
            }
        })
        .concat(unsortableToDos);
        return sortedList;
    }
}
sorter.sortedBy = sorter.ENUM.DUE_DATE;
sorter.order = sorter.ENUM.ASCENDING;


// some DB "view" functions of the LocalDB
function allToDos(){
    let allToDos = [];
    for(let project of LocalDB.projects){
        console.log(project.toDoList);
        for(let toDo of project.toDoList)
            allToDos.push(toDo);
    }
    return allToDos;
}
function pendingToday(){
    let toDosToday = [];
    for(let project of LocalDB.projects)
        toDosToday = toDosToday.concat(project.toDoList.filter((toDo) => toDo.dueDate.toDateString() === new Date().toDateString));  
    return toDosToday;
}
function upcomingToDos(){
    let toDosUpcoming = [];
    for(let project of LocalDB.projects)
        toDosUpcoming = toDosUpcoming.concat(project.toDoList.filter((toDo) => toDo.timeLeft.days < 7));  
    return toDosUpcoming;
}
function filteredToDos(filterConstraints){
    // feature to be added later!
}

// setting up a webpage DB-view state, for ease of refreshing 
// (because we are only getting copies of the DB in the frontend and we don't have a live feed of it, we must remember what view of the DB we had to be able to refresh it and sync the changes made)
const DBView = {
    filterConstraints: {
        unifiedSearchString: undefined,
        titleSearchString: undefined,
        descriptionSearchString: undefined,
        dueDateRange: {min: undefined, max: undefined},
        timeLeftRange: {min: undefined, max: undefined},
        priorityRange: {min: undefined, max: undefined},
        projectPool: [],
        checklistFilters: {
            progressRange: {min: undefined, max: undefined},
            numCheckedRange: {min: undefined, max: undefined},
            totalSubtasksRange: {min: undefined, max: undefined}
        },
        isDoneConstraint: undefined,
        dateCreatedRange: {min: undefined, max: undefined},
    },
    currentProjectViewed: undefined,

    // enum
    ENUM: {
        ALL: 'all' ,
        TODAY: 'today',
        UPCOMING: 'upcoming',
        FILTERED: 'filtered',
        PROJECT: 'project',
    },

    // setting holding enum
    currentListSetting: undefined,
    
    list: undefined,
    refreshList(){
        switch(this.currentListSetting){
            case this.ENUM.ALL:
                this.list = sorter.sort(allToDos());
                // console.log(allToDos());
                // console.log(this.list);
                break;
            case this.ENUM.TODAY:
                this.list = sorter.sort(pendingToday());
                break;
            case this.ENUM.UPCOMING:
                this.list = sorter.sort(upcomingToDos());
                break;
            case this.ENUM.FILTERED:
                this.list = sorter.sort(filteredToDos(filterConstraints));
                break;
            case this.ENUM.PROJECT:
                this.list = sorter.sort(LocalDB.getProject(currentProjectViewed));
                break;
            default:
                throw new Error("Unknown state in view config");
        }
    }
}
DBView.currentListSetting = DBView.ENUM.ALL;

function initializePage(){
    DBView.refreshList();
    renderView();
    
    addBtn.addEventListener('click', () => {
        addBtn.classList.toggle('open');

        let closeOnExternalClick = (e) => {
            if( [...todoForm.querySelectorAll('*')].includes(e.target) || e.target === todoForm || 
                [...addBtn.querySelectorAll('*')].includes(e.target) || e.target === addBtn ||
                !e.target.isConnected) return;
            addBtn.classList.remove('open');
            addBtn.removeEventListener('click', closeOnExternalClick);
        };

        document.addEventListener('click', closeOnExternalClick);
    });

    const existingRemoveSubtaskBtns = document.querySelectorAll("#create-todo-form .checklist li button:not([id='add-subtask-btn'])");
    for(let btn of [...existingRemoveSubtaskBtns]){
        btn.addEventListener('click', () => {
            btn.parentElement.classList.toggle('removal-animation');
            setTimeout(() => btn.parentElement.remove(), 400);
        })
    }

    createTodoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if(!document.forms['create-todo-form'].reportValidity()) return;

        // turn nodelist to array, map all textContent to array value, filter off empty values
        let checklist = 
        [...todoForm.querySelectorAll('#create-todo-form .checklist input')]
        .map((value) => {return {description: value.value}})
        .filter((subtask) => subtask.description);

        let form = new FormData(todoForm);
        let newTodo = {
            title: form.get("title"),
            description: form.get("description"),
            dueDate: form.get("due-date"),
            priority: form.get("priority"),
            project: form.get("project"),
            checklist,
        }
        let newTodoObject = new ToDo(newTodo);
        LocalDB.getProject(newTodo.project).addToDo(newTodoObject);
        DBView.refreshList();

        renderToDo(newTodoObject);
        
        // let scrollContainer = document.querySelector('main > .scroll-container');
        // let startTime;
        // function autoScroll() {
        //     if(!startTime) startTime = performance.now();
        //     let elapsed = performance.now() - startTime;
        //     scrollContainer.scrollTo({top: scrollContainer.scrollHeight});
        //     if(elapsed < 500)
        //         requestAnimationFrame(autoScroll);
        // }
        // requestAnimationFrame(autoScroll);
    });

    const resetBtn = document.querySelector('#create-todo-form button[type="reset"]');
    const checklistOrderedList = document.querySelector('#create-todo-form .checklist ol');
    resetBtn.addEventListener('click', () => {
        let checklistSubtasks = document.querySelectorAll("#create-todo-form .checklist ol li:not(:has(#add-subtask-btn))");
        checklistSubtasks.forEach((subtask) => {subtask.remove()});
        for(let i = 0; i < 3; i++){
            let li = document.createElement('li');
                let input = document.createElement('input');
                input.type = 'text';
                li.append(input);

                let btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = '-';
                btn.addEventListener('click', () => {
                    li.classList.toggle('removal-animation');
                    setTimeout(() => li.remove(), 500);
                })
                li.append(btn);
            checklistOrderedList.insertBefore(li, addSubtaskBtn.parentElement);
        }
    })

    const scrollContainer = todoForm.querySelector('.scroll-container');

    addSubtaskBtn.addEventListener('click', () => {
        // HTML structure to be added
        // <li><input type="text"><button type="button">-</button></li>
        let li = document.createElement('li');
            let input = document.createElement('input');
            input.type = 'text';
            li.append(input);

            let btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = '-';
            btn.addEventListener('click', () => {
                li.classList.toggle('removal-animation');
                setTimeout(() => li.remove(), 400);
            })
            li.append(btn);
        
        checklistOrderedList.insertBefore(li, addSubtaskBtn.parentElement);

        let startTime;
        function autoScroll() {
            if(!startTime) startTime = performance.now();
            let elapsed = performance.now() - startTime;
            scrollContainer.scrollTo({top: scrollContainer.scrollHeight});
            if(elapsed < 500)
                requestAnimationFrame(autoScroll);
        }
        requestAnimationFrame(autoScroll);
    });
    
    

    const priorityRangeInput = document.querySelector('#create-todo-form .priority-box input[type="range"]');
    const priorityNumberInput = document.querySelector('#create-todo-form .priority-box input[type="number"]');
    
    priorityRangeInput.addEventListener('input', (e)=>{
        priorityNumberInput.value = e.target.value;
    })

    priorityNumberInput.addEventListener('input', (e)=>{
        if(e.target.value !== ""){
            if(e.target.value < 1) e.target.value = 1;
            else if(e.target.value > 10) e.target.value = 10;
            priorityRangeInput.value = e.target.value;
        } else priorityRangeInput.value = 1;
    })
    priorityNumberInput.addEventListener('blur', (e) => {
        if(e.target.value === "") e.target.value = 1;
    })


    const editDialogCloseBtn = document.querySelector('#todo-edit-dialog button.close-dialog');
    const editDialog = document.querySelector('#todo-edit-dialog');
    editDialogCloseBtn.addEventListener('click', (e) => {
        let cancelDialogEvent = new Event('cancel');
        editDialog.dispatchEvent(cancelDialogEvent);
    })
    editDialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        editDialog.classList.remove('open');
        setTimeout(() => {editDialog.close()}, 1000);
    })
}


function renderToDo(toDo) {
    let indexOfNewToDo = DBView.list.findIndex((item) => item.id === toDo.id);
    if(indexOfNewToDo === -1) console.log( "Card doesn't appear in current view.");

    let toDoCard = document.createElement('div');
    toDoCard.dataset.id = toDo.id;
    toDoCard.classList.toggle('todo-card');

        let header = document.createElement('div');
        header.classList.toggle('header');

            let h3 = document.createElement('h3');
            h3.textContent = toDo.title;
            header.append(h3);

            let btn = document.createElement('button');
            btn.type = 'button';
            btn.addEventListener('click', () => {
                editTodo(toDo);
            })

                let img = document.createElement('img');
                img.src = PEN_ICON_PATH;
                img.alt = "edit pen icon";
                btn.append(img);
            
            header.append(btn);
        toDoCard.append(header);

        let textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.textContent = toDo.description;
        toDoCard.append(textarea);
        
        let toDoStatus = document.createElement('div');
        toDoStatus.classList.toggle('todo-status');
            let isDoneBtn = document.createElement('button');
            let div = document.createElement('div');

            function shortenDate(givenDate){
                let present = new Date();
                let shortDateString = "";
                let dateSuffix = {
                    '1': 'st ',
                    '2': 'nd ',
                    '3': 'rd ',
                }
                if(givenDate.getDate() !== present.getDate() || givenDate.getMonth() !== present.getMonth()) shortDateString += givenDate.getDate().toString() + (dateSuffix[givenDate.getDate().toString().at(-1)] ?? 'th ') + givenDate.toDateString().split(" ")[1];
                if(givenDate.getFullYear() !== present.getFullYear()) shortDateString += " " + givenDate.getFullYear();
                return `${shortDateString} ${givenDate.getHours()}:${givenDate.getMinutes()}`;
            }
            

                let p = document.createElement('p');
                if(toDo.dueDate instanceof Date && !isNaN(toDo.dueDate))
                    p.textContent = `Due: ${shortenDate(toDo.dueDate)} (${toDo.timeLeft.days > 0 ? toDo.timeLeft.days + "D ": ""} ${toDo.timeLeft.hours > 0 ? toDo.timeLeft.hours + "H " : ""} ${toDo.timeLeft.mins > 0 ? toDo.timeLeft.mins : "0"}M left)`;
                else
                    p.textContent = `Due: No deadline`;
                div.append(p);

                p = document.createElement('p');
                p.textContent = 'Priority: ';
                    let span = document.createElement('span');
                    span.textContent = toDo.priority;
                    p.append(span);
                div.append(p);

                let progressDiv = document.createElement("div");
                if(toDo.progress){
                    progressDiv.classList.toggle("progress");
                        p = document.createElement('p');
                        p.textContent = "Checklist: ";

                            let progress = document.createElement('progress');
                            progress.max = toDo.progress.totalSubtasks;
                            progress.value = toDo.progress.numChecked;
                            p.append(progress);
                        let progressFractionTextNode = document.createTextNode(` ${toDo.progress.numChecked}/${toDo.progress.totalSubtasks}`);
                        p.append(progressFractionTextNode);
                        progressDiv.append(p);

                        let ol = document.createElement('ol');
                        ol.classList.toggle('subtasks');

                            for(let i = 0; i < toDo.checklist.length; i++){
                                let li = document.createElement('li');
                                    let div = document.createElement('div');
                                        let label = document.createElement('label');
                                        let uniqueSubtaskID = `toDo-${toDo.id}-subtask-${i}`;
                                        label.setAttribute('for', uniqueSubtaskID);
                                        label.textContent = toDo.checklist[i].description;
                                        div.append(label);

                                        let input = document.createElement('input');
                                        input.type = 'checkbox';
                                        input.id = uniqueSubtaskID;
                                        if(toDo.checklist[i].isDone)
                                            input.checked = true;
                                        input.addEventListener('click', () => {
                                            toDo.checklist[i].isDone = !toDo.checklist[i].isDone;
                                            progress.value = toDo.progress.numChecked;
                                            progressFractionTextNode.data = ` ${toDo.progress.numChecked}/${toDo.progress.totalSubtasks}`;
                                            if(!toDo.progress.isAllComplete && isDoneBtn.classList.contains('done')) isDoneBtn.classList.toggle('done');
                                        })
                                        div.append(input);
                                    li.append(div);
                                ol.append(li);
                            }
                        progressDiv.append(ol);
                    div.append(progressDiv);
                }
            toDoStatus.append(div);
                
            
            isDoneBtn.classList.toggle('is-done-btn');
                let imgDiv = document.createElement('div');
                    img = document.createElement('img');
                    img.src = TICK_ICON_PATH;
                    img.alt = 'tick icon';
                    imgDiv.append(img);
                isDoneBtn.append(imgDiv);
                if(toDo.isDone)
                    isDoneBtn.classList.toggle('done');
                isDoneBtn.addEventListener('click', () => {
                    try{
                        toDo.isDone = !toDo.isDone;
                        isDoneBtn.classList.toggle('done');
                    } catch(e){
                        progressDiv.style.backgroundColor = "rgb(256, 200, 200)";
                        setTimeout(() => {progressDiv.removeAttribute('style')}, 500);
                    }
                })
            toDoStatus.append(isDoneBtn);

            p = document.createElement('p');
            p.textContent = "Done";
            toDoStatus.append(p);
        toDoCard.append(toDoStatus);
    
    let isCardContainerEmptyOfCards = [...cardContainer.querySelectorAll('.todo-card')].length === 0;
    if(!isCardContainerEmptyOfCards){
        // finding a reference to the card node that our new card will be inserted before
        let newToDoIndex = DBView.list.findIndex((currentToDo) => toDo.id === currentToDo.id);
        let adjacentCard = cardContainer.children[newToDoIndex]; // new Todo's to-be adjacent card currently remains at the new Todo's index (because it hasn't been inserted before it yet)
        // inserting before ref node
        if(adjacentCard) 
            cardContainer.insertBefore(toDoCard, adjacentCard);
        else
            cardContainer.append(toDoCard);     // if new todo is at the end of the list, it adjacentCard will be undefined as it accesses array out of index. We need to handle this exception by appending instead.
    } else {
        cardContainer.append(toDoCard);
    }
}

function renderView(){
    for(let toDo of DBView.list){
        renderToDo(toDo);
    }
}

function editTodo(toDo) {
    const editDialog = document.querySelector('#todo-edit-dialog');
    editDialog.querySelector('#edit-title').value = toDo.title;
    editDialog.querySelector('#edit-description').value = toDo.description;
    editDialog.querySelector('#edit-due-date').value = toDo.dueDate;
    editDialog.querySelector('#edit-priority').value = toDo.priority;

    editDialog.showModal();
    editDialog.classList.add('open');
}

export default {
    initializePage,
};