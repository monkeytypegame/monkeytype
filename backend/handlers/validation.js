module.exports = {
  isUsernameValid(name) {
    if (name === null || name === undefined || name === "") return false;
    if (/miodec/.test(name.toLowerCase())) return false;
    if (/bitly/.test(name.toLowerCase())) return false;
    if (name.length > 14) return false;
    if (/^\..*/.test(name.toLowerCase())) return false;
    return /^[0-9a-zA-Z_.-]+$/.test(name);
  },
};
