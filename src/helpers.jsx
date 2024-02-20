export const getRobots = async () => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("getRobots")
      .then(bots => resolve(bots))
      .catch(err => reject(err));
  });
};

export const deleteRobot = async path => {
  return new Promise(async (resolve, reject) => {
    console.log("delete", path);
    window.electron
      .invoke("deleteRobot", path)
      .then(bots => resolve(bots))
      .catch(err => reject(err));
  });
};

export const getRobot = async path => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("getRobot", path)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const saveRobot = async robot => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("saveRobot", robot)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const getPositions = async robotPath => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("getPositions", robotPath)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const createPosition = async (path, position) => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("createPosition", path, position)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const deletePosition = async (path, position) => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("deletePosition", path, position)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const updatePosition = async (robotPath, position) => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("updatePosition", robotPath, position)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const saveSequence = async (robotPath, sequence) => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("saveSequence", robotPath, sequence)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const deleteSequence = async (robotPath, sequence) => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("deleteSequence", robotPath, sequence)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const updateSequence = async (robotPath, sequence) => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("updateSequence", robotPath, sequence)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const getSequence = async (robotPath, sequenceID) => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("getSequence", robotPath, sequenceID)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const getServos = async robotPath => {
  return new Promise(async (resolve, reject) => {
    window.electron
      .invoke("getServos", robotPath)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};
