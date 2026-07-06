import Project from "./Project.js";

const LOCAL_STORAGE_KEY = 'projects';
let projects = [];

function initialize(){
    if(!localStorage[LOCAL_STORAGE_KEY]){
        let generalProject = new Project({name: "General", toDoList: []});
        projects.push(generalProject);
    } else this.deserialize();
}

function getProject(name){return projects.find((project) => project.name === name);}
function addProject(project){
    if(!getProject(project.name))
        projects.push(project);
    else
        throw new Error("Project names must be unique!");
}
function removeProject(index) {
    if(projects[index].name === "General")
        throw new Error("'General' project is not deletable as it constitutes the primary folder for storing To-Dos.");
    projects.splice(index, 1);
}

function serialize(){localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(projects);}
function deserialize(){
    let rawProjects = JSON.parse(localStorage[LOCAL_STORAGE_KEY]); // "raw" because these objects only store project's attributes but lack methods an actual Project instance would have (since JSON can't store functions)
    for(let rawProject of rawProjects)
        projects.push(new Project(rawProject));
}


function pendingToday(){
    let toDosToday = [];
    for(let project in projects)
        toDosToday = toDosToday.concat(project.toDoList.filter((toDo) => toDo.dueDate.toDateString() === new Date().toDateString));
    
    return toDosToday;
}

export default { projects, initialize, getProject, addProject, removeProject, serialize, deserialize, pendingToday};