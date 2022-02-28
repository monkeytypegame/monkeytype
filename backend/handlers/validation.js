export function isUsernameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (/.*miodec.*/.test(name.toLowerCase())) return false;
  //sorry for the bad words
  if (
    /.*(bitly|fuck|bitch|shit|pussy|nigga|niqqa|niqqer|nigger|ni99a|ni99er|niggas|niga|niger|cunt|faggot|retard).*/.test(
      name.toLowerCase()
    )
  )
    return false;
  if (name.length > 14) return false;
  if (/^\..*/.test(name.toLowerCase())) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}

export function isTagPresetNameValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 16) return false;
  return /^[0-9a-zA-Z_.-]+$/.test(name);
}
