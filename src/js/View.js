import LocalDB from "./LocalDB.js";
import Project from "./Project.js";
import {ToDo} from "./ToDo.js";

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

    createTodoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if(!document.forms['todo-form'].reportValidity()) return;

        // turn nodelist to array, map all textContent to array value, filter off empty values
        let checklist = 
        [...todoForm.querySelectorAll('#checklist input')]
        .map((value) => value.value)
        .filter((value) => value);

        let form = new FormData(todoForm);
        let newTodo = {
            title: form.get("title"),
            description: form.get("description"),
            dueDate: form.get("due-date"),
            priority: form.get("priority"),
            project: form.get("project"),
            checklist,
        }
        LocalDB.getProject(newTodo.project).addToDo(new ToDo(newTodo));
        renderToDo();
    });

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
                btn.remove();
                li.remove();
            })
            li.append(btn);
        let checklistOrderedList = document.querySelector('#checklist ol');
        checklistOrderedList.insertBefore(li, addSubtaskBtn.parentElement);
        let scrollContainer = todoForm.querySelector('.scroll-container');
        scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth',
            
        });
    })

}

function renderToDo(toDo) {
    const PEN_ICON_PATH = "./img/pen-icon.png";
    const TICK_ICON_PATH = "./img/tick.svg";


    // html structure to be made:
    // <div class="todo-card">
    //             <div class="header">
    //                 <h3>Buy all the groceries</h3>
    //                 <button type="button">
    //                     <img src="./img/pen-icon.png" alt="edit pen icon">
    //                 </button>
    //             </div>
    //             <textarea readonly>On the way from college make sure to get the following:
    //                             1. Carrots
    //                             2. Broccoli
    //                             3. Rice
    //                             4. Chicken
    //                         </textarea>
            
    //             <div class="todo-status">
    //                 <div>
    //                     <p>Due: 24th Mar 9:30 AM (2D 19H 3M left)</p>
    //                     <p>Priority: <span>2</span></p>
    //                     <div class="progress">
    //                         <p>Progress: <progress max="4" value="1"></progress> 1/4</p>
    //                         <ol class="subtasks">
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-1">Subtask-1</label><input type="checkbox" id="task-1-subtask-check-1"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-2">Subtask-2</label><input type="checkbox" id="task-1-subtask-check-2"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-3">Subtask-3</label><input type="checkbox" id="task-1-subtask-check-3"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-4">Subtask-4</label><input type="checkbox" id="task-1-subtask-check-4"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-5">Subtask-5</label><input type="checkbox" id="task-1-subtask-check-5"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-6">Subtask-6</label><input type="checkbox" id="task-1-subtask-check-6"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-7">Subtask-7</label><input type="checkbox" id="task-1-subtask-check-7"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                             <li>
    //                                 <div><label for="task-1-subtask-check-8">Subtask-8</label><input type="checkbox" id="task-1-subtask-check-8"
    //                                         name="subtasks-status"></div>
    //                             </li>
    //                         </ol>
    //                     </div>
    //                 </div>
            
            
    //                 <button class="is-done-btn">
    //                     <div><img src="./img/tick.svg" alt="unticked-icon"></div>
    //                 </button>
    //                 <p>Done</p>
    //             </div>
    //         </div>
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
            let div = document.createElement('div');

                let p = document.createElement('p');
                p.textContent = `${toDo.dueDate} (${toDo.timeLeft.days}D ${toDo.timeLeft.hours}H ${toDo.timeLeft.mins}M left)`;
                div.append(p);

                p = document.createElement('p');
                p.textContent = 'Priority: ';
                    let span = document.createElement('span');
                    span.textContent = toDo.priority;
                    p.append(span);
                div.append(p);

                let progressDiv = document.createElement("div");
                progressDiv.classList.toggle("progressDiv");
                    p = document.createElement('p');
                    p.textContent = "progressDiv: ";

                        let progress = document.createElement('progress');
                        progress.max = toDo.progress.totalSubtasks;
                        progress.value = toDo.progress.numChecked;
                        p.append(progress);
                    p.textContent += ` ${toDo.progress.numChecked}/${toDo.progress.totalSubtasks}`;
                    progressDiv.append(p);

                    let ol = document.createElement('ol');
                    ol.classList.toggle('substasks');

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
                                    })
                                li.append(div);
                            ol.append(li);
                        }
                    progressDiv.append(ol);
                div.append(progressDiv);
            toDoStatus.append(div);
                
            btn = document.createElement('button');
            btn.classList.toggle('is-done-btn');
                imgDiv = document.createElement('div');
                    img = document.createElement('img');
                    img.src = TICK_ICON_PATH;
                    img.alt = 'tick icon';
                    imgDiv.append(img);
                btn.append(imgDiv);
                if(toDo.isDone)
                    btn.classList.toggle('done');
                btn.addEventListener('click', () => {
                    toDo.isDone = !toDo.isDone;
                    btn.classList.toggle('done');
                })
            toDoStatus.append(btn);

            p = document.createElement('p');
            p.textContent = "Done";
            toDoStatus.append(p);
        toDoCard.append(toDoStatus);
    cardContainer.append(toDoCard);
}

export default {
    initializePage,
};