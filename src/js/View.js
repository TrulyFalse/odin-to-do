import LocalDB from "./LocalDB.js";
import Project from "./Project.js";
import {ToDo} from "./ToDo.js";

// index.html based constants (so yes, this module has strong coupling with index.html)
const addBtn = document.querySelector('#main-create-todo-btn');
const createTodoBtn = document.querySelector('#todo-form button[type="submit"]');
const todoForm = document.querySelector('#todo-form');

function initializePage(){
    addBtn.addEventListener('click', () => {
        addBtn.classList.toggle('open');

        let closeOnExternalClick = (e) => {
            if( [...todoForm.querySelectorAll('*')].includes(e.target) || e.target === todoForm || 
                [...addBtn.querySelectorAll('*')].includes(e.target) || e.target === addBtn) return;
            addBtn.classList.remove('open');
            addBtn.removeEventListener('click', closeOnExternalClick);;
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
        console.log(newTodo);
        LocalDB.getProject(newTodo.project).addToDo(new ToDo(newTodo));
        console.log(LocalDB.projects);
    });


}

export default {
    initializePage,
};