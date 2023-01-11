export const loginReducer = (
  state = {
    isLoggedIn: false,
    publicKey: '',
    privateKey: '',
  },
  action,
) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        isLoggedIn: true,
        publicKey: action.publicKey,
        privateKey: action.privateKey,
      };
    case 'LOGOUT':
      return {
        isLoggedIn: false,
        publicKey: '',
        privateKey: '',
      };
    default:
      return state;
  }
};
