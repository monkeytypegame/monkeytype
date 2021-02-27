export const testCompleted = firebase
  .functions()
  .httpsCallable("testCompleted");
export const addTag = firebase.functions().httpsCallable("addTag");
export const editTag = firebase.functions().httpsCallable("editTag");
export const removeTag = firebase.functions().httpsCallable("removeTag");
export const updateResultTags = firebase
  .functions()
  .httpsCallable("updateResultTags");
export const saveConfig = firebase.functions().httpsCallable("saveConfig");
export const generatePairingCode = firebase
  .functions()
  .httpsCallable("generatePairingCode");
export const saveLbMemory = firebase.functions().httpsCallable("saveLbMemory");
export const unlinkDiscord = firebase
  .functions()
  .httpsCallable("unlinkDiscord");
export const verifyUser = firebase.functions().httpsCallable("verifyUser");
export const reserveName = firebase
  .functions()
  .httpsCallable("reserveDisplayName");
export const updateEmail = firebase.functions().httpsCallable("updateEmail");
export const namecheck = firebase
  .functions()
  .httpsCallable("checkNameAvailability");
export const getLeaderboard = firebase
  .functions()
  .httpsCallable("getLeaderboard");
export const clearTagPb = firebase.functions().httpsCallable("clearTagPb");
export const changeDisplayName = firebase
  .functions()
  .httpsCallable("changeDisplayName");

export const removeSmallTests = firebase
  .functions()
  .httpsCallable("removeSmallTestsAndQPB");
export const resetPersonalBests = firebase
  .functions()
  .httpsCallable("resetPersonalBests");
