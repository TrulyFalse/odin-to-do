import DB from "./LocalDB.js";
import Project from "./Project.js";

// index.html based constants (so yes, this module has strong coupling with index.html)
const addBtn = document.querySelector('#main-create-todo-btn');
const createTodoBtn = document.querySelector('#todo-form > button');
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

    createTodoBtn.addEventListener("click", () => {
        let subtasks = todoForm.querySelectorAll('#checklist input').forEach((inputElement) => inputElement.textContent);
        let form = new FormData(todoForm);
        let newTodo = {
            title: form.get("title"),
            description: form.get("description"),
            dueDate: form.get("due-date"),
            priority: form.get("priority"),
            subtasks,
        }
        DB.projects
    })
}

export default {
    initializePage,
};