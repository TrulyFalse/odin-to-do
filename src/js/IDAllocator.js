let idArr = [];
export function allocateID(){
    let currentVacantID = idArr.findIndex((item, index, arr) => {
        if(!item){
            arr[index] = true;
            return true;
        }
    });
    if(currentVacantID === -1){
        currentVacantID = idArr.length;
        idArr[idArr.length] = true;
    }
    return currentVacantID;
}
export function releaseID(id){ idArr[id] = false; }