import { RootState } from 'store/configureStore';

export const loginMapStateToProps = (state: RootState) => {
  return {
    isLoggedIn: state.loginReducer.isLoggedIn,
    getMyPublicKey: state.loginReducer.getPublicKey,
    signEvent: state.loginReducer.signEvent,
    myPublicKey: state.loginReducer.publicKey,
    myPrivateKey: state.loginReducer.privateKey,
  };
};
