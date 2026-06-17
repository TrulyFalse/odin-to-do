import Project from "./Project.js";

const LOCAL_STORAGE_KEY = 'projects';
let projects = [];

function initialize(){
    if(!localStorage[LOCAL_STORAGE_KEY]){
        let generalProject = new Project("General");
        projects.push(generalProject);
    } else this.deserialize();
}

function getProjects(){return projects.slice();}
function addProject(project){projects.push(project);}
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

export default { initialize, getProjects, addProject, removeProject, serialize, deserialize};