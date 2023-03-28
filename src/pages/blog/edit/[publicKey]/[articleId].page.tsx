import { connect } from 'react-redux';
import { Write } from 'pages/blog/write/index.page';
import { loginMapStateToProps } from 'pages/helper';

export default connect(loginMapStateToProps)(Write);

export const getStaticPaths = async () => ({ paths: [], fallback: true });

export async function getStaticProps(context) {
  return {
    props: {},
  }
}