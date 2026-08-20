import LocalDB from "./LocalDB.js";
import Project from "./Project.js";
import {ToDo} from "./ToDo.js";

import PEN_ICON_PATH from "../img/pen-icon.png";
import TICK_ICON_PATH from "../img/tick.svg";
import DELETE_ICON_PATH from "../img/delete.png";
import HIDDEN_MENU_ICON_PATH from "../img/hidden-menu.png";
import FOLDER_ICON_PATH from "../img/project-instance-icon.png";

// index.html based constants (so yes, this module has strong coupling with index.html)
const addBtn = document.querySelector('#main-create-todo-btn');
const createTodoBtn = document.querySelector('#create-todo-form button[type="submit"]');
const createToDoForm = document.querySelector('#create-todo-form');
const editToDoForm = document.querySelector('#edit-todo-form');
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
    for(let project of LocalDB.projects)
        for(let toDo of project.toDoList)
            allToDos.push(toDo);
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
            if( [...createToDoForm.querySelectorAll('*')].includes(e.target) || e.target === createToDoForm || 
                [...addBtn.querySelectorAll('*')].includes(e.target) || e.target === addBtn ||
                !e.target.isConnected) return;
            addBtn.classList.remove('open');
            addBtn.removeEventListener('click', closeOnExternalClick);
        };

        document.addEventListener('click', closeOnExternalClick);
    });

    // ---------------------------------------------------------------------------
    // to-do forms initialization
    const existingRemoveSubtaskBtns = document.querySelectorAll(".checklist li button:not([class='add-subtask-btn'])");
    for(let btn of [...existingRemoveSubtaskBtns]){
        btn.addEventListener('click', () => {
            btn.parentElement.classList.toggle('removal-animation');
            setTimeout(() => btn.parentElement.remove(), 400);
        })
    }

    createTodoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if(!document.forms['create-todo-form'].reportValidity()) return;

        // convert li nodelist into array of subtask strings
        let checklist = 
        [...createToDoForm.querySelectorAll('.checklist input')]
        .map((value) => {return {description: value.value}})
        .filter((subtask) => subtask.description);

        let form = new FormData(createToDoForm);
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
        LocalDB.serialize();
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

    function refreshProjectList(){
        let toDoForms = [...document.querySelectorAll('.todo-form')];
        for(let form of toDoForms){
            const projectSelect = form.querySelector('select[name="project"]');
            projectSelect.innerHTML = "";
            for(let project of LocalDB.projects){
                let option = document.createElement('option');
                option.value = project.name;
                option.textContent = (project.name !== 'General') ? project.name : 'General (Default)';
                projectSelect.append(option);
            }
        }
    }
    refreshProjectList();
    
    let toDoForms = [...document.querySelectorAll('.todo-form')];
    for(let toDoFormElement of toDoForms){
        const resetBtn = toDoFormElement.querySelector('button[type="reset"]');
        const checklistOl = toDoFormElement.querySelector('.checklist ol');
        const addSubtaskBtn = checklistOl.querySelector('.add-subtask-btn');

        resetBtn.addEventListener('click', () => {
            let checklistSubtasks = checklistOl.querySelectorAll("li:not(:has(.add-subtask-btn))");
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
                checklistOl.insertBefore(li, addSubtaskBtn.parentElement);
            }
        });

        const scrollContainer = toDoFormElement.querySelector('.scroll-container');
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
            
            checklistOl.insertBefore(li, addSubtaskBtn.parentElement);

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

        const priorityRangeInput = toDoFormElement.querySelector('.priority-box input[type="range"]');
        const priorityNumberInput = toDoFormElement.querySelector('.priority-box input[type="number"]');
        
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
    }
    

    const editDialogCloseBtn = document.querySelector('#todo-edit-dialog button.close-dialog');
    const editDialog = document.querySelector('#todo-edit-dialog');
    editDialogCloseBtn.addEventListener('click', (e) => {
        let cancelDialogEvent = new Event('cancel');
        editDialog.dispatchEvent(cancelDialogEvent);
    })
    editDialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        editDialog.querySelector('button[type="submit"]').removeEventListener('click', submitEditFunc);
        editDialog.classList.remove('open');
        setTimeout(() => {editDialog.close()}, 1000);
    })



    let projectUlAddBtn = document.querySelector('#project-list li:last-of-type');
    projectUlAddBtn.addEventListener('click', () => {
        // <li><img src="./img/project-instance-icon.png" alt="project-instance-icon">Groceries</li>
        let newProjectLi = document.createElement('li');

        let img = document.createElement('img');
        img.src = FOLDER_ICON_PATH;
        img.alt = "project icon";
        newProjectLi.append(img);

        let nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Enter project name...';
        nameInput.minLength = '1';
        nameInput.maxLength = '25';
        nameInput.required = true;
        nameInput.addEventListener('keydown', (e) => {
            nameInput.setCustomValidity('');
            if(e.key === 'Enter'){
                if(nameInput.checkValidity()) nameInput.blur(); // we blur it so the blur eventListener can be relayed the task of submiting the input
                else nameInput.reportValidity();
            } else if(e.key === 'Escape'){
                e.preventDefault();
                nameInput.parentElement.remove();
            }
        })
        nameInput.addEventListener('blur', () => {
            if(!nameInput.parentElement.isConnected) return;
            if(nameInput.value === "")
                nameInput.parentElement.remove();
            else if (nameInput.value !== "" && nameInput.checkValidity()){
                try{
                    let newProject = new Project({name: nameInput.value});
                    LocalDB.addProject(newProject);
                    nameInput.parentElement.append(document.createTextNode(nameInput.value));
                    nameInput.remove();
                    refreshProjectList();
                }catch(e){
                    nameInput.setCustomValidity(e.message);
                    nameInput.reportValidity();
                }
            }
        })        
        newProjectLi.append(nameInput);
        projectUlAddBtn.parentElement.insertBefore(newProjectLi, projectUlAddBtn);
        nameInput.focus();
    })
}


function renderToDo(toDo) {
    let indexOfNewToDo = DBView.list.findIndex((item) => item.id === toDo.id);
    if(indexOfNewToDo === -1) {
        console.log( "Card doesn't appear in current view.");
        return;
    }

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
                let dropDownMenuUl = header.querySelector('ul.dropdown-menu');
                dropDownMenuUl.classList.toggle('visible');

                let hideOptionsDropdown = (e) => {
                    let isExternalClick = e.target != btn && ![...btn.children].some((child) => e.target === child) &&
                                        e.target != dropDownMenuUl && ![...dropDownMenuUl.children].some((child) => e.target === child);
                    if(isExternalClick){
                        dropDownMenuUl.classList.toggle('visible');
                        document.removeEventListener('click', hideOptionsDropdown);
                    }
                }
                document.addEventListener('click', hideOptionsDropdown);
            })

                let img = document.createElement('img');
                img.src = HIDDEN_MENU_ICON_PATH;
                img.alt = "menu icon";
                btn.append(img);
            
            header.append(btn);

            let dropDownMenuUl = document.createElement('ul');
            dropDownMenuUl.classList.toggle('dropdown-menu');
                let optionLi = document.createElement('li');
                    let editImg = document.createElement('img');
                    editImg.src = PEN_ICON_PATH;
                    optionLi.append(editImg);

                    let optionText = document.createTextNode('Edit');
                    optionLi.append(optionText);
                    optionLi.addEventListener('click', () => {
                        editTodo(toDo);
                    });

                dropDownMenuUl.append(optionLi);

                dropDownMenuUl.append(document.createElement('hr'));

                optionLi = document.createElement('li');
                    let deleteImg = document.createElement('img');
                    deleteImg.src = DELETE_ICON_PATH;
                    optionLi.append(deleteImg);

                    optionText = document.createTextNode('Delete');
                    optionLi.append(optionText);
                    optionLi.addEventListener('click', () => {
                        removeToDo(toDo);
                    });

                dropDownMenuUl.append(optionLi);
            header.append(dropDownMenuUl);
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
                };
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

                                            LocalDB.serialize();
                                        });
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

function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}
async function removeToDo(toDo){
    let toDoCard = cardContainer.querySelector(`.todo-card[data-id="${toDo.id}"]`);
    toDoCard.classList.toggle('removal-animation');
    await sleep(500);
    toDoCard.remove();
}

function renderView(){
    for(let toDo of DBView.list){
        renderToDo(toDo);
    }
}


let submitEditFunc; // putting event listener's variable on global scope to be able to remove it elsewhere.

function editTodo(toDo) {
    const editDialog = document.querySelector('#todo-edit-dialog');
    editDialog.querySelector('#edit-title').value = toDo.title;
    editDialog.querySelector('#edit-description').value = toDo.description;
    editDialog.querySelector('#edit-due-date').value = (!isNaN(toDo.dueDate)) ? toDo.dueDate.toISOString().slice(0, 16) : "";
    editDialog.querySelector('#edit-priority').value = toDo.priority;
    editDialog.querySelector('#edit-priority-direct-input').value = toDo.priority;
    editDialog.querySelector(`#edit-project option[value="${LocalDB.getProjectOfToDo(toDo).name}"]`).selected = true;

    let addSubtaskBtn = editDialog.querySelector('.add-subtask-btn');
    let checklistOl = editDialog.querySelector('.checklist ol');
    let checklistSubtasks = checklistOl.querySelectorAll("li:not(:has(.add-subtask-btn))");
    checklistSubtasks.forEach((subtask) => {subtask.remove()});
    for(let subtask of toDo.checklist){
        let li = document.createElement('li');
            let input = document.createElement('input');
            input.dataset.id = subtask.id;
            input.type = 'text';
            input.value = subtask.description;
            li.append(input);

            let btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = '-';
            btn.addEventListener('click', () => {
                li.classList.toggle('removal-animation');
                setTimeout(() => li.remove(), 500);
            })
            li.append(btn);
        checklistOl.insertBefore(li, addSubtaskBtn.parentElement);
    }

    editDialog.showModal();
    editDialog.classList.add('open');

    let updateTodoBtn = editDialog.querySelector('button[type="submit"]');

    submitEditFunc = async (e) => {
        e.preventDefault();
        if(!document.forms['edit-todo-form'].reportValidity()) return;

        // convert li nodelist into array of subtask strings
        let checklist = 
        [...editDialog.querySelectorAll('.checklist input')]
        .filter((item) => item.value)
        .map((item) => {return {id: +item.dataset.id, description: item.value}});

        let form = new FormData(editToDoForm);
        
        toDo.title = form.get("title");
        toDo.description = form.get("description");
        toDo.dueDate = form.get("due-date");
        toDo.priority = form.get("priority");
        LocalDB.setProjectOfToDo(toDo, form.get("project"));
        toDo.editChecklist(checklist);
        LocalDB.serialize();
        
        let cancelEvent = new Event('cancel');
        editDialog.dispatchEvent(cancelEvent);

        await removeToDo(toDo);
        DBView.refreshList();
        renderToDo(toDo);
        
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
    }

    updateTodoBtn.addEventListener("click", submitEditFunc, {once: true,});
}

export default {
    initializePage,
};