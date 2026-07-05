import LocalDB from "./LocalDB.js";
import Project from "./Project.js";
import {ToDo} from "./ToDo.js";

import PEN_ICON_PATH from "../img/pen-icon.png";
import TICK_ICON_PATH from "../img/tick.svg";

// index.html based constants (so yes, this module has strong coupling with index.html)
const addBtn = document.querySelector('#main-create-todo-btn');
const createTodoBtn = document.querySelector('#todo-form button[type="submit"]');
const todoForm = document.querySelector('#todo-form');
const addSubtaskBtn = document.querySelector('#add-subtask-btn');
const cardContainer = document.querySelector('main > div');

function initializePage(){
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

    const existingRemoveSubtaskBtns = document.querySelectorAll("#checklist li button:not([id='add-subtask-btn'])");
    for(let btn of [...existingRemoveSubtaskBtns]){
        btn.addEventListener('click', () => {
            btn.parentElement.classList.toggle('removal-animation');
            setTimeout(() => btn.parentElement.remove(), 400);
        })
    }

    createTodoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if(!document.forms['todo-form'].reportValidity()) return;

        // turn nodelist to array, map all textContent to array value, filter off empty values
        let checklist = 
        [...todoForm.querySelectorAll('#checklist input')]
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
        renderToDo(newTodoObject);
    });

    const resetBtn = document.querySelector('#todo-form button[type="reset"]');
    const checklistOrderedList = document.querySelector('#checklist ol');
    resetBtn.addEventListener('click', () => {
        let checklistSubtasks = document.querySelectorAll("#checklist ol li:not(:has(#add-subtask-btn))");
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
        async function autoScroll() {
            if(!startTime) startTime = performance.now();
            let elapsed = performance.now() - startTime;
            scrollContainer.scrollTo({top: scrollContainer.scrollHeight});
            if(elapsed < 500)
                requestAnimationFrame(autoScroll);
        }
        requestAnimationFrame(autoScroll);
    });
    
    

    const priorityRangeInput = document.querySelector('#todo-form .priority-box input[type="range"]');
    const priorityNumberInput = document.querySelector('#todo-form .priority-box input[type="number"]');
    
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

function renderToDo(toDo) {
    let toDoCard = document.createElement('div');
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

                let p = document.createElement('p');
                if(toDo.dueDate instanceof Date && !isNaN(toDo.dueDate))
                    p.textContent = `Due: ${toDo.dueDate} (${toDo.timeLeft.days}D ${toDo.timeLeft.hours}H ${toDo.timeLeft.mins}M left)`;
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
    cardContainer.append(toDoCard);
}

export default {
    initializePage,
};