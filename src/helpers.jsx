export const getRobots = async () => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("getRobots")
      .then(bots => resolve(bots))
      .catch(err => reject(err));
  });
};

export const deleteRobot = async path => {
  return new Promise(async (resolve, reject) => {
    console.log("delete", path);
    window.electron.ipcRenderer
      .invoke("deleteRobot", path)
      .then(bots => resolve(bots))
      .catch(err => reject(err));
  });
};

export const getRobot = async path => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("getRobot", path)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const saveRobot = async robot => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("saveRobot", robot)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const getPositions = async robotPath => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("getPositions", robotPath)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const createPosition = async (path, position) => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("createPosition", path, position)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const deletePosition = async (path, position) => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("deletePosition", path, position)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const updatePosition = async (robotPath, position) => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("updatePosition", robotPath, position)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const saveSequence = async (robotPath, sequence) => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("saveSequence", robotPath, sequence)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const deleteSequence = async (robotPath, sequence) => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("deleteSequence", robotPath, sequence)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const updateSequence = async (robotPath, sequence) => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("updateSequence", robotPath, sequence)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const getSequence = async (robotPath, sequenceID) => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("getSequence", robotPath, sequenceID)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const getServos = async robotPath => {
  return new Promise(async (resolve, reject) => {
    window.electron.ipcRenderer
      .invoke("getServos", robotPath)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};
