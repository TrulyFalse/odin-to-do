import Project from "./Project.js";
import {ToDo} from "./ToDo.js";

const LOCAL_STORAGE_KEY = 'projects';
let projects = [];

function initialize(){
    if(!localStorage[LOCAL_STORAGE_KEY]){
        // default project
        let generalProject = new Project({name: "General", toDoList: []});
        
        // inserting sample to-do into default project
        let sampleTodo = new ToDo({
            title: "Buy all the groceries",
            description: `On the way from college make sure to get the following:
            1. Carrots
            2. Broccoli
            3. Rice
            4. Chicken`,
            dueDate: new Date('2026-07-20T06:30:00'),
            priority: 2,
            isDone: false,
            checklist: [
                {description: "Carrot"},
                {description: "Broccoli"},
                {description: "Rice"},
                {description: "Chicken"},
                {description: "Jot down expense"},
            ]
        });
        generalProject.addToDo(sampleTodo);
        projects.push(generalProject);

        // inserting sample projects
        projects.push(
            new Project({name: "Groceries", toDoList: []}),
            new Project({name: "Home Assignments", toDoList: []}),
            new Project({name: "Workout", toDoList: []}),
            new Project({name: "Reading", toDoList: []}),
            new Project({name: "Hangouts", toDoList: []}),
            new Project({name: "Gaming", toDoList: []})
        )
    } else deserialize();
}

function getProject(name){return projects.find((project) => project.name === name);}
function addProject(project){
    if(!getProject(project.name))
        projects.push(project);
    else
        throw new Error("Project names must be unique!");
}
function removeProject(name) {
    if(name === "General")
        throw new Error("'General' project is not deletable as it constitutes the primary folder for storing To-Dos.");
    let index = projects.findIndex((project) => project.name === name);
    projects.splice(index, 1);
}

function getProjectOfToDo(givenToDo){
    for(let project of projects)
        for(let toDo of project.toDoList)
            if(toDo.id === givenToDo.id)
                return project;
}
function setProjectOfToDo(givenToDo, givenProjectName){
    getProjectOfToDo(givenToDo).removeToDo(givenToDo);
    getProject(givenProjectName).addToDo(givenToDo);
}

function serialize(toDo){
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(projects);
}
function deserialize(){
    let rawProjects = JSON.parse(localStorage[LOCAL_STORAGE_KEY]); // "raw" because these objects only store project's attributes but lack methods an actual Project instance would have (since JSON can't store functions)
    for(let project of rawProjects)
        projects.push(new Project(project));
}

export default { projects, initialize, getProject, addProject, removeProject, getProjectOfToDo, setProjectOfToDo, serialize, deserialize};